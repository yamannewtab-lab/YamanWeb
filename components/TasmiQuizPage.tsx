import React, { useState } from 'react';
import { Page } from '../types';
import { sendTasmiRequestToDiscord } from '../discordService';

interface TasmiQuizPageProps {
    navigateTo: (page: Page) => void;
    t: (key: string) => string;
}

const TasmiQuizPage: React.FC<TasmiQuizPageProps> = ({ navigateTo, t }) => {
    const [sessions, setSessions] = useState(1);
    
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const name = formData.get('name') as string;
        const phone = formData.get('phone') as string;
        const portion = formData.get('portion') as string;
        const time = formData.get('time') as string;
        const journey = formData.get('journey') as string;
        const language = formData.get('language') as string;

        try {
            await sendTasmiRequestToDiscord({
                name,
                phone,
                sessions,
                portion,
                time,
                language,
                journey,
            }, t);
        } catch (error) {
            console.error("Failed to send Tasmi' request to Discord:", error);
        }

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
                        <input type="text" id="tasmi-name" name="name" required className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm dark:bg-slate-200 dark:border-slate-500 text-black dark:placeholder-slate-500" />
                    </div>
                    <div>
                        <label htmlFor="tasmi-phone" className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('phoneLabel')}</label>
                        <input type="tel" id="tasmi-phone" name="phone" required className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm dark:bg-slate-200 dark:border-slate-500 text-black dark:placeholder-slate-500" />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('tasmiWeeklyLabel')}</label>
                        <div className="mt-2 rounded-lg bg-slate-200 p-2 dark:bg-slate-900">
                            <div className="grid grid-cols-6 gap-2">
                                {[1, 2, 3, 4, 5].map(day => (
                                    <div key={day} className={day <= 3 ? 'col-span-2' : 'col-span-3'}>
                                        <input
                                            type="radio"
                                            id={`session-${day}`}
                                            name="sessions"
                                            value={day}
                                            checked={sessions === day}
                                            onChange={() => setSessions(day)}
                                            className="sr-only peer"
                                        />
                                        <label
                                            htmlFor={`session-${day}`}
                                            className="block text-center py-2 px-4 rounded-md cursor-pointer transition-colors duration-200 ease-in-out text-slate-600 peer-checked:bg-white peer-checked:shadow dark:text-slate-400 dark:peer-checked:bg-slate-700 peer-checked:text-slate-900 dark:peer-checked:text-slate-100"
                                        >
                                            <span className="font-semibold">{day}</span>
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="tasmi-portion" className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('tasmiPortionLabel')}</label>
                        <select id="tasmi-portion" name="portion" className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm text-black dark:bg-slate-200 dark:border-slate-500">
                            <option>{t('tasmiFatihahOption')}</option>
                            <option>{t('tasmiJuzAmmaOption')}</option>
                        </select>
                    </div>

                    <div>
                        <span className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('tasmiTimeLabel')}</span>
                        <div className="mt-2 grid grid-cols-1 gap-2 rounded-lg bg-slate-200 p-1 dark:bg-slate-900">
                            <div>
                                <input type="radio" id="tasmi-time1" name="time" value={t('timeSlot1')} className="sr-only peer" defaultChecked />
                                <label htmlFor="tasmi-time1" className="block w-full text-center py-1.5 px-4 rounded-md cursor-pointer transition-colors duration-200 ease-in-out text-slate-600 peer-checked:bg-white peer-checked:text-slate-900 peer-checked:shadow dark:text-slate-400 dark:peer-checked:bg-slate-700 dark:peer-checked:text-slate-100">
                                    <span className="font-semibold">{t('timeSlot1')}</span>
                                </label>
                            </div>
                            <div>
                                <input type="radio" id="tasmi-time2" name="time" value={t('timeSlot2')} className="sr-only peer" />
                                <label htmlFor="tasmi-time2" className="block w-full text-center py-1.5 px-4 rounded-md cursor-pointer transition-colors duration-200 ease-in-out text-slate-600 peer-checked:bg-white peer-checked:text-slate-900 peer-checked:shadow dark:text-slate-400 dark:peer-checked:bg-slate-700 dark:peer-checked:text-slate-100">
                                    <span className="font-semibold">{t('timeSlot2')}</span>
                                </label>
                            </div>
                             <div>
                                <input type="radio" id="tasmi-time3" name="time" value={t('timeSlot3')} className="sr-only peer" />
                                <label htmlFor="tasmi-time3" className="block w-full text-center py-1.5 px-4 rounded-md cursor-pointer transition-colors duration-200 ease-in-out text-slate-600 peer-checked:bg-white peer-checked:text-slate-900 peer-checked:shadow dark:text-slate-400 dark:peer-checked:bg-slate-700 dark:peer-checked:text-slate-100">
                                    <span className="font-semibold">{t('timeSlot3')}</span>
                                </label>
                            </div>
                        </div>
                        <p className="text-center mt-2 text-xs text-slate-500 dark:text-slate-400">{t('timezoneNote')}</p>
                    </div>
                    
                    <div>
                        <span className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('quizLanguageLabel')}</span>
                         <div className="mt-2 grid grid-cols-2 gap-1 rounded-lg bg-slate-200 p-1 dark:bg-slate-900">
                           <div className="col-span-1">
                                <input type="radio" id="tasmi-lang-ar" name="language" value="Arabic" className="sr-only peer" defaultChecked />
                                <label htmlFor="tasmi-lang-ar" className="block w-full text-center py-1.5 px-2 rounded-md cursor-pointer transition-colors duration-200 ease-in-out text-slate-600 peer-checked:bg-white peer-checked:text-slate-900 peer-checked:shadow dark:text-slate-400 dark:peer-checked:bg-slate-700 dark:peer-checked:text-slate-100">
                                    <span className="font-semibold">{t('langArabic')}</span>
                                </label>
                            </div>
                            <div className="col-span-1">
                                <input type="radio" id="tasmi-lang-en" name="language" value="English" className="sr-only peer" />
                                <label htmlFor="tasmi-lang-en" className="block w-full text-center py-1.5 px-2 rounded-md cursor-pointer transition-colors duration-200 ease-in-out text-slate-600 peer-checked:bg-white peer-checked:text-slate-900 peer-checked:shadow dark:text-slate-400 dark:peer-checked:bg-slate-700 dark:peer-checked:text-slate-100">
                                    <span className="font-semibold">{t('langEnglish')}</span>
                                </label>
                            </div>
                           <div className="col-span-2">
                                <input type="radio" id="tasmi-lang-id" name="language" value="Indonesian" className="sr-only peer" />
                                <label htmlFor="tasmi-lang-id" className="block w-full text-center py-1.5 px-2 rounded-md cursor-pointer transition-colors duration-200 ease-in-out text-slate-600 peer-checked:bg-white peer-checked:text-slate-900 peer-checked:shadow dark:text-slate-400 dark:peer-checked:bg-slate-700 dark:peer-checked:text-slate-100">
                                    <span className="font-semibold">{t('langIndonesian')}</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="tasmi-journey" className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('quizJourneyLabel')}</label>
                        <textarea id="tasmi-journey" name="journey" rows={4} required className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm dark:bg-slate-200 dark:border-slate-500 text-black dark:placeholder-slate-500"></textarea>
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