import React, { useState } from 'react';
import { Page, FaqItem } from '../types';
import Faq from './Faq';

interface TasmiInfoPageProps {
    navigateTo: (page: Page) => void;
    t: (key: string) => string;
}

const TasmiInfoPage: React.FC<TasmiInfoPageProps> = ({ navigateTo, t }) => {
    const [isFaqOpen, setIsFaqOpen] = useState(false);

    const faqData: FaqItem[] = [
        { q: t('faqTasmi_q1'), a: t('faqTasmi_a1') },
        { q: t('faqTasmi_q2'), a: t('faqTasmi_a2') },
        { q: t('faqTasmi_q3'), a: t('faqTasmi_a3') },
    ];

    return (
        <>
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
                <div className="mt-12 flex flex-col gap-4 items-center">
                    <button 
                        onClick={() => setIsFaqOpen(true)} 
                        className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white/10 text-gray-200 font-semibold px-6 py-3 rounded-lg hover:bg-white/20 transition-all duration-300 border border-white/20 shadow-lg"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                        </svg>
                        {t('faqButtonText')}
                    </button>
                    <button onClick={() => navigateTo('home')} className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300">{t('backToHome')}</button>
                </div>
            </div>
            {isFaqOpen && <Faq faqs={faqData} onClose={() => setIsFaqOpen(false)} />}
        </>
    );
};

export default TasmiInfoPage;