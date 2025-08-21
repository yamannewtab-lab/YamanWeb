import React from 'react';
import { Page } from '../types';
import { sendCourseRegistrationToDiscord } from '../discordService';

interface RegisterPageProps {
    navigateTo: (page: Page) => void;
    t: (key: string) => string;
}

const RegisterPage: React.FC<RegisterPageProps> = ({ navigateTo, t }) => {

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget;
        const formData = new FormData(form);
        const name = formData.get('name') as string;
        const age = formData.get('age') as string;
        const whatsapp = formData.get('whatsapp') as string;
        const source = formData.get('source') as string;
        const about = formData.get('about') as string;

        try {
            await sendCourseRegistrationToDiscord({ name, age, whatsapp, source, about }, t);
        } catch (error) {
            console.error("Failed to send course registration to Discord:", error);
            // We can decide to show an error to the user here, but for now we'll proceed
        }

        navigateTo('thanks');
    };

    return (
        <div>
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100">{t('title')}</h2>
                <p className="mt-2 text-slate-600 dark:text-slate-400">{t('subtitle')}</p>
            </div>
            <form onSubmit={handleSubmit} className="max-w-xl mx-auto">
                <div className="space-y-6">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('nameLabel')}</label>
                        <input type="text" id="name" name="name" required className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-200 dark:border-slate-500 text-black dark:placeholder-slate-500" />
                    </div>
                     <div>
                        <label htmlFor="quiz-age" className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('quizAgeLabel')}</label>
                        <input type="text" inputMode="decimal" pattern="[0-9٠-٩]*" id="quiz-age" name="age" required className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm dark:bg-slate-200 dark:border-slate-500 text-black dark:placeholder-slate-500" />
                    </div>
                    <div>
                        <label htmlFor="whatsapp" className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('whatsappLabel')}</label>
                        <input type="tel" id="whatsapp" name="whatsapp" required className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-200 dark:border-slate-500 text-black dark:placeholder-slate-500" />
                    </div>
                    <div>
                        <label htmlFor="source" className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('sourceLabel')}</label>
                        <input type="text" id="source" name="source" required className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-200 dark:border-slate-500 text-black dark:placeholder-slate-500" />
                    </div>
                    <div>
                        <label htmlFor="about" className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('aboutLabel')}</label>
                        <textarea id="about" name="about" rows={4} required className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-200 dark:border-slate-500 text-black dark:placeholder-slate-500"></textarea>
                    </div>
                </div>
                <div className="mt-8">
                    <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-indigo-700 transition-all text-lg">{t('buttonText')}</button>
                </div>
            </form>
            <div className="mt-12 text-center">
                <button onClick={() => navigateTo('home')} className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors dark:text-slate-400 dark:hover:text-indigo-400">{t('backToHome')}</button>
            </div>
        </div>
    );
};

export default RegisterPage;