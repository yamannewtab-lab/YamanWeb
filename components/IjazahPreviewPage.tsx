import React from 'react';
import { Page } from '../types';

interface IjazahPreviewPageProps {
    navigateTo: (page: Page) => void;
    t: (key: string) => string;
    onImageClick: (src: string) => void;
}

const IjazahPreviewPage: React.FC<IjazahPreviewPageProps> = ({ navigateTo, t, onImageClick }) => {
    const ijazahImageUrl = 'https://i.imgur.com/7iRNrr7.png';

    return (
        <div>
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-stone-800 dark:text-stone-100">{t('ijazahPreviewTitle')}</h2>
            </div>
            <div className="max-w-3xl mx-auto bg-stone-50 p-4 sm:p-6 rounded-lg shadow-lg dark:bg-stone-700">
                <img 
                    src={ijazahImageUrl} 
                    alt="Sample Ijazah Certificate" 
                    className="w-full h-auto rounded-md object-contain border-4 border-stone-200 dark:border-stone-600 cursor-pointer transition-transform duration-200 hover:scale-105"
                    onClick={() => onImageClick(ijazahImageUrl)}
                />
                <div className="mt-6 text-center">
                    <p className="text-stone-700 dark:text-stone-300 text-lg sm:text-xl font-serif italic leading-relaxed">
                        "{t('ijazahSampleText')}"
                    </p>
                </div>

                <div className="mt-8 border-t border-stone-200 dark:border-stone-600 pt-6 text-center">
                    <p className="text-stone-800 dark:text-stone-200 text-lg whitespace-pre-line leading-loose font-serif">
                        {t('ijazahGrantText')}
                    </p>
                </div>

            </div>
            <div className="mt-12 text-center">
                <button 
                    onClick={() => navigateTo('home')} 
                    className="text-sm font-semibold text-stone-600 hover:text-amber-600 transition-colors dark:text-stone-400 dark:hover:text-amber-400"
                >
                    {t('backToHome')}
                </button>
            </div>
        </div>
    );
};

export default IjazahPreviewPage;