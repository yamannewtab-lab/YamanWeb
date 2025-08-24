import React from 'react';
import { Page } from '../types';

interface FeedbackThanksPageProps {
    navigateTo: (page: Page) => void;
    t: (key: string) => string;
}

const FeedbackThanksPage: React.FC<FeedbackThanksPageProps> = ({ navigateTo, t }) => {
    return (
        <div className="text-center py-16">
            <div className="inline-block bg-pink-900/50 p-4 rounded-full">
                <svg className="w-16 h-16 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.085a2 2 0 00-1.736.97l-3.5 7m7-10V5a2 2 0 00-2-2h-.085a2 2 0 00-1.736.97l-3.5 7"></path></svg>
            </div>
            <h2 className="mt-6 text-3xl font-bold text-gray-100">{t('feedbackThanksMessage')}</h2>
            <p className="mt-2 text-gray-400">{t('feedbackThanksText')}</p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                <button onClick={() => navigateTo('home')} className="bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300">{t('backToHome')}</button>
            </div>
        </div>
    );
};

export default FeedbackThanksPage;