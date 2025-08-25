import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { sendChatMessageToDiscord } from '../discordService';

interface ChatWidgetProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    t: (key: string) => string;
}

type Message = {
    id: number;
    sender_name: string;
    message: string;
    created_at: string;
};

const UserAvatar = ({ name }: { name: string }) => (
    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center shadow-md">
        <span className="text-sm font-bold text-white">{name.charAt(0).toUpperCase()}</span>
    </div>
);


const ChatWidget: React.FC<ChatWidgetProps> = ({ isOpen, setIsOpen, t }) => {
    const [userName, setUserName] = useState<string | null>(null);
    const [tempName, setTempName] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [isWaitingForReply, setIsWaitingForReply] = useState(false);
    const messagesEndRef = useRef<null | HTMLDivElement>(null);

    useEffect(() => {
        const storedName = localStorage.getItem('chat_user_name');
        if (storedName) {
            setUserName(storedName);
        }
    }, []);

    useEffect(() => {
        if (isOpen && userName) {
            const fetchMessages = async () => {
                const { data, error } = await supabase
                    .from('chat_messages')
                    .select('*')
                    .eq('session_id', userName)
                    .order('created_at', { ascending: true });

                if (error) {
                    console.error("Error fetching chat messages:", error);
                    return; // Exit if fetching fails
                }
                
                setMessages(data || []);
            };

            fetchMessages();
            const intervalId = setInterval(fetchMessages, 2000);

            const channel = supabase.channel(`chat_${userName}`);
            channel
                .on(
                    'postgres_changes',
                    { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `session_id=eq.${userName}` },
                    (payload) => {
                        const newMessage = payload.new as Message;
                        // Use a callback to ensure we don't add duplicates if a message arrives while fetching
                        setMessages(currentMessages => {
                            if (currentMessages.some(m => m.id === newMessage.id)) {
                                return currentMessages;
                            }
                            return [...currentMessages, newMessage];
                        });

                        if (newMessage.sender_name === 'Admin') {
                            setIsWaitingForReply(false);
                        }
                    }
                )
                .subscribe();

            // Cleanup function
            return () => {
                clearInterval(intervalId);
                supabase.removeChannel(channel);
            };
        }
    }, [isOpen, userName]);


    useEffect(() => {
        if (isOpen) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isOpen, isWaitingForReply]);

    const handleNameSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (tempName.trim()) {
            const finalName = tempName.trim();
            setMessages([]); // Reset messages when name changes
            setUserName(finalName);
            localStorage.setItem('chat_user_name', finalName);
        }
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isSending || !userName) return;

        setIsSending(true);
        const messageContent = input.trim();
        setInput('');

        const { error } = await supabase
            .from('chat_messages')
            .insert([{
                session_id: userName,
                sender_name: userName,
                message: messageContent,
            }]);

        if (error) {
            console.error("Error sending message:", error);
            // Optionally show an error message to the user
            setInput(messageContent); // Restore input on error
        } else {
            sendChatMessageToDiscord({ name: userName, message: messageContent });
            setIsWaitingForReply(true);
        }
        setIsSending(false);
    };

    const WaitingIndicator = () => (
        <p className="text-center text-xs text-gray-400 italic py-2">{t('chatWaitingMessage')}</p>
    );
    
    return (
        <div className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[60] pointer-events-none`}>
             <div 
                className={`
                    w-[calc(100vw-2rem)] max-w-sm h-[70vh] max-h-[550px] bg-slate-900 
                    rounded-2xl shadow-2xl flex flex-col border border-gray-700
                    origin-bottom-right transition-all duration-300 ease-in-out
                    ${isOpen ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto' : 'opacity-0 translate-y-8 scale-95 pointer-events-none'}
                `}
                aria-hidden={!isOpen}
            >
                <div className="relative text-center p-3 border-b border-gray-700/60 flex-shrink-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center">
                    {userName && <UserAvatar name={userName} />}
                    <div className="ml-3 text-left">
                        <h2 className="text-lg font-bold text-gray-100">{userName || t('chatWidgetTitle')}</h2>
                        {userName && <p className="text-xs text-green-400">Online</p>}
                    </div>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="absolute top-1/2 -translate-y-1/2 right-2 p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-gray-600/50 transition-all"
                        aria-label="Close chat"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {!userName ? (
                    <div className="p-6 flex flex-col justify-center items-center h-full">
                        <form onSubmit={handleNameSubmit} className="w-full">
                             <input
                                type="text"
                                value={tempName}
                                onChange={(e) => setTempName(e.target.value)}
                                placeholder={t('chatNamePlaceholder')}
                                autoFocus
                                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-amber-500 focus:border-amber-500 text-gray-200 text-center text-lg"
                            />
                            <button type="submit" className="mt-4 w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold py-3 px-6 rounded-lg">{t('startChatButton')}</button>
                        </form>
                    </div>
                ) : (
                    <>
                         <div className="flex-grow overflow-y-auto p-3 space-y-4 custom-scrollbar bg-gray-800">
                            {messages.map(msg => (
                                 <div key={msg.id} className={`flex items-end gap-2 ${msg.sender_name === 'Admin' ? 'justify-start' : 'justify-end'}`}>
                                    <div className={`max-w-[85%] px-3 py-2 rounded-2xl shadow-sm whitespace-pre-wrap text-sm ${msg.sender_name === 'Admin' ? 'bg-gray-700 text-gray-200 rounded-bl-none' : 'bg-gradient-to-br from-blue-500 to-sky-500 text-white rounded-br-none'}`}>
                                        <p className="font-bold text-xs mb-1 text-amber-300">{msg.sender_name}</p>
                                        {msg.message}
                                        <p className="text-right text-[10px] text-gray-400 mt-1">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                    </div>
                                </div>
                            ))}
                            {isWaitingForReply && <WaitingIndicator />}
                            <div ref={messagesEndRef} />
                         </div>
                         <div className="p-3 border-t border-gray-700/60 bg-black/20 backdrop-blur-sm flex-shrink-0">
                             <form onSubmit={handleSend} className="flex items-center gap-2">
                                 <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder={t('chatPlaceholder')}
                                    className="flex-grow w-full px-4 py-2 text-sm bg-gray-700 border border-gray-600 rounded-full shadow-inner focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-200 transition-all"
                                    disabled={isSending}
                                />
                                <button type="submit" disabled={isSending || !input.trim()} className="flex-shrink-0 bg-amber-500 text-white rounded-full p-2.5 hover:bg-amber-600 disabled:bg-gray-500 transition-all">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                                </button>
                            </form>
                         </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default ChatWidget;
