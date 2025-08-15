import React from 'react';
import { Page } from '../types';
import { WHATSAPP_PHONE_NUMBER } from '../constants';

interface TasmiQuizPageProps {
    navigateTo: (page: Page) => void;
    t: (key: string) => string;
}

const TasmiQuizPage: React.FC<TasmiQuizPageProps> = ({ navigateTo, t }) => {
    
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const name = formData.get('name');
        const phone = formData.get('phone');
        const portion = formData.get('portion');
        const sessions = formData.get('sessions');
        const time = formData.get('time');
        const journey = formData.get('journey');

        const message = `*New Free Tasmi' Request*

*Name:* ${name}
*WhatsApp:* ${phone}
*Portion to Recite:* ${portion}
*Number of Sessions:* ${sessions}
*Preferred Time:* ${time}
*Journey with Qur'an:* ${journey}
        `.trim().replace(/\n\s*\n/g, '\n\n');

        const url = `https://wa.me/${WHATSAPP_PHONE_NUMBER}?text=${encodeURIComponent(message)}`;
        window.open(url, "_blank");
        e.currentTarget.reset();
        navigateTo('tasmiInfo');
    };
    
    return (
        <div>
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100">{t('tasmiQuizTitle')}</h2>
            </div>
            <form onSubmit={handleSubmit} className="max-w-xl mx-auto">
                <div className="space-y-6">
                    <div>
                        <label htmlFor="tasmi-name" className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('quizNameLabel')}</label>
                        <input type="text" id="tasmi-name" name="name" required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm dark:text-slate-200 focus:dark:bg-slate-700" />
                    </div>
                    <div>
                        <label htmlFor="tasmi-phone" className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('phoneLabel')}</label>
                        <input type="tel" id="tasmi-phone" name="phone" required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm dark:text-slate-200 focus:dark:bg-slate-700" />
                    </div>
                    <div>
                        <label htmlFor="tasmi-portion" className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('tasmiPortionLabel')}</label>
                        <select id="tasmi-portion" name="portion" className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm text-slate-900 dark:text-slate-200 focus:dark:bg-slate-700">
                            <option>{t('tasmiFatihahOption')}</option>
                            <option>{t('tasmiJuzAmmaOption')}</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="tasmi-sessions" className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('tasmiSessionsLabel')}</label>
                        <input type="number" id="tasmi-sessions" name="sessions" required defaultValue="1" max="5" className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm dark:text-slate-200 focus:dark:bg-slate-700" />
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t('maxSessionsText')}</p>
                    </div>
                    <div>
                        <span className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('quizTimeLabel')}</span>
                        <div className="mt-2 flex flex-col sm:flex-row gap-2 sm:gap-4">
                            <label className="flex items-center p-3 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700/50 flex-1">
                                <input type="radio" name="time" value={t('timeSlot1')} defaultChecked className="mr-3" />
                                <span>{t('timeSlot1')}</span>
                            </label>
                            <label className="flex items-center p-3 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700/50 flex-1">
                                <input type="radio" name="time" value={t('timeSlot2')} className="mr-3" />
                                <span>{t('timeSlot2')}</span>
                            </label>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="tasmi-journey" className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('quizJourneyLabel')}</label>
                        <textarea id="tasmi-journey" name="journey" rows={4} required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm dark:text-slate-200 focus:dark:bg-slate-700"></textarea>
                    </div>
                </div>
                <div className="mt-8">
                    <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-indigo-700 transition-all text-lg">{t('submitButton')}</button>
                </div>
            </form>
            <div className="mt-12 text-center">
                <button onClick={() => navigateTo('home')} className="text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">{t('backToHome')}</button>
            </div>
        </div>
    );
};

export default TasmiQuizPage;