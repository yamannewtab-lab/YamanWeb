import React, { useState } from 'react';
import { Page, IjazahApplication, SubmissionType } from '../types';
import { IJAZAH_PRICES, PATH_TRANSLATION_KEYS } from '../constants';
import { sendIjazahApplicationToDiscord } from '../discordService';

interface PaymentPageProps {
    navigateTo: (page: Page) => void;
    t: (key: string) => string;
    ijazahApplication: IjazahApplication;
    setLastSubmissionType: (type: SubmissionType) => void;
}

const PaymentPage: React.FC<PaymentPageProps> = ({ navigateTo, t, ijazahApplication, setLastSubmissionType }) => {
    const [showPaymentDetails, setShowPaymentDetails] = useState(false);

    const { path, daysPerWeek, fullDetails, memorization } = ijazahApplication;
    const price = IJAZAH_PRICES[path]?.[daysPerWeek] || 0;
    const priceString = `${price.toLocaleString()} IDR`;

    const handlePay = async () => {
        try {
            await sendIjazahApplicationToDiscord(ijazahApplication, priceString, t);
        } catch (error) {
            console.error("Failed to send Discord notification:", error);
            // Log the error, but don't block the user from seeing the confirmation page.
        }
        setLastSubmissionType('paid');
        navigateTo('thanks');
    };

    const handleContinue = () => {
        setShowPaymentDetails(true);
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };


    return (
        <div className="py-10">
            {!showPaymentDetails ? (
                <div key="info" className="page-transition text-center">
                    <h2 className="text-3xl font-bold text-stone-800 dark:text-gray-100">{t('ijazahInfoRequirementsTitle')}</h2>
                    <p className="mt-2 text-stone-600 dark:text-gray-400">{t('paymentSubtitle')}</p>
                    
                    <div className="mt-8 max-w-md mx-auto bg-blue-50 border border-blue-200 p-6 rounded-lg text-left flex items-start gap-4 dark:bg-blue-900/50 dark:border-blue-500/30">
                        <div className="flex-shrink-0 pt-1">
                            <svg className="w-5 h-5 text-blue-500 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        </div>
                        <div>
                            <p className="text-sm text-stone-600 dark:text-gray-400">{t('ijazahInfoSectionText')}</p>
                        </div>
                    </div>

                    <div className="mt-8">
                        <button onClick={handleContinue} className="bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300 ease-in-out text-lg">
                            {t('continueButton')}
                        </button>
                    </div>
                </div>
            ) : (
                <div key="payment" className="page-transition text-center">
                    <h2 className="text-3xl font-bold text-stone-800 dark:text-gray-100">{t('summaryTitle')}</h2>
                    <p className="mt-2 text-stone-600 dark:text-gray-400">{t('paymentSubtitle')}</p>

                    <div className="mt-6 max-w-md mx-auto bg-stone-50 p-6 rounded-lg text-left space-y-4 dark:bg-gray-700">
                        <div>
                            <p className="text-sm text-stone-500 dark:text-gray-400">{t('summaryPath')}</p>
                            <p className="font-semibold text-stone-800 dark:text-gray-200">{t(PATH_TRANSLATION_KEYS[path] || path)}</p>
                        </div>
                        {memorization && (
                            <div>
                                <p className="text-sm text-stone-500 dark:text-gray-400">{t('summaryMemorization')}</p>
                                <p className="font-semibold text-stone-800 dark:text-gray-200">{memorization === 'with' ? t('summaryWithMemorization') : t('summaryWithoutMemorization')}</p>
                            </div>
                        )}
                        {fullDetails.qiraah && (
                            <div>
                                <p className="text-sm text-stone-500 dark:text-gray-400">{t('summaryQiraah')}</p>
                                <p className="font-semibold text-stone-800 dark:text-gray-200">{fullDetails.qiraah}</p>
                            </div>
                        )}
                        <div>
                            <p className="text-sm text-stone-500 dark:text-gray-400">{t('summaryCommitment')}</p>
                            <p className="font-semibold text-stone-800 dark:text-gray-200">{t('daysPerWeek').replace('{count}', String(daysPerWeek))}</p>
                        </div>
                        <div>
                            <p className="text-sm text-stone-500 dark:text-gray-400">{t('summaryTime')}</p>
                            <p className="font-semibold text-stone-800 dark:text-gray-200">{fullDetails.preferredTime}</p>
                        </div>
                         <div>
                            <p className="text-sm text-stone-500 dark:text-gray-400">{t('summaryLanguage')}</p>
                            <p className="font-semibold text-stone-800 dark:text-gray-200">{fullDetails.language}</p>
                        </div>
                        <div className="border-t border-stone-200 pt-4 dark:border-gray-600">
                            <p className="text-sm text-stone-500 dark:text-gray-400">{t('summaryPrice')}</p>
                            <p className="text-2xl font-bold text-stone-900 dark:text-gray-100">
                                <span>{priceString}</span>
                                <span className="text-base font-medium opacity-50 ml-1">{t('monthlyText')}</span>
                            </p>
                        </div>
                    </div>
                    <div className="mt-8">
                        <button onClick={handlePay} className="bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300 ease-in-out text-lg">{t('payButton')}</button>
                    </div>
                    <div className="mt-6 flex flex-col items-center gap-4">
                        <button
                            onClick={() => navigateTo('ijazah')}
                            className="w-full sm:w-1/2 bg-stone-200 text-stone-700 font-semibold px-4 py-2 rounded-lg hover:bg-stone-300 transition-colors dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                        >
                            {t('changeIjazahButton')}
                        </button>
                        <button onClick={() => setShowPaymentDetails(false)} className="text-sm font-semibold text-stone-600 hover:text-amber-600 transition-colors dark:text-gray-400 dark:hover:text-amber-400">
                            &larr; {t('backButton')}
                        </button>
                    </div>
                </div>
            )}
            
            <div className="mt-8 text-center">
                <button onClick={() => navigateTo('home')} className="text-sm font-semibold text-stone-600 hover:text-amber-600 transition-colors dark:text-gray-400 dark:hover:text-amber-400">{t('backToHome')}</button>
            </div>
        </div>
    );
};

export default PaymentPage;