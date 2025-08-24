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
                <h2 className="text-3xl font-bold text-gray-100">{t('ijazahPreviewTitle')}</h2>
            </div>
            <div className="max-w-3xl mx-auto bg-gray-700 p-4 sm:p-6 rounded-lg shadow-lg">
                <img 
                    src={ijazahImageUrl} 
                    alt="Sample Ijazah Certificate" 
                    className="w-full h-auto rounded-md object-contain border-4 border-gray-600 cursor-pointer transition-transform duration-200 hover:scale-105"
                    onClick={() => onImageClick(ijazahImageUrl)}
                />
                <div className="mt-6 text-center">
                    <p className="text-gray-300 text-lg sm:text-xl font-serif italic leading-relaxed">
                        "{t('ijazahSampleText')}"
                    </p>
                </div>

                <div className="mt-8 border-t border-gray-600 pt-6 text-center">
                    <p className="text-gray-200 text-lg whitespace-pre-line leading-loose font-serif">
                        {t('ijazahGrantText')}
                    </p>
                </div>

            </div>
            <div className="mt-12 text-center">
                <button 
                    onClick={() => navigateTo('home')} 
                    className="text-sm font-semibold text-gray-400 hover:text-amber-400 transition-colors"
                >
                    {t('backToHome')}
                </button>
            </div>
        </div>
    );
};

export default IjazahPreviewPage;