import React, { useState, useEffect } from 'react';
import { Page, IjazahApplication, SubmissionType } from '../types';
import ShareButton from './ShareButton';
import Confetti from './Confetti';

interface ThanksPageProps {
    navigateTo: (page: Page) => void;
    t: (key: string) => string;
    registerAgainTarget: Page;
    ijazahApplication: IjazahApplication;
    lastSubmissionType: SubmissionType;
}

const ThanksPage: React.FC<ThanksPageProps> = ({ navigateTo, t, registerAgainTarget, lastSubmissionType }) => {
    const [showConfetti, setShowConfetti] = useState(false);

    useEffect(() => {
        if (lastSubmissionType === 'paid') {
            setShowConfetti(true);
        }
    }, [lastSubmissionType]);

    return (
        <div className="relative text-center py-16">
            {showConfetti && <Confetti />}
            <div className="inline-block bg-green-100 p-4 rounded-full dark:bg-green-900/50">
                <svg className="w-16 h-16 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
            </div>
            <h2 className="mt-6 text-3xl font-bold text-stone-800 dark:text-gray-100">{t('thanksMessage')}</h2>
            <p className="mt-2 text-stone-600 dark:text-gray-400">{t('thanksText')}</p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                 <button 
                    onClick={() => navigateTo('home')} 
                    className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300"
                >
                    {t('backToHome')}
                </button>
                <button 
                    onClick={() => navigateTo(registerAgainTarget)} 
                    className="w-full sm:w-auto bg-stone-200 text-stone-700 font-bold py-3 px-6 rounded-lg shadow-sm hover:shadow-md hover:bg-stone-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 transform hover:-translate-y-0.5 transition-all duration-300"
                >
                    {t('registerAnotherBtn')}
                </button>
                <ShareButton 
                    t={t} 
                    iconOnly 
                    className="bg-stone-200/50 dark:bg-white/10 text-stone-700 dark:text-gray-200 hover:bg-stone-300/50 dark:hover:bg-white/20"
                />
            </div>
        </div>
    );
};

export default ThanksPage;