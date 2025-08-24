import React, { useState, useEffect, useRef } from 'react';
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
    const infoRef = useRef<HTMLDivElement>(null);
    const paymentRef = useRef<HTMLDivElement>(null);

    const { path, daysPerWeek, fullDetails, memorization } = ijazahApplication;
    const price = IJAZAH_PRICES[path]?.[daysPerWeek] || 0;
    const priceString = `${price.toLocaleString()} IDR`;
    
    useEffect(() => {
        const targetRef = !showPaymentDetails ? infoRef : paymentRef;
        setTimeout(() => {
            targetRef?.current?.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
            });
        }, 100);
    }, [showPaymentDetails]);

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
    };
    
    const handleBack = () => {
        setShowPaymentDetails(false);
    };


    return (
        <div className="py-10">
            {!showPaymentDetails ? (
                <div ref={infoRef} key="info" className="page-transition text-center">
                    <h2 className="text-3xl font-bold text-gray-100">{t('ijazahInfoRequirementsTitle')}</h2>
                    <p className="mt-2 text-gray-400">{t('paymentSubtitle')}</p>
                    
                    <div className="mt-8 max-w-md mx-auto bg-blue-900/50 border border-blue-500/30 p-6 rounded-lg text-left flex items-start gap-4">
                        <div className="flex-shrink-0 pt-1">
                            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">{t('ijazahInfoSectionText')}</p>
                        </div>
                    </div>

                    <div className="mt-8">
                        <button onClick={handleContinue} className="bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300 ease-in-out text-lg">
                            {t('continueButton')}
                        </button>
                    </div>
                </div>
            ) : (
                <div ref={paymentRef} key="payment" className="page-transition text-center">
                    <h2 className="text-3xl font-bold text-gray-100">{t('summaryTitle')}</h2>
                    <p className="mt-2 text-gray-400">{t('paymentSubtitle')}</p>

                    <div className="mt-6 max-w-md mx-auto bg-gray-700 p-6 rounded-lg text-left space-y-4">
                        <div>
                            <p className="text-sm text-gray-400">{t('summaryPath')}</p>
                            <p className="font-semibold text-gray-200">{t(PATH_TRANSLATION_KEYS[path] || path)}</p>
                        </div>
                        {memorization && (
                            <div>
                                <p className="text-sm text-gray-400">{t('summaryMemorization')}</p>
                                <p className="font-semibold text-gray-200">{memorization === 'with' ? t('summaryWithMemorization') : t('summaryWithoutMemorization')}</p>
                            </div>
                        )}
                        {fullDetails.qiraah && (
                            <div>
                                <p className="text-sm text-gray-400">{t('summaryQiraah')}</p>
                                <p className="font-semibold text-gray-200">{fullDetails.qiraah}</p>
                            </div>
                        )}
                        <div>
                            <p className="text-sm text-gray-400">{t('summaryCommitment')}</p>
                            <p className="font-semibold text-gray-200">{t('daysPerWeek').replace('{count}', String(daysPerWeek))}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">{t('summaryTime')}</p>
                            <p className="font-semibold text-gray-200">{fullDetails.preferredTime}</p>
                        </div>
                         <div>
                            <p className="text-sm text-gray-400">{t('summaryLanguage')}</p>
                            <p className="font-semibold text-gray-200">{fullDetails.language}</p>
                        </div>
                        <div className="border-t border-gray-600 pt-4">
                            <p className="text-sm text-gray-400">{t('summaryPrice')}</p>
                            <p className="text-2xl font-bold text-gray-100">
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
                            className="w-full sm:w-1/2 bg-gray-700 text-gray-200 font-semibold px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                        >
                            {t('changeIjazahButton')}
                        </button>
                        <button onClick={handleBack} className="text-sm font-semibold text-gray-400 hover:text-amber-400 transition-colors">
                            &larr; {t('backButton')}
                        </button>
                    </div>
                </div>
            )}
            
            <div className="mt-8 text-center">
                <button onClick={() => navigateTo('home')} className="text-sm font-semibold text-gray-400 hover:text-amber-400 transition-colors">{t('backToHome')}</button>
            </div>
        </div>
    );
};

export default PaymentPage;