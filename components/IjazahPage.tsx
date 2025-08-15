

import React from 'react';
import { Page, IjazahApplication } from '../types';

interface IjazahPageProps {
    navigateTo: (page: Page) => void;
    t: (key: string) => string;
    setIjazahApplication: React.Dispatch<React.SetStateAction<IjazahApplication>>;
}

const IjazahPage: React.FC<IjazahPageProps> = ({ navigateTo, t, setIjazahApplication }) => {
    
    const handleOptionClick = (path: string) => {
        setIjazahApplication(prev => ({ ...prev, path: path, fullDetails: {} }));
        navigateTo('quiz');
    };
    
    return (
        <div>
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100">{t('ijazahTitle')}</h2>
                <p className="mt-2 text-slate-600 dark:text-slate-400">{t('ijazahSubtitle')}</p>
            </div>
            <div className="mt-8 flex flex-col items-center gap-4">
                <button onClick={() => handleOptionClick("Hafs 'an 'Asim")} className="bg-teal-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-teal-600 transition-all w-full sm:w-auto">{t('hafsButton')}</button>
                <button onClick={() => handleOptionClick("The Ten Recitations")} className="bg-teal-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-teal-600 transition-all w-full sm:w-auto">{t('tenRecitationsButton')}</button>
                <button onClick={() => handleOptionClick("Different Qira'ah")} className="bg-teal-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-teal-600 transition-all w-full sm:w-auto">{t('differentQiraahButton')}</button>
            </div>
            <div className="mt-12 text-center">
                <button onClick={() => navigateTo('home')} className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors dark:text-slate-400 dark:hover:text-indigo-400">{t('backToHome')}</button>
            </div>
        </div>
    );
};

export default IjazahPage;