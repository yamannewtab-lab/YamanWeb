import React from 'react';
import ShareButton from './ShareButton';

interface HeaderProps {
    t: (key: string) => string;
    onLanguageToggle: () => void;
    onNavigateHome: () => void;
    isHomePage: boolean;
    onOpenChat: () => void;
}

const Header: React.FC<HeaderProps> = ({ t, onLanguageToggle, onNavigateHome, isHomePage, onOpenChat }) => {
    return (
        <header 
            className="relative p-4 sm:p-6 border-b border-white/10 flex items-center bg-gray-950/80 backdrop-blur-sm"
            dir="ltr"
        >
            <button onClick={onOpenChat} className="mr-4 text-gray-400 hover:text-white transition-colors" aria-label="Open Live Chat">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
            </button>
            <div className="flex-grow">
                <h1 className="font-bold text-xl bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">{t('headerTitle')}</h1>
                <p className="text-xs text-amber-400">{t('headerSubtitle')}</p>
            </div>
            
            <div className="flex items-center gap-2">
                {!isHomePage && (
                    <button onClick={onNavigateHome} className="bg-white/10 text-gray-200 p-3 rounded-lg hover:bg-white/20" aria-label={t('homeButtonText')}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                        </svg>
                    </button>
                )}
                <ShareButton t={t} iconOnly className="bg-white/10 text-gray-200 hover:bg-white/20" />
                <button onClick={onLanguageToggle} className="bg-white/10 text-gray-200 rounded-lg hover:bg-white/20 text-sm font-semibold px-4 py-2">
                    {t('langButtonText')}
                </button>
            </div>
        </header>
    );
};

export default Header;