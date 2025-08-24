import React, { useState } from 'react';
import { Page } from '../types';

interface JoinClassPageProps {
    navigateTo: (page: Page) => void;
    t: (key: string) => string;
}

const JoinClassPage: React.FC<JoinClassPageProps> = ({ navigateTo, t }) => {
    const [passcode, setPasscode] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const correctPasscode = '0000';
    const zoomLink = 'https://us05web.zoom.us/j/87607823870?pwd=b88XoZwoa7FnRphA2rb60yL5FbjXem.1';

    const handlePasscodeSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (passcode === correctPasscode) {
            setIsAuthenticated(true);
            setError(null);
        } else {
            setError(t('joinClassInvalidPasscode'));
            setPasscode('');
        }
    };

    if (isAuthenticated) {
        return (
            <div className="text-center page-transition">
                <h2 className="text-3xl font-bold text-gray-100">{t('joinClassWelcomeTitle')}</h2>
                <div className="mt-8 max-w-md mx-auto bg-gray-800 p-6 rounded-lg shadow-lg">
                    <p className="text-gray-300">{t('joinClassWelcomeText')}</p>
                    <div className="mt-6 bg-yellow-900/50 border border-yellow-500/30 p-3 rounded-lg text-center">
                        <p className="text-sm font-semibold text-yellow-300">{t('joinClassZoomNote')}</p>
                    </div>
                    <a
                        href={zoomLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-6 inline-block w-full bg-gradient-to-r from-blue-500 to-sky-500 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300"
                    >
                        {t('joinClassJoinButton')}
                    </a>
                </div>
                 <div className="mt-12 text-center">
                    <button onClick={() => navigateTo('home')} className="text-sm font-semibold text-gray-400 hover:text-amber-400 transition-colors">{t('backToHome')}</button>
                </div>
            </div>
        );
    }

    return (
        <div className="page-transition">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-100">{t('joinClassPageTitle')}</h2>
            </div>
            <form onSubmit={handlePasscodeSubmit} className="max-w-sm mx-auto">
                <div className="space-y-4">
                    <div>
                        <label htmlFor="passcode" className="block text-sm font-medium text-gray-300 sr-only">{t('joinClassPasscodeLabel')}</label>
                        <input
                            type="password"
                            id="passcode"
                            name="passcode"
                            value={passcode}
                            onChange={(e) => setPasscode(e.target.value)}
                            placeholder={t('joinClassPasscodeLabel')}
                            required
                            autoFocus
                            className="mt-1 block w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-amber-500 focus:border-amber-500 text-gray-200 text-center text-lg tracking-widest"
                        />
                    </div>
                    {error && <p className="text-red-400 text-sm text-center">{error}</p>}
                </div>
                <div className="mt-6">
                    <button type="submit" className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300 ease-in-out">
                        {t('joinClassSubmitButton')}
                    </button>
                </div>
            </form>
             <div className="mt-12 text-center">
                <button onClick={() => navigateTo('home')} className="text-sm font-semibold text-gray-400 hover:text-amber-400 transition-colors">{t('backToHome')}</button>
            </div>
        </div>
    );
};

export default JoinClassPage;