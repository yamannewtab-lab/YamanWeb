import React from 'react';
import { Page } from '../types';

interface ThanksPageProps {
    navigateTo: (page: Page) => void;
    t: (key: string) => string;
    registerAgainTarget: Page;
}

const ThanksPage: React.FC<ThanksPageProps> = ({ navigateTo, t, registerAgainTarget }) => {
    return (
        <div className="text-center py-16">
            <div className="inline-block bg-green-100 p-4 rounded-full dark:bg-green-900/50">
                <svg className="w-16 h-16 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
            </div>
            <h2 className="mt-6 text-3xl font-bold text-stone-800 dark:text-gray-100">{t('thanksMessage')}</h2>
            <p className="mt-2 text-stone-600 dark:text-gray-400">{t('thanksText')}</p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                <button onClick={() => navigateTo(registerAgainTarget)} className="bg-stone-600 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300 dark:bg-gray-600 dark:hover:bg-gray-500">{t('registerAnotherBtn')}</button>
                <button onClick={() => navigateTo('home')} className="bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300">{t('backToHome')}</button>
            </div>
        </div>
    );
};

export default ThanksPage;