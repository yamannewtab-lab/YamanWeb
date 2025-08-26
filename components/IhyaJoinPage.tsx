import React, { useState } from 'react';
import { Page } from '../types';

interface IhyaJoinPageProps {
    navigateTo: (page: Page) => void;
    t: (key: string) => string;
}

const ZoomPopup: React.FC<{ t: (key: string) => string; onClose: () => void; }> = ({ t, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50" onClick={onClose}>
        <div className="bg-gray-800 rounded-lg shadow-xl p-8 max-w-sm w-full text-center" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-amber-400">{t('ihyaZoomPopupTitle')}</h3>
            <p className="mt-4 text-gray-300 whitespace-pre-line">{t('ihyaZoomPopupText')}</p>
            <button
                onClick={onClose}
                className="mt-6 w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300"
            >
                {t('ihyaZoomPopupCloseButton')}
            </button>
        </div>
    </div>
);


const IhyaJoinPage: React.FC<IhyaJoinPageProps> = ({ navigateTo, t }) => {
    const [isCopied, setIsCopied] = useState(false);
    const [isZoomPopupOpen, setIsZoomPopupOpen] = useState(false);
    
    const TELEGRAM_LINK = "https://t.me/+QqKpwlq1MFU4ODU9";
    
    const shareText = t('shareCourseText');

    const handleCopy = () => {
        navigator.clipboard.writeText(shareText).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }).catch(err => {
            console.error('Failed to copy text: ', err);
        });
    };

    return (
        <>
            {isZoomPopupOpen && <ZoomPopup t={t} onClose={() => setIsZoomPopupOpen(false)} />}
            <div className="text-center py-16 page-transition">
                <div className="inline-block bg-green-900/50 p-4 rounded-full">
                    <svg className="w-16 h-16 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                </div>
                <h2 className="mt-6 text-3xl font-bold text-gray-100">{t('ihyaJoinTitle')}</h2>
                <p className="mt-2 text-gray-400">{t('ihyaJoinSubtitle')}</p>

                <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 flex-wrap">
                     <a 
                        href={TELEGRAM_LINK}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full sm:w-auto text-center bg-gradient-to-r from-sky-500 to-blue-600 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300"
                    >
                        {t('ihyaJoinTelegramButton')}
                    </a>
                    <button
                        onClick={() => setIsZoomPopupOpen(true)}
                        className="w-full sm:w-auto text-center bg-gray-700/80 backdrop-blur-sm border border-gray-600 text-gray-200 font-bold py-3 px-6 rounded-lg shadow-md hover:shadow-lg hover:bg-gray-600 transform hover:-translate-y-0.5 transition-all duration-300"
                    >
                        {t('ihyaJoinZoomButton')}
                    </button>
                    <a 
                        href="https://drive.google.com/file/d/1lslA4BFBYQFqQ4g11Amm5qgdc_CKjb2A/view?usp=drive_link"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full sm:w-auto text-center bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        {t('ihyaCourseDownloadPdf')}
                    </a>
                </div>

                 <div className="mt-12 border-t border-gray-700 pt-8 max-w-lg mx-auto">
                    <h3 className="text-lg font-semibold text-gray-200">{t('shareCourseTitle')}</h3>
                    <div className="mt-4 flex items-center justify-center">
                        <button
                            onClick={handleCopy}
                            disabled={isCopied}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 font-bold py-3 px-6 rounded-lg shadow-md transition-all duration-300 bg-gray-600 text-white hover:bg-gray-500 disabled:bg-green-600 disabled:cursor-not-allowed"
                        >
                            {isCopied ? (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    <span>{t('copiedButtonText')}</span>
                                </>
                            ) : (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                    <span>{t('copyShareLinkButton')}</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                <div className="mt-12 text-center">
                    <button onClick={() => navigateTo('home')} className="text-sm font-semibold text-gray-400 hover:text-amber-400 transition-colors">{t('backToHome')}</button>
                </div>
            </div>
        </>
    );
};

export default IhyaJoinPage;