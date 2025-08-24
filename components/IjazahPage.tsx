import React, { useState, useEffect } from 'react';
import { Page, IjazahApplication } from '../types';

interface IjazahPageProps {
    navigateTo: (page: Page) => void;
    t: (key: string) => string;
    setIjazahApplication: React.Dispatch<React.SetStateAction<IjazahApplication>>;
}

const IjazahPage: React.FC<IjazahPageProps> = ({ navigateTo, t, setIjazahApplication }) => {
    const [step, setStep] = useState<'memorization' | 'path'>('memorization');

    const scrollToTop = () => {
        const mainContent = document.querySelector('main');
        if (mainContent) {
            mainContent.scrollTop = 0;
        }
    };
    
    useEffect(() => {
        scrollToTop();
    }, [step]);

    const handleMemorizationClick = (choice: 'with' | 'without') => {
        setIjazahApplication(prev => ({ ...prev, memorization: choice }));
        setStep('path');
    };

    const handleBackToMemorization = () => {
        setStep('memorization');
    };

    const handleOptionClick = (path: string) => {
        setIjazahApplication(prev => ({ ...prev, path: path }));
        navigateTo('quiz');
    };

    const primaryButtonClasses = "w-full sm:w-auto bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300";
    const secondaryButtonClasses = "w-full sm:w-auto bg-gray-700 text-gray-200 font-bold py-3 px-6 rounded-lg shadow-sm hover:shadow-md hover:bg-gray-600 transform hover:-translate-y-0.5 transition-all duration-300";

    if (step === 'memorization') {
        return (
            <div>
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-gray-100">{t('ijazahMemorizationTitle')}</h2>
                    <p className="mt-2 text-gray-400">{t('ijazahMemorizationSubtitle')}</p>
                </div>
                <div className="mt-8 flex flex-col items-center gap-4">
                    <div className="flex flex-col items-center w-full sm:w-auto">
                        <button onClick={() => handleMemorizationClick('with')} className={`${primaryButtonClasses} text-lg`}>{t('withMemorizationButton')}</button>
                        <span className="mt-2 text-xs bg-gray-600 text-gray-300 font-semibold px-2 py-0.5 rounded-full">{t('withMemorizationButton')}</span>
                    </div>
                    <button onClick={() => handleMemorizationClick('without')} className={`${secondaryButtonClasses} text-lg`}>{t('withoutMemorizationButton')}</button>
                </div>
                <div className="mt-12 text-center">
                    <button onClick={() => navigateTo('home')} className="text-sm font-semibold text-gray-400 hover:text-amber-400 transition-colors">{t('backToHome')}</button>
                </div>
            </div>
        );
    }
    
    return (
        <div>
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-100">{t('ijazahTitle')}</h2>
                <p className="mt-2 text-gray-400">{t('ijazahSubtitle')}</p>
            </div>
            <div className="mt-8 flex flex-col items-center gap-4">
                <button onClick={() => handleOptionClick("Hafs 'an 'Asim")} className={primaryButtonClasses}>{t('hafsButton')}</button>
                <button onClick={() => handleOptionClick("The Ten Recitations")} className={primaryButtonClasses}>{t('tenRecitationsButton')}</button>
                <button onClick={() => handleOptionClick("Different Qira'ah")} className={primaryButtonClasses}>{t('differentQiraahButton')}</button>
            </div>
            <div className="mt-8 text-center">
                <button onClick={handleBackToMemorization} className="text-sm font-semibold text-gray-400 hover:text-amber-400 transition-colors">
                    &larr; {t('backButton')}
                </button>
            </div>
            <div className="mt-4 text-center">
                <button onClick={() => navigateTo('home')} className="text-sm font-semibold text-gray-400 hover:text-amber-400 transition-colors">{t('backToHome')}</button>
            </div>
        </div>
    );
};

export default IjazahPage;