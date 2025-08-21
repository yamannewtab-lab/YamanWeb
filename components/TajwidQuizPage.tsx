import React, { useState } from 'react';
import { Page } from '../types';
import { TAJWID_IMPROVEMENT_PRICES } from '../constants';
import { sendTajwidRequestToDiscord } from '../discordService';

interface TajwidQuizPageProps {
    navigateTo: (page: Page) => void;
    t: (key: string) => string;
}

const TajwidQuizPage: React.FC<TajwidQuizPageProps> = ({ navigateTo, t }) => {
    const subscriptionOptions = Object.keys(TAJWID_IMPROVEMENT_PRICES).map(Number).sort((a, b) => b - a);
    const [selectedSubscription, setSelectedSubscription] = useState<number>(subscriptionOptions[0]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget;
        const formData = new FormData(form);
        const name = formData.get('name') as string;
        const age = formData.get('age') as string;
        const whatsapp = formData.get('whatsapp') as string;
        const tajwidLevel = formData.get('tajwidLevel') as string;
        const time = formData.get('time') as string;
        
        const dayToKeyMap: {[key: number]: string} = {
            15: 'subscriptionOption15Days',
            10: 'subscriptionOption10Days',
            5: 'subscriptionOption5Days'
        };

        const subscriptionText = t(dayToKeyMap[selectedSubscription]);
        const priceText = TAJWID_IMPROVEMENT_PRICES[selectedSubscription].toLocaleString() + " IDR";

        try {
            await sendTajwidRequestToDiscord({
                name,
                age,
                whatsapp,
                time,
                tajwidLevel,
                subscriptionText,
                priceText
            }, t);
        } catch (error) {
            console.error("Failed to send Tajwid request to Discord:", error);
        }
        
        navigateTo('thanks');
    };

    const tajwidLevels = [
        { key: 'tajwidLevelGood', value: 'Good' },
        { key: 'tajwidLevelNormal', value: 'Normal' },
        { key: 'tajwidLevelNotTooGood', value: 'Not too good' },
        { key: 'tajwidLevelBad', value: 'Bad' },
        { key: 'tajwidLevelReallyBad', value: 'Really bad' },
    ];
    
    return (
        <div>
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-stone-800 dark:text-gray-100">{t('tajwidQuizTitle')}</h2>
            </div>
            <form onSubmit={handleSubmit} className="max-w-xl mx-auto">
                <div className="space-y-6">
                    <div>
                        <label htmlFor="tajwid-name" className="block text-sm font-medium text-stone-700 dark:text-gray-300">{t('quizNameLabel')}</label>
                        <input type="text" id="tajwid-name" name="name" required className="mt-1 block w-full px-3 py-2 bg-white border border-stone-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 text-stone-900 dark:text-gray-200" />
                    </div>
                     <div>
                        <label htmlFor="tajwid-age" className="block text-sm font-medium text-stone-700 dark:text-gray-300">{t('quizAgeLabel')}</label>
                        <input type="text" inputMode="decimal" pattern="[0-9٠-٩]*" id="tajwid-age" name="age" required className="mt-1 block w-full px-3 py-2 bg-white border border-stone-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 text-stone-900 dark:text-gray-200" />
                    </div>
                    <div>
                        <label htmlFor="tajwid-whatsapp" className="block text-sm font-medium text-stone-700 dark:text-gray-300">{t('whatsappLabel')}</label>
                        <input type="tel" id="tajwid-whatsapp" name="whatsapp" required className="mt-1 block w-full px-3 py-2 bg-white border border-stone-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 text-stone-900 dark:text-gray-200" />
                    </div>
                    
                    <div>
                        <span className="block text-sm font-medium text-stone-700 dark:text-gray-300">{t('quizTimeLabel')}</span>
                        <div className="mt-2 grid grid-cols-1 gap-2 rounded-lg bg-stone-200 p-1 dark:bg-gray-900">
                            <div>
                                <input type="radio" id="tajwid-time1" name="time" value={t('timeSlot1')} className="sr-only peer" defaultChecked />
                                <label htmlFor="tajwid-time1" className="block w-full text-center py-1.5 px-4 rounded-md cursor-pointer transition-colors duration-200 ease-in-out text-stone-600 peer-checked:bg-white peer-checked:text-stone-900 peer-checked:shadow dark:text-gray-400 dark:peer-checked:bg-gray-700 dark:peer-checked:text-gray-100">
                                    <span className="font-semibold">{t('timeSlot1')}</span>
                                </label>
                            </div>
                            <div>
                                <input type="radio" id="tajwid-time2" name="time" value={t('timeSlot2')} className="sr-only peer" />
                                <label htmlFor="tajwid-time2" className="block w-full text-center py-1.5 px-4 rounded-md cursor-pointer transition-colors duration-200 ease-in-out text-stone-600 peer-checked:bg-white peer-checked:text-stone-900 peer-checked:shadow dark:text-gray-400 dark:peer-checked:bg-gray-700 dark:peer-checked:text-gray-100">
                                    <span className="font-semibold">{t('timeSlot2')}</span>
                                </label>
                            </div>
                             <div>
                                <input type="radio" id="tajwid-time3" name="time" value={t('timeSlot3')} className="sr-only peer" />
                                <label htmlFor="tajwid-time3" className="block w-full text-center py-1.5 px-4 rounded-md cursor-pointer transition-colors duration-200 ease-in-out text-stone-600 peer-checked:bg-white peer-checked:text-stone-900 peer-checked:shadow dark:text-gray-400 dark:peer-checked:bg-gray-700 dark:peer-checked:text-gray-100">
                                    <span className="font-semibold">{t('timeSlot3')}</span>
                                </label>
                            </div>
                        </div>
                        <p className="text-center mt-2 text-xs text-stone-500 dark:text-gray-400">{t('timezoneNote')}</p>
                    </div>

                    <div>
                        <span className="block text-sm font-medium text-stone-700 dark:text-gray-300">{t('tajwidLevelLabel')}</span>
                        <div className="mt-2 space-y-2">
                            {tajwidLevels.map((level, index) => (
                                <div key={level.key}>
                                    <input type="radio" id={level.key} name="tajwidLevel" value={t(level.key)} className="sr-only peer" defaultChecked={index === 0} />
                                    <label htmlFor={level.key} className="block w-full text-center py-2 px-4 rounded-md cursor-pointer transition-colors duration-200 ease-in-out bg-stone-200 dark:bg-gray-900 text-stone-600 peer-checked:bg-white peer-checked:text-stone-900 peer-checked:shadow dark:text-gray-400 dark:peer-checked:bg-gray-700 dark:peer-checked:text-gray-100">
                                        <span className="font-semibold">{t(level.key)}</span>
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <span className="block text-sm font-medium text-stone-700 dark:text-gray-300">{t('subscriptionLengthLabel')}</span>
                        <div className="mt-2 grid grid-cols-3 gap-2 rounded-lg bg-stone-200 p-1 dark:bg-gray-900">
                            {subscriptionOptions.map(days => {
                                const dayToKeyMap: {[key: number]: string} = {
                                    15: 'subscriptionOption15Days',
                                    10: 'subscriptionOption10Days',
                                    5: 'subscriptionOption5Days'
                                };
                                return (
                                    <div key={days}>
                                        <input 
                                            type="radio" 
                                            id={`sub-${days}`} 
                                            name="subscription" 
                                            value={days} 
                                            className="sr-only peer" 
                                            checked={selectedSubscription === days}
                                            onChange={() => setSelectedSubscription(days)}
                                        />
                                        <label htmlFor={`sub-${days}`} className="block w-full text-center py-2 px-4 rounded-md cursor-pointer transition-colors duration-200 ease-in-out text-stone-600 peer-checked:bg-white peer-checked:text-stone-900 peer-checked:shadow dark:text-gray-400 dark:peer-checked:bg-gray-700 dark:peer-checked:text-gray-100">
                                            <span className="font-semibold">{t(dayToKeyMap[days])}</span>
                                        </label>
                                    </div>
                                );
                            })}
                        </div>
                        <p className="text-center mt-2 text-sm text-stone-500 h-4 dark:text-gray-400">
                           {t('priceDisplay').replace('{price}', TAJWID_IMPROVEMENT_PRICES[selectedSubscription].toLocaleString())}
                        </p>
                    </div>

                </div>
                <div className="mt-8">
                    <button type="submit" className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300 ease-in-out text-lg">{t('submitButton')}</button>
                </div>
            </form>
            <div className="mt-12 text-center">
                <button onClick={() => navigateTo('home')} className="text-sm font-semibold text-stone-600 hover:text-amber-600 transition-colors dark:text-gray-400 dark:hover:text-amber-400">{t('backToHome')}</button>
            </div>
        </div>
    );
};

export default TajwidQuizPage;