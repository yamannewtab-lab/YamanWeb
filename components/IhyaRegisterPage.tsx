import React, { useState } from 'react';
import { Page } from '../types';
import { sendIhyaRegistrationToDiscord } from '../discordService';

interface IhyaRegisterPageProps {
    navigateTo: (page: Page) => void;
    t: (key: string) => string;
}

const IhyaRegisterPage: React.FC<IhyaRegisterPageProps> = ({ navigateTo, t }) => {
    const [name, setName] = useState('');
    const [age, setAge] = useState('');
    const [whatsapp, setWhatsapp] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!name.trim() || !age.trim() || !whatsapp.trim() || isSubmitting) return;

        setIsSubmitting(true);
        try {
            await sendIhyaRegistrationToDiscord({ name, age, whatsapp }, t);
            navigateTo('ihyaJoin');
        } catch (error) {
            console.error("Failed to send Ihya registration to Discord:", error);
            alert("An error occurred. Please try again.");
            setIsSubmitting(false);
        }
    };

    return (
        <div className="page-transition">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-100">{t('ihyaRegisterTitle')}</h2>
                <p className="mt-2 text-gray-400">{t('ihyaRegisterSubtitle')}</p>
            </div>
            <form onSubmit={handleSubmit} className="max-w-xl mx-auto">
                <div className="space-y-6">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-300">{t('nameLabel')}</label>
                        <input 
                            type="text" 
                            id="name" 
                            name="name" 
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required 
                            className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-200" 
                        />
                    </div>
                     <div>
                        <label htmlFor="ihya-age" className="block text-sm font-medium text-gray-300">{t('quizAgeLabel')}</label>
                        <input 
                            type="text" 
                            inputMode="decimal" 
                            pattern="[0-9٠-٩]*" 
                            id="ihya-age" 
                            name="age" 
                            value={age}
                            onChange={(e) => setAge(e.target.value)}
                            required 
                            className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-200" 
                        />
                    </div>
                    <div>
                        <label htmlFor="ihya-whatsapp" className="block text-sm font-medium text-gray-300">{t('whatsappLabel')}</label>
                        <input 
                            type="tel" 
                            id="ihya-whatsapp" 
                            name="whatsapp" 
                            value={whatsapp}
                            onChange={(e) => setWhatsapp(e.target.value)}
                            required 
                            className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-200" 
                        />
                    </div>
                </div>
                <div className="mt-8">
                    <button 
                        type="submit" 
                        disabled={isSubmitting}
                        className="w-full flex justify-center items-center bg-gradient-to-r from-sky-500 to-blue-600 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300 ease-in-out disabled:opacity-60 disabled:cursor-wait"
                    >
                        {isSubmitting ? (
                             <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        ) : t('ihyaRegisterButton')}
                    </button>
                </div>
            </form>
            <div className="mt-12 text-center">
                <button onClick={() => navigateTo('ihyaCourse')} className="text-sm font-semibold text-gray-400 hover:text-amber-400 transition-colors">
                    &larr; {t('backButton')}
                </button>
            </div>
        </div>
    );
};

export default IhyaRegisterPage;