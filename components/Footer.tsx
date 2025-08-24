import React from 'react';
import Recommendation from './Recommendation';

interface FooterProps {
    t: (key: string) => string;
    onOpenAdminPanel: () => void;
}

const Footer: React.FC<FooterProps> = ({ t, onOpenAdminPanel }) => {
    return (
        <footer className="text-center p-4 border-t border-gray-800">
            <div className="flex justify-center items-center gap-6">
                <a href="https://www.instagram.com/yaman.dariwsh.1/" target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-gray-400 hover:text-amber-400 transition-colors">
                    {t('instagramLinkText')}
                </a>
                <a href="https://www.youtube.com/@quranic_Recites1" target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-gray-400 hover:text-amber-400 transition-colors">
                    {t('youtubeLinkText')}
                </a>
            </div>
            <p className="mt-4 text-xs text-gray-500">
                {t('moderatorText')}
            </p>
            <Recommendation onOpenAdminPanel={onOpenAdminPanel} />
        </footer>
    );
};

export default Footer;