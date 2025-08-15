import React from 'react';

interface HeaderProps {
    t: (key: string) => string;
    onLanguageToggle: () => void;
    onNavigateHome: () => void;
    onRegisterClick: () => void;
    isHomePage: boolean;
    lockCheck: boolean;
}

const Header: React.FC<HeaderProps> = ({ t, onLanguageToggle, onNavigateHome, onRegisterClick, isHomePage, lockCheck }) => {
    return (
        <header className="p-4 sm:p-6 border-b border-slate-200 flex items-center dark:border-slate-700" dir="ltr">
            <h1 className="font-bold text-xl text-slate-800 flex-grow dark:text-slate-200">{t('headerTitle')}</h1>
            <div className="flex items-center gap-2 sm:gap-4">
                {isHomePage && lockCheck && (
                     <button onClick={onRegisterClick} className="hidden sm:block bg-slate-200 text-slate-700 font-semibold px-4 py-2 rounded-lg hover:bg-slate-300 transition-colors dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600">
                        {t('registerButtonText')}
                    </button>
                )}
                {!isHomePage && (
                    <button onClick={onNavigateHome} className="bg-slate-200 text-slate-700 font-semibold px-4 py-2 rounded-lg hover:bg-slate-300 transition-colors dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600">
                        {t('homeButtonText')}
                    </button>
                )}
                <button onClick={onLanguageToggle} className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors px-2 py-2 dark:text-slate-400 dark:hover:text-indigo-400">
                    {t('langButtonText')}
                </button>
            </div>
        </header>
    );
};

export default Header;