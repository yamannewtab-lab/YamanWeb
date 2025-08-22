import React, { useState } from 'react';
import { Page, IjazahApplication, FaqItem } from '../types';
import Faq from './Faq';
import ShareButton from './ShareButton';

interface ThanksPageProps {
    navigateTo: (page: Page) => void;
    t: (key: string) => string;
    registerAgainTarget: Page;
    ijazahApplication: IjazahApplication;
}

const ThanksPage: React.FC<ThanksPageProps> = ({ navigateTo, t, registerAgainTarget, ijazahApplication }) => {
    const [isFaqOpen, setIsFaqOpen] = useState(false);

    const getFaqData = (): FaqItem[] => {
        let keys: { q: string, a: string }[] = [];
        
        const paymentQuestions = [
            { q: 'faqPayment_q1', a: 'faqPayment_a1_bsi' },
            { q: 'faqPayment_q2', a: 'faqPayment_a2_before_reading' },
        ];
        
        const subscriptionPaymentQuestions = [
            { q: 'faqPayment_q1', a: 'faqPayment_a1_bsi' },
            { q: 'faqPayment_q2', a: 'faqPayment_a2_before_subscription' },
        ];

        if (registerAgainTarget === 'ijazah') {
            if (ijazahApplication.path === 'The Ten Recitations') {
                keys = [
                    { q: 'faqTenQiraat_q1', a: 'faqTenQiraat_a1' },
                    ...paymentQuestions,
                ];
            } else { // Hafs and Different Qira'ah
                keys = [
                    { q: 'faqGeneralIjazah_q1', a: 'faqGeneralIjazah_a1' },
                    { q: 'faqGeneralIjazah_q2', a: 'faqGeneralIjazah_a2' },
                    { q: 'faqGeneralIjazah_q3', a: 'faqGeneralIjazah_a3' },
                    ...paymentQuestions,
                ];
            }
        } else if (registerAgainTarget === 'tajwidImprovement') {
            keys = [
                { q: 'faqTajwid_q1', a: 'faqTajwid_a1' },
                { q: 'faqTajwid_q2', a: 'faqTajwid_a2' },
                { q: 'faqTajwid_q3', a: 'faqTajwid_a3' },
                ...subscriptionPaymentQuestions,
            ];
        }
        
        return keys.map(key => ({ q: t(key.q), a: t(key.a) }));
    };

    const faqData = getFaqData();

    return (
        <>
            <div className="text-center py-16">
                <div className="inline-block bg-green-100 p-4 rounded-full dark:bg-green-900/50">
                    <svg className="w-16 h-16 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                </div>
                <h2 className="mt-6 text-3xl font-bold text-stone-800 dark:text-gray-100">{t('thanksMessage')}</h2>
                <p className="mt-2 text-stone-600 dark:text-gray-400">{t('thanksText')}</p>
                <div className="mt-8 flex flex-col gap-4 justify-center items-center">
                    {faqData.length > 0 && (
                        <button 
                            onClick={() => setIsFaqOpen(true)} 
                            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white/10 text-gray-200 font-semibold px-6 py-3 rounded-lg hover:bg-white/20 transition-all duration-300 border border-white/20 shadow-lg"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                            </svg>
                            {t('faqButtonText')}
                        </button>
                    )}
                    <ShareButton 
                        t={t} 
                        className="w-full sm:w-auto bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg transform hover:scale-105"
                    />
                    <div className="w-full flex flex-col sm:flex-row gap-4 justify-center">
                        <button onClick={() => navigateTo(registerAgainTarget)} className="flex-1 bg-stone-600 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300 dark:bg-gray-600 dark:hover:bg-gray-500">{t('registerAnotherBtn')}</button>
                        <button onClick={() => navigateTo('home')} className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300">{t('backToHome')}</button>
                    </div>
                </div>
            </div>
            {isFaqOpen && <Faq faqs={faqData} onClose={() => setIsFaqOpen(false)} />}
        </>
    );
};

export default ThanksPage;