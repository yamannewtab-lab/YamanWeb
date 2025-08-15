import React from 'react';
import { Page, IjazahApplication } from '../types';
import { IJAZAH_PRICES, WHATSAPP_PHONE_NUMBER, PATH_TRANSLATION_KEYS } from '../constants';

interface PaymentPageProps {
    navigateTo: (page: Page) => void;
    t: (key: string) => string;
    ijazahApplication: IjazahApplication;
}

const PaymentPage: React.FC<PaymentPageProps> = ({ navigateTo, t, ijazahApplication }) => {
    const { path, daysPerWeek, fullDetails } = ijazahApplication;
    const price = IJAZAH_PRICES[path]?.[daysPerWeek] || 0;
    const priceString = `${price.toLocaleString()} IDR`;

    const handlePay = () => {
        const message = `*New Ijazah Application & Payment*

*Chosen Path:* ${path}
*Weekly Commitment:* ${daysPerWeek} days
*Calculated Price:* ${priceString}

---

*Applicant Details*
*Name:* ${fullDetails.name}
*Age:* ${fullDetails.age}
*Country:* ${fullDetails.from}
*Studied with a Sheikh before?:* ${fullDetails.sheikh}

*Journey with the Qur'an:*
${fullDetails.journey}
        `.trim().replace(/\n\s*\n/g, '\n\n');

        const url = `https://wa.me/${WHATSAPP_PHONE_NUMBER}?text=${encodeURIComponent(message)}`;
        window.open(url, "_blank");
        navigateTo('thanks');
    };

    return (
        <div className="text-center py-16">
            <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100">{t('paymentTitle')}</h2>
            <p className="mt-2 text-slate-600 dark:text-slate-300">{t('paymentSubtitle')}</p>
            <div className="mt-8 max-w-md mx-auto bg-slate-50 dark:bg-slate-700/50 p-6 rounded-lg text-left space-y-4">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{t('summaryTitle')}</h3>
                <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{t('summaryPath')}</p>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">{t(PATH_TRANSLATION_KEYS[path] || path)}</p>
                </div>
                <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{t('summaryCommitment')}</p>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">{t('daysPerWeek').replace('{count}', String(daysPerWeek))}</p>
                </div>
                <div className="border-t border-slate-200 dark:border-slate-600 pt-4">
                    <p className="text-sm text-slate-500 dark:text-slate-400">{t('summaryPrice')}</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                        <span>{priceString}</span>
                        <span className="text-base font-medium opacity-50 ml-1">{t('monthlyText')}</span>
                    </p>
                </div>
            </div>
            <div className="mt-8">
                <button onClick={handlePay} className="bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 transition-all text-sm">{t('payButton')}</button>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">{t('bsiText')}</p>
            </div>

            <div className="mt-12 text-center">
                <button
                    onClick={() => navigateTo('ijazah')}
                    className="w-full sm:w-1/2 mx-auto bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold px-4 py-2 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                >
                    {t('changeIjazahButton')}
                </button>
            </div>
            <div className="mt-8 text-center">
                <button onClick={() => navigateTo('home')} className="text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">{t('backToHome')}</button>
            </div>
        </div>
    );
};

export default PaymentPage;