import React from 'react';
import ShareButton from './ShareButton';

interface HeaderProps {
    t: (key: string) => string;
    onLanguageToggle: () => void;
    onNavigateHome: () => void;
    isHomePage: boolean;
}

const Header: React.FC<HeaderProps> = ({ t, onLanguageToggle, onNavigateHome, isHomePage }) => {
    return (
        <header 
            className="relative p-4 sm:p-6 border-b border-stone-300/80 dark:border-white/10 flex items-center bg-stone-200/80 dark:bg-gray-950/80 backdrop-blur-sm"
            dir="ltr"
        >
            <div className="flex-grow">
                <h1 className="font-bold text-xl bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">{t('headerTitle')}</h1>
                <p className="text-xs text-amber-600 dark:text-amber-400">{t('headerSubtitle')}</p>
            </div>
            
            <div className="flex items-center gap-2">
                {!isHomePage && (
                    <button onClick={onNavigateHome} className="bg-stone-200/50 dark:bg-white/10 text-stone-700 dark:text-gray-200 p-3 rounded-lg hover:bg-stone-300/50 dark:hover:bg-white/20 transition-colors" aria-label={t('homeButtonText')}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                        </svg>
                    </button>
                )}
                <ShareButton t={t} iconOnly className="bg-stone-200/50 dark:bg-white/10 text-stone-700 dark:text-gray-200 hover:bg-stone-300/50 dark:hover:bg-white/20" />
                <button onClick={onLanguageToggle} className="text-sm font-semibold text-stone-600 dark:text-gray-300 hover:text-amber-600 dark:hover:text-amber-400 transition-colors px-3 py-2">
                    {t('langButtonText')}
                </button>
            </div>
        </header>
    );
};

export default Header;