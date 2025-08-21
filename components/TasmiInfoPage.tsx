import React from 'react';
import { Page } from '../types';

interface TasmiInfoPageProps {
    navigateTo: (page: Page) => void;
    t: (key: string) => string;
}

const TasmiInfoPage: React.FC<TasmiInfoPageProps> = ({ navigateTo, t }) => {
    return (
        <div className="text-center py-16">
            <div className="inline-block bg-amber-100 p-4 rounded-full dark:bg-amber-900/50">
                <svg className="w-16 h-16 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <h2 className="mt-6 text-3xl font-bold text-stone-800 dark:text-gray-100">{t('tasmiInfoTitle')}</h2>
            <p className="mt-4 text-stone-600 dark:text-gray-400">{t('tasmiInfoText1')}</p>
            <p className="mt-2 text-stone-600 dark:text-gray-400">{t('tasmiInfoText2')}</p>
            <div className="mt-8 bg-stone-100 p-4 rounded-lg max-w-md mx-auto dark:bg-gray-800">
                <p className="font-bold text-stone-800 dark:text-gray-200">{t('noteTitle')}</p>
                <p className="text-stone-600 dark:text-gray-400">{t('noteText')}</p>
            </div>
            <div className="mt-12">
                <button onClick={() => navigateTo('home')} className="bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300">{t('backToHome')}</button>
            </div>
        </div>
    );
};

export default TasmiInfoPage;