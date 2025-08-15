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
        const language = formData.get('language');

        const message = `*New Free Tasmi' Request*

*Name:* ${name}
*WhatsApp:* ${phone}
*Portion to Recite:* ${portion}
*Number of Sessions:* ${sessions}
*Preferred Time:* ${time}
*Speaks:* ${language}
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
                        <input type="text" id="tasmi-name" name="name" required className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
                    </div>
                    <div>
                        <label htmlFor="tasmi-phone" className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('phoneLabel')}</label>
                        <input type="tel" id="tasmi-phone" name="phone" required className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
                    </div>
                    <div>
                        <label htmlFor="tasmi-portion" className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('tasmiPortionLabel')}</label>
                        <select id="tasmi-portion" name="portion" className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm text-slate-900 dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                            <option>{t('tasmiFatihahOption')}</option>
                            <option>{t('tasmiJuzAmmaOption')}</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="tasmi-sessions" className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('tasmiSessionsLabel')}</label>
                        <input type="number" id="tasmi-sessions" name="sessions" required defaultValue="1" max="5" className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
                        <p className="text-xs text-slate-500 mt-1 dark:text-slate-400">{t('maxSessionsText')}</p>
                    </div>
                    <div>
                        <span className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('quizTimeLabel')}</span>
                        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                             <div>
                                <input type="radio" id="tasmi-time1" name="time" value={t('timeSlot1')} className="sr-only peer" defaultChecked />
                                <label htmlFor="tasmi-time1" className="block w-full text-center p-3 rounded-lg border-2 border-slate-300 bg-white cursor-pointer transition-all peer-checked:border-indigo-600 peer-checked:bg-indigo-600 peer-checked:text-white text-slate-800 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600">
                                    <span className="font-semibold">{t('timeSlot1')}</span>
                                </label>
                            </div>
                            <div>
                                <input type="radio" id="tasmi-time2" name="time" value={t('timeSlot2')} className="sr-only peer" />
                                <label htmlFor="tasmi-time2" className="block w-full text-center p-3 rounded-lg border-2 border-slate-300 bg-white cursor-pointer transition-all peer-checked:border-indigo-600 peer-checked:bg-indigo-600 peer-checked:text-white text-slate-800 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600">
                                    <span className="font-semibold">{t('timeSlot2')}</span>
                                </label>
                            </div>
                        </div>
                        <p className="text-center mt-2 text-xs text-slate-500 dark:text-slate-400">{t('timezoneNote')}</p>
                    </div>
                    <div>
                        <span className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('quizLanguageLabel')}</span>
                        <div className="mt-2 grid grid-cols-3 gap-2 rounded-lg bg-slate-200 p-1 dark:bg-slate-900">
                            <div>
                                <input type="radio" id="tasmi-lang-ar" name="language" value="Arabic" className="sr-only peer" defaultChecked />
                                <label htmlFor="tasmi-lang-ar" className="block w-full text-center py-1.5 px-4 rounded-md cursor-pointer transition-colors duration-200 ease-in-out text-slate-600 peer-checked:bg-white peer-checked:text-slate-900 peer-checked:shadow dark:text-slate-400 dark:peer-checked:bg-slate-700 dark:peer-checked:text-slate-100">
                                    <span className="font-semibold">{t('langArabic')}</span>
                                </label>
                            </div>
                            <div>
                                <input type="radio" id="tasmi-lang-en" name="language" value="English" className="sr-only peer" />
                                <label htmlFor="tasmi-lang-en" className="block w-full text-center py-1.5 px-4 rounded-md cursor-pointer transition-colors duration-200 ease-in-out text-slate-600 peer-checked:bg-white peer-checked:text-slate-900 peer-checked:shadow dark:text-slate-400 dark:peer-checked:bg-slate-700 dark:peer-checked:text-slate-100">
                                    <span className="font-semibold">{t('langEnglish')}</span>
                                </label>
                            </div>
                            <div>
                                <input type="radio" id="tasmi-lang-id" name="language" value="Indonesian" className="sr-only peer" />
                                <label htmlFor="tasmi-lang-id" className="block w-full text-center py-1.5 px-4 rounded-md cursor-pointer transition-colors duration-200 ease-in-out text-slate-600 peer-checked:bg-white peer-checked:text-slate-900 peer-checked:shadow dark:text-slate-400 dark:peer-checked:bg-slate-700 dark:peer-checked:text-slate-100">
                                    <span className="font-semibold">{t('langIndonesian')}</span>
                                </label>
                            </div>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="tasmi-journey" className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('quizJourneyLabel')}</label>
                        <textarea id="tasmi-journey" name="journey" rows={4} required className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white"></textarea>
                    </div>
                </div>
                <div className="mt-8">
                    <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-indigo-700 transition-all text-lg">{t('submitButton')}</button>
                </div>
            </form>
            <div className="mt-12 text-center">
                <button onClick={() => navigateTo('home')} className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors dark:text-slate-400 dark:hover:text-indigo-400">{t('backToHome')}</button>
            </div>
        </div>
    );
};

export default TasmiQuizPage;