import React from 'react';
import { Page } from '../types';

interface IjazahPreviewPageProps {
    navigateTo: (page: Page) => void;
    t: (key: string) => string;
}

const IjazahPreviewPage: React.FC<IjazahPreviewPageProps> = ({ navigateTo, t }) => {
    const ijazahImageUrl = 'https://placehold.co/800x1131/1e293b/a5b4fc.png?text=Ijazah+Certificate%5Cn(Sample)&font=serif';

    return (
        <div>
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100">{t('ijazahPreviewTitle')}</h2>
            </div>
            <div className="max-w-3xl mx-auto bg-slate-50 p-4 sm:p-6 rounded-lg shadow-lg dark:bg-slate-700">
                <img 
                    src={ijazahImageUrl} 
                    alt="Sample Ijazah Certificate" 
                    className="w-full h-auto rounded-md object-contain border-4 border-slate-200 dark:border-slate-600"
                />
            </div>
            <div className="mt-12 text-center">
                <button 
                    onClick={() => navigateTo('home')} 
                    className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors dark:text-slate-400 dark:hover:text-indigo-400"
                >
                    {t('backToHome')}
                </button>
            </div>
        </div>
    );
};

export default IjazahPreviewPage;