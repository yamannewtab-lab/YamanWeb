import React from 'react';

interface HeaderProps {
    t: (key: string) => string;
    onLanguageToggle: () => void;
    onNavigateHome: () => void;
    isHomePage: boolean;
}

const Header: React.FC<HeaderProps> = ({ t, onLanguageToggle, onNavigateHome, isHomePage }) => {
    return (
        <header className="p-4 sm:p-6 border-b border-stone-200 flex items-center dark:border-stone-700" dir="ltr">
            <div className="flex-grow">
                <h1 className="font-bold text-xl text-stone-800 dark:text-stone-200">{t('headerTitle')}</h1>
                <p className="text-xs text-stone-500 dark:text-stone-400">{t('headerSubtitle')}</p>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
                {!isHomePage && (
                    <button onClick={onNavigateHome} className="bg-stone-200 text-stone-700 font-semibold px-4 py-2 rounded-lg hover:bg-stone-300 transition-colors dark:bg-stone-700 dark:text-stone-200 dark:hover:bg-stone-600">
                        {t('homeButtonText')}
                    </button>
                )}
                <button onClick={onLanguageToggle} className="text-sm font-semibold text-stone-600 hover:text-amber-600 transition-colors px-2 py-2 dark:text-stone-400 dark:hover:text-amber-400">
                    {t('langButtonText')}
                </button>
            </div>
        </header>
    );
};

export default Header;