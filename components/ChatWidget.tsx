import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { sendChatMessageToDiscord } from '../discordService';

interface ChatWidgetProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    t: (key: string) => string;
    userNameProp?: string;
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


const ChatWidget: React.FC<ChatWidgetProps> = ({ isOpen, setIsOpen, t, userNameProp }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [isWaitingForReply, setIsWaitingForReply] = useState(false);
    const messagesEndRef = useRef<null | HTMLDivElement>(null);
    const notificationTimerRef = useRef<number | null>(null);
    const isOpenRef = useRef(isOpen);
    const userName = userNameProp;

    useEffect(() => {
        isOpenRef.current = isOpen;
    }, [isOpen]);

    // Effect to handle real-time message subscription. Runs whenever `userName` is set.
    useEffect(() => {
        if (!userName) return;

        const handleNewMessage = (payload: any) => {
            const newMessage = payload.new as Message;
            
            if (isOpenRef.current) {
                setMessages(currentMessages => {
                    if (currentMessages.some(m => m.id === newMessage.id)) {
                        return currentMessages;
                    }
                    return [...currentMessages, newMessage];
                });
            }

            if (newMessage.sender_name === 'Admin') {
                if (isOpenRef.current) {
                    setIsWaitingForReply(false);
                    localStorage.setItem('unread_messages_count', '0');
                    window.dispatchEvent(new StorageEvent('storage', { key: 'unread_messages_count', newValue: '0' }));
                } else {
                    const currentCount = parseInt(localStorage.getItem('unread_messages_count') || '0', 10);
                    const newCount = currentCount + 1;
                    localStorage.setItem('unread_messages_count', newCount.toString());
                    window.dispatchEvent(new StorageEvent('storage', { key: 'unread_messages_count', newValue: newCount.toString() }));
                }
            }
        };

        const channel = supabase.channel(`chat_listener_${userName}`);
        const subscription = channel
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `session_id=eq.${userName}` }, handleNewMessage)
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userName]);

    // Effect for fetching message history and polling. Runs only when widget is open.
    useEffect(() => {
        if (!userName || !isOpen) return;

        const fetchMessages = async () => {
            const { data, error } = await supabase
                .from('chat_messages')
                .select('*')
                .eq('session_id', userName)
                .order('created_at', { ascending: true });

            if (error) {
                console.error("Error fetching chat messages:", error);
                return;
            }
            setMessages(data || []);
        };

        fetchMessages();
        const intervalId = setInterval(fetchMessages, 2000);
        return () => {
            clearInterval(intervalId);
        };
    }, [userName, isOpen]);
    
    useEffect(() => {
        if (isWaitingForReply) {
            notificationTimerRef.current = window.setTimeout(() => {
                setIsWaitingForReply(false);
            }, 4000); // Hide after 4 seconds
        }

        return () => {
            if (notificationTimerRef.current) {
                clearTimeout(notificationTimerRef.current);
            }
        };
    }, [isWaitingForReply]);


    useEffect(() => {
        if (isOpen) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isOpen, isWaitingForReply]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isSending || !userName) return;

        setIsSending(true);
        const messageContent = input.trim();
        setInput('');

        const { error } = await supabase
            .from('chat_messages')
            .insert([{ session_id: userName, sender_name: userName, message: messageContent }]);
        
        setIsSending(false);

        if (error) {
            console.error("Error sending message:", error);
            setInput(messageContent); // Restore input on failure
        } else {
            setIsWaitingForReply(true);
            sendChatMessageToDiscord({ name: userName, message: messageContent });
        }
    };

    const MessageBubble = ({ msg }: { msg: Message }) => {
        const isUser = msg.sender_name === userName;
        const isAdmin = msg.sender_name === 'Admin';
        return (
            <div className={`flex items-end gap-2 ${isAdmin ? 'justify-start' : 'justify-end'}`}>
                {isAdmin && <UserAvatar name="A" />}
                <div className={`max-w-[85%] px-3 py-2 rounded-2xl shadow-sm whitespace-pre-wrap text-sm ${
                    isAdmin
                        ? 'bg-gray-700 text-gray-200 rounded-bl-none'
                        : 'bg-gradient-to-br from-amber-500 to-orange-500 text-white rounded-br-none'
                }`}>
                    <p className="font-bold text-xs mb-1">{isUser ? 'You' : msg.sender_name}</p>
                    {msg.message}
                    <p className="text-right text-[10px] text-gray-400 mt-1">{new Date(msg.created_at).toLocaleTimeString()}</p>
                </div>
            </div>
        );
    };

    return (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 pointer-events-none">
            <div
                className={`w-[calc(100vw-2rem)] max-w-sm h-[70vh] max-h-[550px] bg-slate-900 
                    rounded-2xl shadow-2xl flex flex-col border border-gray-700
                    origin-bottom-right transition-all duration-300 ease-in-out
                    ${isOpen ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto' : 'opacity-0 translate-y-8 scale-95 pointer-events-none'}
                `}
                aria-hidden={!isOpen}
            >
                <div className="relative text-center p-3 border-b border-gray-700/60 flex-shrink-0 bg-slate-900/80 backdrop-blur-sm">
                    <h2 className="text-lg font-bold bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">{t('chatWidgetTitle')}</h2>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="absolute top-1/2 -translate-y-1/2 right-2 p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-gray-600/50 transition-all"
                        aria-label="Close chat"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="flex-grow overflow-y-auto p-3 space-y-4 custom-scrollbar bg-gray-800">
                    {messages.map((msg) => <MessageBubble key={msg.id} msg={msg} />)}
                    {isWaitingForReply && (
                        <div className="text-center text-xs text-gray-400 italic py-2">
                           {t('chatWaitingMessage')}
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <div className="p-3 border-t border-gray-700/60 bg-black/20 backdrop-blur-sm flex-shrink-0">
                    <form onSubmit={handleSend} className="flex items-center gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={t('chatPlaceholder')}
                            className="flex-grow w-full px-4 py-2 text-sm bg-gray-700 border border-gray-600 rounded-full shadow-inner focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-200"
                            disabled={isSending || !userName}
                            aria-label="Chat input"
                        />
                        <button
                            type="submit"
                            disabled={isSending || !input.trim() || !userName}
                            className="flex-shrink-0 bg-amber-500 text-white rounded-full p-2.5 hover:bg-amber-600 disabled:bg-amber-800 hover:scale-110 transition-all focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-lg"
                            aria-label="Send message"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                            </svg>
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ChatWidget;