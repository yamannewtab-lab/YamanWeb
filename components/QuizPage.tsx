import React from 'react';
import { Page, IjazahApplication } from '../types';
import { IJAZAH_PRICES } from '../constants';

interface QuizPageProps {
    navigateTo: (page: Page) => void;
    t: (key: string) => string;
    ijazahApplication: IjazahApplication;
    setIjazahApplication: React.Dispatch<React.SetStateAction<IjazahApplication>>;
}

const QuizPage: React.FC<QuizPageProps> = ({ navigateTo, t, ijazahApplication, setIjazahApplication }) => {
    
    const handleDaySelection = (days: number) => {
        setIjazahApplication(prev => ({ ...prev, daysPerWeek: days }));
    };

    const getDayButtonColors = (day: number): string => {
        const colors = [
            // Day 1
            'peer-checked:bg-red-500 dark:peer-checked:bg-red-600 peer-checked:text-white',
            // Day 2
            'peer-checked:bg-orange-400 dark:peer-checked:bg-orange-500 peer-checked:text-white',
            // Day 3
            'peer-checked:bg-amber-400 dark:peer-checked:bg-amber-500 peer-checked:text-slate-800',
            // Day 4
            'peer-checked:bg-yellow-400 dark:peer-checked:bg-yellow-500 peer-checked:text-slate-800',
            // Day 5
            'peer-checked:bg-lime-500 dark:peer-checked:bg-lime-600 peer-checked:text-white',
            // Day 6
            'peer-checked:bg-green-500 dark:peer-checked:bg-green-600 peer-checked:text-white',
            // Day 7
            'peer-checked:bg-teal-500 dark:peer-checked:bg-teal-600 peer-checked:text-white',
        ];
        return colors[day - 1] || 'peer-checked:bg-white dark:peer-checked:bg-slate-700';
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        
        const arabicToEnglishNumbers = (str: string): string => {
            if (!str) return '';
            const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
            let newStr = str;
            for (let i = 0; i < 10; i++) {
                newStr = newStr.replace(new RegExp(arabicNumerals[i], 'g'), String(i));
            }
            return newStr.replace(/[^0-9]/g, '');
        };

        const ageValue = formData.get('age') as string;
        const convertedAge = arabicToEnglishNumbers(ageValue);

        setIjazahApplication(prev => ({
            ...prev,
            fullDetails: {
                name: formData.get('name') as string,
                age: convertedAge,
                from: formData.get('from') as string,
                sheikh: formData.get('sheikh') as string,
                journey: formData.get('journey') as string,
                preferredTime: formData.get('time') as string,
                language: formData.get('language') as string,
                qiraah: formData.get('qiraah') as string,
            }
        }));
        navigateTo('payment');
    };

    const price = IJAZAH_PRICES[ijazahApplication.path]?.[ijazahApplication.daysPerWeek];
    
    let timeEstimationText: string;
    let showSpeedNote = false;

    if (ijazahApplication.path === 'The Ten Recitations') {
        timeEstimationText = t('tenRecitationsTime');
        showSpeedNote = false;
    } else {
        // Hafs and Different Qira'ah share the same time estimation
        const timeEstimationKey = `hafsTime_${ijazahApplication.daysPerWeek}`;
        timeEstimationText = t(timeEstimationKey);
        showSpeedNote = true;
    }


    return (
        <div>
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100">{t('quizTitle')}</h2>
            </div>
            <form onSubmit={handleSubmit} className="max-w-xl mx-auto">
                <div className="space-y-6">
                    <div>
                        <label htmlFor="quiz-name" className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('quizNameLabel')}</label>
                        <input type="text" id="quiz-name" name="name" required className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm dark:bg-slate-200 dark:border-slate-500 text-black dark:placeholder-slate-500" />
                    </div>
                    <div>
                        <label htmlFor="quiz-age" className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('quizAgeLabel')}</label>
                        <input type="text" inputMode="decimal" pattern="[0-9٠-٩]*" id="quiz-age" name="age" required className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm dark:bg-slate-200 dark:border-slate-500 text-black dark:placeholder-slate-500" />
                    </div>
                    <div>
                        <label htmlFor="quiz-from" className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('quizFromLabel')}</label>
                        <input type="text" id="quiz-from" name="from" required className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm dark:bg-slate-200 dark:border-slate-500 text-black dark:placeholder-slate-500" />
                    </div>

                    {ijazahApplication.path === "Different Qira'ah" && (
                        <div>
                            <label htmlFor="quiz-qiraah" className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('quizQiraahLabel')}</label>
                            <input type="text" id="quiz-qiraah" name="qiraah" required className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm dark:bg-slate-200 dark:border-slate-500 text-black dark:placeholder-slate-500" />
                        </div>
                    )}
                    
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('quizWeeklyLabel')}</label>
                        <div className="mt-2 rounded-lg bg-slate-200 p-2 dark:bg-slate-900">
                            <div className="flex items-center space-x-2 overflow-x-auto pb-2 -mb-2 custom-scrollbar">
                                {[1, 2, 3, 4, 5, 6, 7].map(day => (
                                    <div key={day} className="flex-shrink-0">
                                        <input
                                            type="radio"
                                            id={`day-${day}`}
                                            name="daysPerWeek"
                                            value={day}
                                            checked={ijazahApplication.daysPerWeek === day}
                                            onChange={() => handleDaySelection(day)}
                                            className="sr-only peer"
                                        />
                                        <label
                                            htmlFor={`day-${day}`}
                                            className={`block text-center py-1.5 px-5 rounded-md cursor-pointer transition-colors duration-200 ease-in-out text-slate-600 peer-checked:shadow dark:text-slate-400 ${getDayButtonColors(day)}`}
                                        >
                                            <span className="font-semibold">{day}</span>
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="text-center mt-2">
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                {price ? `Price: ${price.toLocaleString()} IDR / month` : 'Custom Price'}
                            </p>
                            <div className="mt-2 inline-block relative px-3 py-1.5">
                                <div className="absolute inset-0 bg-slate-200 dark:bg-slate-700 opacity-50 rounded-md"></div>
                                <div className="relative z-10 text-xs text-slate-600 dark:text-slate-300">
                                    <p><span className="font-semibold">{t('ijazahTimeEstimationTitle')}</span> {timeEstimationText}</p>
                                    {showSpeedNote && <p className="italic">{t('ijazahTimeNoteSpeed')}</p>}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div>
                        <span className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('quizTimeLabel')}</span>
                        <div className="mt-2 grid grid-cols-1 gap-2 rounded-lg bg-slate-200 p-1 dark:bg-slate-900">
                            <div>
                                <input type="radio" id="time1" name="time" value={t('timeSlot1')} className="sr-only peer" defaultChecked />
                                <label htmlFor="time1" className="block w-full text-center py-1.5 px-4 rounded-md cursor-pointer transition-colors duration-200 ease-in-out text-slate-600 peer-checked:bg-white peer-checked:text-slate-900 peer-checked:shadow dark:text-slate-400 dark:peer-checked:bg-slate-700 dark:peer-checked:text-slate-100">
                                    <span className="font-semibold">{t('timeSlot1')}</span>
                                </label>
                            </div>
                            <div>
                                <input type="radio" id="time2" name="time" value={t('timeSlot2')} className="sr-only peer" />
                                <label htmlFor="time2" className="block w-full text-center py-1.5 px-4 rounded-md cursor-pointer transition-colors duration-200 ease-in-out text-slate-600 peer-checked:bg-white peer-checked:text-slate-900 peer-checked:shadow dark:text-slate-400 dark:peer-checked:bg-slate-700 dark:peer-checked:text-slate-100">
                                    <span className="font-semibold">{t('timeSlot2')}</span>
                                </label>
                            </div>
                             <div>
                                <input type="radio" id="time3" name="time" value={t('timeSlot3')} className="sr-only peer" />
                                <label htmlFor="time3" className="block w-full text-center py-1.5 px-4 rounded-md cursor-pointer transition-colors duration-200 ease-in-out text-slate-600 peer-checked:bg-white peer-checked:text-slate-900 peer-checked:shadow dark:text-slate-400 dark:peer-checked:bg-slate-700 dark:peer-checked:text-slate-100">
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
                                <input type="radio" id="lang-ar" name="language" value="Arabic" className="sr-only peer" defaultChecked />
                                <label htmlFor="lang-ar" className="block w-full text-center py-1.5 px-2 rounded-md cursor-pointer transition-colors duration-200 ease-in-out text-slate-600 peer-checked:bg-white peer-checked:text-slate-900 peer-checked:shadow dark:text-slate-400 dark:peer-checked:bg-slate-700 dark:peer-checked:text-slate-100">
                                    <span className="font-semibold">{t('langArabic')}</span>
                                </label>
                            </div>
                            <div className="col-span-1">
                                <input type="radio" id="lang-en" name="language" value="English" className="sr-only peer" />
                                <label htmlFor="lang-en" className="block w-full text-center py-1.5 px-2 rounded-md cursor-pointer transition-colors duration-200 ease-in-out text-slate-600 peer-checked:bg-white peer-checked:text-slate-900 peer-checked:shadow dark:text-slate-400 dark:peer-checked:bg-slate-700 dark:peer-checked:text-slate-100">
                                    <span className="font-semibold">{t('langEnglish')}</span>
                                </label>
                            </div>
                           <div className="col-span-2">
                                <input type="radio" id="lang-id" name="language" value="Indonesian" className="sr-only peer" />
                                <label htmlFor="lang-id" className="block w-full text-center py-1.5 px-2 rounded-md cursor-pointer transition-colors duration-200 ease-in-out text-slate-600 peer-checked:bg-white peer-checked:text-slate-900 peer-checked:shadow dark:text-slate-400 dark:peer-checked:bg-slate-700 dark:peer-checked:text-slate-100">
                                    <span className="font-semibold">{t('langIndonesian')}</span>
                                </label>
                            </div>
                        </div>
                    </div>
                    <div>
                        <span className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('quizSheikhLabel')}</span>
                        <div className="mt-2 grid grid-cols-2 gap-2 rounded-lg bg-slate-200 p-1 dark:bg-slate-900">
                            <div>
                                <input type="radio" id="sheikh-yes" name="sheikh" value="yes" className="sr-only peer" />
                                <label htmlFor="sheikh-yes" className="block w-full text-center py-1.5 px-4 rounded-md cursor-pointer transition-colors duration-200 ease-in-out text-slate-600 peer-checked:bg-white peer-checked:text-slate-900 peer-checked:shadow dark:text-slate-400 dark:peer-checked:bg-slate-700 dark:peer-checked:text-slate-100">
                                    <span className="font-semibold">{t('yes')}</span>
                                </label>
                            </div>
                            <div>
                                <input type="radio" id="sheikh-no" name="sheikh" value="no" className="sr-only peer" defaultChecked />
                                <label htmlFor="sheikh-no" className="block w-full text-center py-1.5 px-4 rounded-md cursor-pointer transition-colors duration-200 ease-in-out text-slate-600 peer-checked:bg-white peer-checked:text-slate-900 peer-checked:shadow dark:text-slate-400 dark:peer-checked:bg-slate-700 dark:peer-checked:text-slate-100">
                                    <span className="font-semibold">{t('no')}</span>
                                </label>
                            </div>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="quiz-journey" className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('quizJourneyLabel')}</label>
                        <textarea id="quiz-journey" name="journey" rows={4} required className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm dark:bg-slate-200 dark:border-slate-500 text-black dark:placeholder-slate-500"></textarea>
                    </div>
                </div>
                <div className="mt-8">
                    <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-indigo-700 transition-all text-lg">{t('nextButton')}</button>
                </div>
            </form>
            <div className="mt-4 text-center">
                 <button 
                    onClick={() => navigateTo('ijazah')} 
                    className="w-full sm:w-1/2 mx-auto bg-slate-200 text-slate-700 font-semibold px-4 py-2 rounded-lg hover:bg-slate-300 transition-colors dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
                >
                    {t('changeIjazahButton')}
                </button>
            </div>
            <div className="mt-8 text-center">
                <button onClick={() => navigateTo('home')} className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors dark:text-slate-400 dark:hover:text-indigo-400">{t('backToHome')}</button>
            </div>
        </div>
    );
};

export default QuizPage;