import React, { useState } from 'react';
import { Page } from '../types';
import { supabase } from '../supabaseClient';

interface FeedbackPageProps {
    navigateTo: (page: Page) => void;
    t: (key: string) => string;
}

const FeedbackPage: React.FC<FeedbackPageProps> = ({ navigateTo, t }) => {
    const [feedback, setFeedback] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const maxChars = 500;

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!feedback.trim() || isSubmitting) return;

        setIsSubmitting(true);
        setError(null);

        const { error } = await supabase
            .from('feedbacks')
            .insert([{ message: feedback.trim() }]);

        setIsSubmitting(false);

        if (error) {
            console.error("Error submitting feedback:", error.message);
            setError(`Submission failed: ${error.message}. Please try again.`);
        } else {
            setFeedback('');
            navigateTo('feedbackThanks');
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            {/* Form Section */}
            <div className="order-2 md:order-1">
                 <div className="text-center md:text-left mb-8">
                    <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100">{t('feedbackPageTitle')}</h2>
                    <p className="mt-2 text-slate-600 dark:text-slate-400">{t('feedbackPageSubtitle')}</p>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="relative">
                        <textarea
                            id="feedback"
                            name="feedback"
                            rows={8}
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            placeholder={t('feedbackPlaceholder')}
                            maxLength={maxChars}
                            required
                            className="mt-1 block w-full px-4 py-3 bg-white border border-slate-300 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 dark:bg-slate-700 dark:border-slate-600 text-slate-800 dark:text-slate-200 dark:placeholder-slate-400 transition"
                            aria-describedby="char-count"
                        />
                        <div id="char-count" className="absolute bottom-3 right-3 text-xs text-slate-500 dark:text-slate-400">
                            {feedback.length} / {maxChars}
                        </div>
                    </div>
                    {error && <p className="mt-2 text-sm text-red-500 dark:text-red-400 text-center md:text-left">{error}</p>}
                    <div className="mt-6">
                        <button
                            type="submit"
                            disabled={isSubmitting || !feedback.trim()}
                            className="w-full flex justify-center items-center bg-pink-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-pink-600 transition-all text-lg disabled:bg-pink-400 disabled:cursor-not-allowed dark:disabled:bg-pink-700 dark:disabled:opacity-60"
                        >
                            {isSubmitting ? (
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : t('sendFeedbackButton')}
                        </button>
                    </div>
                </form>
                 <div className="mt-8 text-center md:text-left">
                    <button onClick={() => navigateTo('home')} className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors dark:text-slate-400 dark:hover:text-indigo-400">{t('backToHome')}</button>
                </div>
            </div>
            
            {/* Decorative Panel */}
            <div className="order-1 md:order-2">
                <div className="bg-gradient-to-br from-slate-700 to-slate-800 p-8 rounded-lg border border-slate-600 h-full flex flex-col justify-center text-center">
                    <svg className="w-16 h-16 text-pink-400 mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
                    <p className="text-xl italic text-slate-300 leading-relaxed">
                        "Your feedback is the compass that guides our improvement. We appreciate you taking the time to help us get better."
                    </p>
                </div>
            </div>
        </div>
    );
};

export default FeedbackPage;