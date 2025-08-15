import React, { useState } from 'react';
import { Page, IjazahApplication } from '../types';
import { IJAZAH_PRICES, WHATSAPP_PHONE_NUMBER, PATH_TRANSLATION_KEYS } from '../constants';

interface PaymentPageProps {
    navigateTo: (page: Page) => void;
    t: (key: string) => string;
    ijazahApplication: IjazahApplication;
}

const PaymentPage: React.FC<PaymentPageProps> = ({ navigateTo, t, ijazahApplication }) => {
    const [showPaymentDetails, setShowPaymentDetails] = useState(false);

    const { path, daysPerWeek, fullDetails } = ijazahApplication;
    const price = IJAZAH_PRICES[path]?.[daysPerWeek] || 0;
    const priceString = `${price.toLocaleString()} IDR`;

    const handlePay = () => {
        const message = `*New Ijazah Application & Payment*

*Chosen Path:* ${path}
*Weekly Commitment:* ${daysPerWeek} days
*Preferred Time:* ${fullDetails.preferredTime}
*Calculated Price:* ${priceString}

---

*Applicant Details*
*Name:* ${fullDetails.name}
*Age:* ${fullDetails.age}
*Country:* ${fullDetails.from}
*Speaks:* ${fullDetails.language}
*Studied with a Sheikh before?:* ${fullDetails.sheikh}

*Journey with the Qur'an:*
${fullDetails.journey}
        `.trim().replace(/\n\s*\n/g, '\n\n');

        const url = `https://wa.me/${WHATSAPP_PHONE_NUMBER}?text=${encodeURIComponent(message)}`;
        window.open(url, "_blank");
        navigateTo('thanks');
    };

    return (
        <div className="py-10">
            {!showPaymentDetails ? (
                <div key="info" className="page-transition text-center">
                    <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100">{t('ijazahInfoRequirementsTitle')}</h2>
                    <p className="mt-2 text-slate-600 dark:text-slate-400">{t('paymentSubtitle')}</p>
                    
                    <div className="mt-8 max-w-md mx-auto bg-blue-50 border border-blue-200 p-6 rounded-lg text-left flex items-start gap-4 dark:bg-blue-900/50 dark:border-blue-500/30">
                        <div className="flex-shrink-0 pt-1">
                            <svg className="w-5 h-5 text-blue-500 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        </div>
                        <div>
                            <h3 className="text-md font-bold text-slate-800 dark:text-slate-200">{t('ijazahInfoSectionTitle')}</h3>
                            <p className="text-sm text-slate-600 mt-1 dark:text-slate-400">{t('ijazahInfoSectionText')}</p>
                        </div>
                    </div>
                    <div className="mt-8">
                        <button onClick={() => setShowPaymentDetails(true)} className="bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-indigo-700 transition-all text-lg">
                            {t('continueButton')}
                        </button>
                    </div>
                </div>
            ) : (
                <div key="payment" className="page-transition text-center">
                    <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100">{t('summaryTitle')}</h2>
                    <p className="mt-2 text-slate-600 dark:text-slate-400">{t('paymentSubtitle')}</p>

                    <div className="mt-6 max-w-md mx-auto bg-slate-50 p-6 rounded-lg text-left space-y-4 dark:bg-slate-700">
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{t('summaryPath')}</p>
                            <p className="font-semibold text-slate-800 dark:text-slate-200">{t(PATH_TRANSLATION_KEYS[path] || path)}</p>
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{t('summaryCommitment')}</p>
                            <p className="font-semibold text-slate-800 dark:text-slate-200">{t('daysPerWeek').replace('{count}', String(daysPerWeek))}</p>
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{t('summaryTime')}</p>
                            <p className="font-semibold text-slate-800 dark:text-slate-200">{fullDetails.preferredTime}</p>
                        </div>
                         <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{t('summaryLanguage')}</p>
                            <p className="font-semibold text-slate-800 dark:text-slate-200">{fullDetails.language}</p>
                        </div>
                        <div className="border-t border-slate-200 pt-4 dark:border-slate-600">
                            <p className="text-sm text-slate-500 dark:text-slate-400">{t('summaryPrice')}</p>
                            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                                <span>{priceString}</span>
                                <span className="text-base font-medium opacity-50 ml-1">{t('monthlyText')}</span>
                            </p>
                        </div>
                    </div>
                    <div className="mt-8">
                        <button onClick={handlePay} className="bg-green-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-green-600 transition-all text-lg">{t('payButton')}</button>
                        <p className="text-xs text-slate-500 mt-2 dark:text-slate-400">{t('bsiText')}</p>
                    </div>
                    <div className="mt-6 flex flex-col items-center gap-4">
                        <button
                            onClick={() => navigateTo('quiz')}
                            className="w-full sm:w-1/2 bg-slate-200 text-slate-700 font-semibold px-4 py-2 rounded-lg hover:bg-slate-300 transition-colors dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
                        >
                            {t('changeIjazahButton')}
                        </button>
                        <button onClick={() => setShowPaymentDetails(false)} className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors dark:text-slate-400 dark:hover:text-indigo-400">
                            &larr; {t('backButton')}
                        </button>
                    </div>
                </div>
            )}
            
            <div className="mt-8 text-center">
                <button onClick={() => navigateTo('home')} className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors dark:text-slate-400 dark:hover:text-indigo-400">{t('backToHome')}</button>
            </div>
        </div>
    );
};

export default PaymentPage;