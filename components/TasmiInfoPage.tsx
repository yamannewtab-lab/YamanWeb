import React from 'react';
import { Page } from '../types';

interface TasmiInfoPageProps {
    navigateTo: (page: Page) => void;
    t: (key: string) => string;
}

const TasmiInfoPage: React.FC<TasmiInfoPageProps> = ({ navigateTo, t }) => {
    return (
        <div className="text-center py-16">
            <div className="inline-block bg-amber-900/50 p-4 rounded-full">
                <svg className="w-16 h-16 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <h2 className="mt-6 text-3xl font-bold text-gray-100">{t('tasmiInfoTitle')}</h2>
            <p className="mt-4 text-gray-400">{t('tasmiInfoText1')}</p>
            <p className="mt-2 text-gray-400">{t('tasmiInfoText2')}</p>
            <div className="mt-8 bg-gray-800 p-4 rounded-lg max-w-md mx-auto">
                <p className="font-bold text-gray-200">{t('noteTitle')}</p>
                <p className="text-gray-400">{t('noteText')}</p>
            </div>
            <div className="mt-12 flex flex-col gap-4 items-center">
                <button onClick={() => navigateTo('home')} className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300">{t('backToHome')}</button>
            </div>
        </div>
    );
};

export default TasmiInfoPage;