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
        <header className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700 flex items-center" dir="ltr">
            <h1 className="font-bold text-xl text-slate-800 dark:text-slate-100 flex-grow">{t('headerTitle')}</h1>
            <div className="flex items-center gap-4">
                {isHomePage && lockCheck && (
                     <button onClick={onRegisterClick} className="hidden sm:block bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold px-4 py-2 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">
                        {t('registerButtonText')}
                    </button>
                )}
                {!isHomePage && (
                    <button onClick={onNavigateHome} className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold px-4 py-2 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">
                        {t('homeButtonText')}
                    </button>
                )}
                <button onClick={onLanguageToggle} className="text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                    {t('langButtonText')}
                </button>
            </div>
        </header>
    );
};

export default Header;