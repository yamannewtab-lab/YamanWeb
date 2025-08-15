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

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        setIjazahApplication(prev => ({
            ...prev,
            fullDetails: {
                name: formData.get('name') as string,
                age: formData.get('age') as string,
                from: formData.get('from') as string,
                sheikh: formData.get('sheikh') as string,
                journey: formData.get('journey') as string,
            }
        }));
        navigateTo('payment');
    };

    const price = IJAZAH_PRICES[ijazahApplication.path]?.[ijazahApplication.daysPerWeek];

    return (
        <div>
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100">{t('quizTitle')}</h2>
            </div>
            <form onSubmit={handleSubmit} className="max-w-xl mx-auto">
                <div className="space-y-6">
                    <div>
                        <label htmlFor="quiz-name" className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('quizNameLabel')}</label>
                        <input type="text" id="quiz-name" name="name" required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm dark:text-slate-200 focus:dark:bg-slate-700" />
                    </div>
                    <div>
                        <label htmlFor="quiz-age" className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('quizAgeLabel')}</label>
                        <input type="number" id="quiz-age" name="age" required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm dark:text-slate-200 focus:dark:bg-slate-700" />
                    </div>
                    <div>
                        <label htmlFor="quiz-from" className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('quizFromLabel')}</label>
                        <input type="text" id="quiz-from" name="from" required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm dark:text-slate-200 focus:dark:bg-slate-700" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('quizWeeklyLabel')}</label>
                        <div className="mt-2 grid grid-cols-4 sm:grid-cols-7 gap-2">
                            {[1, 2, 3, 4, 5, 6, 7].map(day => (
                                <button
                                    key={day}
                                    type="button"
                                    onClick={() => handleDaySelection(day)}
                                    className={`border-2 rounded-md p-2 text-center font-semibold transition-colors ${
                                        ijazahApplication.daysPerWeek === day
                                            ? 'bg-indigo-600 text-white border-indigo-600'
                                            : 'border-slate-300 dark:border-slate-600 hover:bg-indigo-100 dark:hover:bg-slate-700'
                                    }`}
                                >
                                    {day}
                                </button>
                            ))}
                        </div>
                        <p className="text-center mt-2 text-sm text-slate-500 dark:text-slate-400 h-4">
                            {price ? `Price: ${price.toLocaleString()} IDR / month` : 'Custom Price'}
                        </p>
                    </div>
                    <div>
                        <span className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('quizSheikhLabel')}</span>
                        <div className="mt-2 flex gap-4">
                            <label><input type="radio" name="sheikh" value="yes" className="mr-2" /> <span>{t('yes')}</span></label>
                            <label><input type="radio" name="sheikh" value="no" defaultChecked className="mr-2" /> <span>{t('no')}</span></label>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="quiz-journey" className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('quizJourneyLabel')}</label>
                        <textarea id="quiz-journey" name="journey" rows={4} required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm dark:text-slate-200 focus:dark:bg-slate-700"></textarea>
                    </div>
                </div>
                <div className="mt-8">
                    <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-indigo-700 transition-all text-lg">{t('nextButton')}</button>
                </div>
            </form>
            <div className="mt-4 text-center">
                 <button 
                    onClick={() => navigateTo('ijazah')} 
                    className="w-full sm:w-1/2 mx-auto bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold px-4 py-2 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                >
                    {t('changeIjazahButton')}
                </button>
            </div>
            <div className="mt-8 text-center">
                <button onClick={() => navigateTo('home')} className="text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">{t('backToHome')}</button>
            </div>
        </div>
    );
};

export default QuizPage;