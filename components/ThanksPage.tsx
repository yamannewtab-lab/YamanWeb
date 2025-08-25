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
    lastSubmittedName: string;
    universalPasscode: string;
}

const ThanksPage: React.FC<ThanksPageProps> = ({ navigateTo, t, registerAgainTarget, lastSubmissionType, lastSubmittedName, universalPasscode }) => {
    const [showConfetti, setShowConfetti] = useState(false);
    const [isPasscodeCopied, setIsPasscodeCopied] = useState(false);

    useEffect(() => {
        if (lastSubmissionType === 'paid' || lastSubmissionType === 'free') {
            setShowConfetti(true);
        }
    }, [lastSubmissionType]);

    const handleCopyPasscode = () => {
        navigator.clipboard.writeText(universalPasscode).then(() => {
            setIsPasscodeCopied(true);
            setTimeout(() => setIsPasscodeCopied(false), 2000);
        }).catch(err => {
            console.error('Failed to copy text: ', err);
        });
    };

    const copyIcon = (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
    );

    const copiedIcon = (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
        </svg>
    );

    return (
        <div className="relative text-center py-16">
            {showConfetti && <Confetti />}
            <div className="inline-block bg-green-900/50 p-4 rounded-full">
                <svg className="w-16 h-16 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
            </div>
            <h2 className="mt-6 text-3xl font-bold text-gray-100">{t('thanksMessage')}</h2>
            <p className="mt-2 text-gray-400">{t('thanksText')}</p>

            <div className="mt-6 max-w-md mx-auto bg-blue-900/50 p-4 rounded-lg border border-blue-500/30">
                <p className="text-sm text-blue-200 font-semibold flex items-center justify-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                       <path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zm4 1a1 1 0 100 2h8a1 1 0 100-2H6z" />
                    </svg>
                    {t('screenshotNote')}
                </p>
            </div>
            
            {lastSubmittedName && (
                <div className="mt-4 max-w-md mx-auto bg-gray-800/50 border border-amber-500/30 p-6 rounded-2xl shadow-lg text-center page-transition">
                    
                    <div className="bg-gray-900 rounded-lg p-4">
                         <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider">{t('nameLabel')}</p>
                         <p className="mt-1 text-2xl font-semibold text-gray-200">{lastSubmittedName}</p>
                    </div>
                    
                    <div className="mt-4 bg-gray-900 rounded-lg p-4">
                        <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider">{t('yourPasscode')}</p>
                        <div className="mt-2 flex items-center justify-center gap-4">
                            <p className="text-4xl font-mono tracking-widest text-amber-400">{universalPasscode}</p>
                            <button 
                                onClick={handleCopyPasscode} 
                                className="bg-gray-700 text-gray-300 p-2 rounded-md hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-gray-500"
                                disabled={isPasscodeCopied}
                                title={isPasscodeCopied ? t('copiedButtonText') : t('copyButtonText')}
                            >
                                {isPasscodeCopied ? copiedIcon : copyIcon}
                            </button>
                        </div>
                    </div>

                    <div className="mt-6 bg-yellow-900/50 p-4 rounded-lg border border-yellow-500/30">
                        <p className="text-sm text-yellow-300">{t('passcodeNameNote')}</p>
                    </div>

                     <div className="mt-6 text-center">
                        <button onClick={() => navigateTo('joinClass')} className="w-full bg-gray-700/50 border border-transparent hover:border-amber-500 text-amber-400 font-bold py-2 px-4 rounded-lg transition-colors duration-200">
                            {t('joinClassPrompt')}
                        </button>
                    </div>
                </div>
            )}

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                 <button 
                    onClick={() => navigateTo('home')} 
                    className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300"
                >
                    {t('backToHome')}
                </button>
                <button 
                    onClick={() => navigateTo(registerAgainTarget)} 
                    className="w-full sm:w-auto bg-gray-700 text-gray-200 font-bold py-3 px-6 rounded-lg shadow-sm hover:shadow-md hover:bg-gray-600 transform hover:-translate-y-0.5 transition-all duration-300"
                >
                    {t('registerAnotherBtn')}
                </button>
                <ShareButton 
                    t={t} 
                    iconOnly 
                    className="bg-white/10 text-gray-200 hover:bg-white/20"
                />
            </div>
        </div>
    );
};

export default ThanksPage;