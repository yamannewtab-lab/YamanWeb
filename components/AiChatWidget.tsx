import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Chat } from '@google/genai';
import { sendAiQuestionToDiscord } from '../discordService';
import { API_KEY } from '../constants';

interface AiChatWidgetProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    t: (key: string) => string;
}

type Message = {
    role: 'user' | 'model';
    text: string;
    id: number;
};

const BotAvatar = () => (
    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-md">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
    </div>
);

const AiChatWidget: React.FC<AiChatWidgetProps> = ({ isOpen, setIsOpen, t }) => {
    const [chat, setChat] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<null | HTMLDivElement>(null);
    const [error, setError] = useState<string | null>(null);

    const initializeChat = () => {
        try {
            if (!API_KEY) {
                throw new Error("API key is not configured in constants.ts");
            }
            const ai = new GoogleGenAI({ apiKey: API_KEY });
            
            const systemInstruction = "You are a helpful and friendly AI assistant for 'Maqra'at Al-Huda', an online platform for learning the Qur'an. Your purpose is to answer user questions about the platform, its courses, Ijazah programs, teachers, schedules, and payment. Be polite, concise, and informative. The platform is run by Qari Yaman Darwish. Always answer in the language of the user's question.";
            
            const chatSession = ai.chats.create({
                model: "gemini-2.5-flash",
                config: {
                    systemInstruction: systemInstruction,
                    maxOutputTokens: 1000,
                },
            });

            setChat(chatSession);
            setError(null);
            if (messages.length === 0 || messages[0]?.text !== t('askAiInitialMessage')) {
                setMessages([{ role: 'model', text: t('askAiInitialMessage'), id: Date.now() }]);
            }

        } catch (e: any) {
            console.error("Failed to initialize AI Chat:", e);
            setError(`Initialization failed: ${e.message}`);
            setChat(null);
            setMessages([{ role: 'model', text: `Sorry, the AI Assistant is currently unavailable. ${e.message}`, id: Date.now() }]);
        }
    };

    useEffect(() => {
        if (isOpen && !chat) {
          initializeChat();
        }
    }, [isOpen, t]);

    useEffect(() => {
        if(isOpen) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isLoading, isOpen]);
    
    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading || !chat || error) return;

        const userMessage: Message = { role: 'user', text: input, id: Date.now() };
        const currentInput = input;
        
        sendAiQuestionToDiscord(currentInput);

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);
        
        const modelMessageId = Date.now() + 1;
        setMessages(prev => [...prev, { role: 'model', text: '', id: modelMessageId }]);

        try {
            const result = await chat.sendMessageStream({ message: currentInput });
            
            let text = '';
            for await (const chunk of result) {
                const chunkText = chunk.text;
                text += chunkText;
                setMessages(prev =>
                    prev.map(msg =>
                        msg.id === modelMessageId
                            ? { ...msg, text: text }
                            : msg
                    )
                );
            }
        } catch (err: any) {
            console.error(err);
             setMessages(prev =>
                prev.map(msg =>
                    msg.id === modelMessageId
                        ? { ...msg, text: `Sorry, I encountered an error. Please try again.` }
                        : msg
                )
            );
        } finally {
            setIsLoading(false);
        }
    };

    const TypingIndicator = () => (
        <div className="flex items-center space-x-1.5 p-3">
            <div className="h-2 w-2 bg-stone-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="h-2 w-2 bg-stone-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="h-2 w-2 bg-stone-500 rounded-full animate-bounce"></div>
        </div>
    );

    const MessageBubble = ({ msg }: { msg: Message }) => (
        <div className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'model' && msg.text && <BotAvatar />}
            {msg.text && (
                 <div className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-3 rounded-2xl ${msg.role === 'user' ? 'bg-gradient-to-br from-amber-500 to-orange-500 text-white rounded-br-none' : 'bg-stone-200 dark:bg-gray-700 text-stone-800 dark:text-gray-200 rounded-bl-none'} shadow-sm whitespace-pre-wrap`}>
                    {msg.text}
                </div>
            )}
        </div>
    );

    return (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 pointer-events-none">
            <div 
                className={`
                    w-[calc(100vw-2rem)] max-w-sm h-[70vh] max-h-[550px] bg-stone-50 dark:bg-slate-900 
                    rounded-2xl shadow-2xl flex flex-col border border-stone-200 dark:border-gray-700
                    origin-bottom-right transition-all duration-300 ease-in-out relative
                    ${isOpen ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto' : 'opacity-0 translate-y-8 scale-95 pointer-events-none'}
                `}
                aria-hidden={!isOpen}
            >
                <div className="relative text-center p-4 border-b border-stone-200/80 dark:border-gray-700/60 flex-shrink-0 bg-stone-50/80 dark:bg-slate-900/80 backdrop-blur-sm">
                    <h2 className="text-xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">{t('askAiPageTitle')}</h2>
                    <p className="text-xs text-stone-500 dark:text-gray-400">{t('askAiPageSubtitle')}</p>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="absolute top-1/2 -translate-y-1/2 right-4 text-stone-500 hover:text-stone-800 dark:text-gray-400 dark:hover:text-white transition-colors"
                        aria-label="Close chat"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                
                <div className="flex-grow overflow-y-auto p-4 space-y-6 custom-scrollbar bg-stone-100 dark:bg-gray-800">
                    {messages.map((msg) => (
                        <MessageBubble key={msg.id} msg={msg} />
                    ))}
                    {isLoading && (
                        <div className="flex items-end gap-2 justify-start">
                            <BotAvatar />
                            <div className="bg-stone-200 dark:bg-gray-700 rounded-2xl rounded-bl-none shadow-sm">
                                <TypingIndicator/>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <div className="p-4 border-t border-stone-200/80 dark:border-gray-700/60 bg-stone-100/50 dark:bg-black/20 backdrop-blur-sm flex-shrink-0">
                    {error && <p className="text-red-500 text-center text-sm mb-2">{error}</p>}
                    <form onSubmit={handleSend} className="flex items-center gap-3">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={t('askAiPlaceholder')}
                            className="flex-grow px-4 py-3 bg-white/80 border border-stone-300 rounded-full shadow-inner focus:outline-none focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 transition-all"
                            disabled={isLoading || !!error || !chat}
                            aria-label="Chat input"
                        />
                        <button 
                            type="submit" 
                            disabled={isLoading || !input.trim() || !!error || !chat}
                            className="bg-amber-500 text-white rounded-full p-3 hover:bg-amber-600 disabled:bg-amber-300 dark:disabled:bg-amber-800 disabled:scale-100 hover:scale-110 transition-all focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-lg"
                            aria-label="Send message"
                        >
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                               <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                            </svg>
                        </button>
                    </form>
                </div>
            </div>

            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    absolute bottom-0 right-0 w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 
                    text-white rounded-full shadow-lg
                    flex items-center justify-center
                    transform hover:scale-110 transition-all duration-300 ease-in-out
                    focus:outline-none focus:ring-4 focus:ring-amber-300 dark:focus:ring-amber-800
                    pointer-events-auto
                    ${isOpen ? 'opacity-0 scale-75 pointer-events-none' : 'opacity-100 scale-100'}
                `}
                aria-label="Open AI Assistant"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
            </button>
        </div>
    );
};

export default AiChatWidget;