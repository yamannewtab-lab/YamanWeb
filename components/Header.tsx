import React from 'react';
import ShareButton from './ShareButton';

interface HeaderProps {
    t: (key: string) => string;
    onLanguageToggle: () => void;
    onNavigateHome: () => void;
    isHomePage: boolean;
}

const Header: React.FC<HeaderProps> = ({ t, onLanguageToggle, onNavigateHome, isHomePage }) => {
    // A subtle, repeating pattern for a textured look
    const backgroundImageUrl = 'https://www.toptal.com/designers/subtlepatterns/uploads/dark-denim.png';

    return (
        <header 
            className="relative p-4 sm:p-6 border-b border-white/10 flex items-center bg-black/80 backdrop-blur-sm" 
            style={{ 
                backgroundImage: `url('${backgroundImageUrl}')`,
                backgroundBlendMode: 'overlay',
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
            }}
            dir="ltr"
        >
            <div className="flex-grow">
                <h1 className="font-bold text-xl bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">{t('headerTitle')}</h1>
                <p className="text-xs text-amber-400">{t('headerSubtitle')}</p>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
                {!isHomePage && (
                    <button onClick={onNavigateHome} className="bg-white/10 text-gray-200 font-semibold px-4 py-2 rounded-lg hover:bg-white/20 transition-colors">
                        {t('homeButtonText')}
                    </button>
                )}
                <ShareButton t={t} className="bg-white/10 text-gray-200 hover:bg-white/20 text-sm" />
                <button onClick={onLanguageToggle} className="text-sm font-semibold text-gray-300 hover:text-amber-400 transition-colors px-2 py-2">
                    {t('langButtonText')}
                </button>
            </div>
        </header>
    );
};

export default Header;