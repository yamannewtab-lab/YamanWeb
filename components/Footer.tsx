import React from 'react';

interface FooterProps {
    t: (key: string) => string;
}

const Footer: React.FC<FooterProps> = ({ t }) => {
    return (
        <footer className="text-center p-4 border-t border-slate-200 dark:border-slate-700">
            <div className="flex justify-center items-center gap-6">
                <a href="https://www.instagram.com/yaman.dariwsh.1/" target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                    {t('instagramLinkText')}
                </a>
                <a href="https://www.youtube.com/@quranic_Recites1" target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                    {t('youtubeLinkText')}
                </a>
            </div>
            <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
                {t('moderatorText')}
            </p>
        </footer>
    );
};

export default Footer;
