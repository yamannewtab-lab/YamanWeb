import React from 'react';

interface HeaderProps {
    t: (key: string) => string;
    onLanguageToggle: () => void;
    onNavigateHome: () => void;
    onRegisterClick: () => void;
    isHomePage: boolean;
    lockCheck: boolean;
    isDarkMode: boolean;
    onToggleDarkMode: () => void;
}

const Header: React.FC<HeaderProps> = ({ t, onLanguageToggle, onNavigateHome, onRegisterClick, isHomePage, lockCheck, isDarkMode, onToggleDarkMode }) => {
    return (
        <header className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700 flex items-center" dir="ltr">
            <h1 className="font-bold text-xl text-slate-800 dark:text-slate-100 flex-grow">{t('headerTitle')}</h1>
            <div className="flex items-center gap-2 sm:gap-4">
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
                <button onClick={onLanguageToggle} className="text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors px-2 py-2">
                    {t('langButtonText')}
                </button>
                <button
                    onClick={onToggleDarkMode}
                    className="relative w-10 h-10 flex items-center justify-center rounded-full text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-slate-800"
                    aria-label={t('toggleDarkMode')}
                >
                    <span className="sr-only">{t('toggleDarkMode')}</span>
                    {/* Sun Icon */}
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 absolute transition-all duration-500 ease-in-out ${isDarkMode ? 'opacity-100 rotate-0' : 'opacity-0 -rotate-90'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    {/* Moon Icon */}
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 absolute transition-all duration-500 ease-in-out ${!isDarkMode ? 'opacity-100 rotate-0' : 'opacity-0 rotate-90'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                </button>
            </div>
        </header>
    );
};

export default Header;