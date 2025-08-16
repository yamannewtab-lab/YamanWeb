import React from 'react';
import { Page } from '../types';

interface AboutPageProps {
    navigateTo: (page: Page) => void;
    t: (key: string) => string;
}

const AboutPage: React.FC<AboutPageProps> = ({ navigateTo, t }) => {
    return (
        <div>
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100">{t('aboutUsPageTitle')}</h2>
            </div>

            <div className="max-w-2xl mx-auto">
                <div className="relative p-8 rounded-xl shadow-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white overflow-hidden">
                    <div className="absolute top-0 right-0 -mt-20 -mr-20 w-40 h-40 rounded-full bg-indigo-500 opacity-30"></div>
                    <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-32 h-32 rounded-full bg-sky-400 opacity-30"></div>
                    
                    <div className="relative z-10">
                         <p className="text-lg leading-relaxed font-medium whitespace-pre-line">
                            {t('aboutUsPageText')}
                        </p>
                    </div>
                </div>
            </div>
            
            <div className="mt-12 text-center">
                <button onClick={() => navigateTo('home')} className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors dark:text-slate-400 dark:hover:text-indigo-400">
                    {t('backToHome')}
                </button>
            </div>
        </div>
    );
};

export default AboutPage;