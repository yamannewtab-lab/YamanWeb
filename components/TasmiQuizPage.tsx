
import React, { useState, useEffect, useRef } from 'react';
import { Page } from '../types';
import { sendTasmiRequestToDiscord, isTestModeEnabled } from '../discordService';
import { supabase } from '../supabaseClient';

interface TasmiQuizPageProps {
    navigateTo: (page: Page) => void;
    t: (key: string) => string;
}

interface TasmiFormData {
    name: string;
    age: string;
    whatsapp: string;
    sessions: number;
    portion: string;
    language: string;
    journey: string;
}

const Card = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div className="bg-gray-800/50 p-6 rounded-xl shadow-sm border border-gray-700/50 page-transition">
        <h3 className="text-xl font-bold text-gray-100 mb-6 border-b border-gray-700 pb-3">{title}</h3>
        <div className="space-y-6">{children}</div>
    </div>
);

const FormProgress = ({ currentStep, totalSteps, t }: { currentStep: number, totalSteps: number, t: (key: string) => string }) => (
    <div className="mb-6 text-center"><p className="text-sm font-semibold text-gray-400">{t('stepIndicator').replace('{current}', String(currentStep)).replace('{total}', String(totalSteps))}</p><div className="mt-2 flex justify-center items-center gap-2">{[...Array(totalSteps)].map((_, i) => (<div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i + 1 <= currentStep ? 'bg-amber-500' : 'bg-gray-600'}`} style={{ width: `${100 / totalSteps}%`}}></div>))}</div></div>
);

const TasmiQuizPage: React.FC<TasmiQuizPageProps> = ({ navigateTo, t }) => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState<TasmiFormData>({
        name: '', age: '', whatsapp: '', sessions: 0, 
        portion: '', language: '', journey: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const formRef = useRef<HTMLFormElement>(null);
    const stepRefs = {
        1: useRef<HTMLDivElement>(null),
        2: useRef<HTMLDivElement>(null),
        3: useRef<HTMLDivElement>(null),
    };

    useEffect(() => {
        const targetRef = stepRefs[step as keyof typeof stepRefs];
        setTimeout(() => {
            targetRef?.current?.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
            });
        }, 100);
    }, [step]);
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({...prev, [name]: value}));
    };

    const handleNext = () => {
        const form = formRef.current;
        if (!form) return;

        let fieldsToValidate: string[] = [];
        if (step === 1) fieldsToValidate = ['name', 'age', 'whatsapp'];
        if (step === 2) fieldsToValidate = ['sessions', 'portion', 'language'];
        
        const areFieldsValid = fieldsToValidate.every(fieldName => {
            const field = form.elements.namedItem(fieldName) as RadioNodeList | HTMLInputElement;
            if (field instanceof RadioNodeList) return Array.from(field).some(radio => (radio as HTMLInputElement).checked);
            if (field) return field.checkValidity();
            return false;
        });

        if (areFieldsValid) {
            setStep(s => s + 1);
        } else {
            form.reportValidity();
        }
    };

    const handleBack = () => {
        setStep(s => s - 1);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        try {
            const approvalRequest = {
                name: formData.name,
                application_type: 'Tasmi',
                requested_slots: JSON.stringify([]),
                application_data: JSON.stringify(formData),
                status: 'pending'
            };

            if (!isTestModeEnabled()) {
                const { error: bookingError } = await supabase.from('approvals').insert([approvalRequest]);
                if (bookingError) throw bookingError;
            }
            
            await sendTasmiRequestToDiscord(formData, t);
            navigateTo('tasmiInfo');
        } catch (error: any) {
            console.error('Error submitting Tasmi request for approval:', error.message || error);
            alert('An error occurred while submitting your request. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div>
            <div className="text-center mb-6"><h2 className="text-3xl font-bold text-gray-100">{t('tasmiQuizTitle')}</h2></div>
            <form ref={formRef} onSubmit={handleSubmit} className="max-w-2xl mx-auto">
                <FormProgress currentStep={step} totalSteps={3} t={t} />
                {step === 1 && (
                    <div ref={stepRefs[1]}>
                        <Card title={t('cardTitlePersonalInfo')}>
                            <div><label htmlFor="name" className="block text-sm font-medium text-gray-300">{t('quizNameLabel')}</label><input type="text" id="name" name="name" value={formData.name} onChange={handleInputChange} required className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm text-gray-200" /></div>
                            <div><label htmlFor="age" className="block text-sm font-medium text-gray-300">{t('quizAgeLabel')}</label><input type="text" inputMode="decimal" pattern="[0-9٠-٩]*" id="age" name="age" value={formData.age} onChange={handleInputChange} required className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm text-gray-200" /></div>
                            <div><label htmlFor="whatsapp" className="block text-sm font-medium text-gray-300">{t('whatsappLabel')}</label><input type="tel" id="whatsapp" name="whatsapp" value={formData.whatsapp} onChange={handleInputChange} required className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm text-gray-200" /></div>
                        </Card>
                    </div>
                )}
                {step === 2 && (
                    <div ref={stepRefs[2]}>
                        <Card title={t('cardTitleSessionDetails')}>
                            <div><label className="block text-sm font-medium text-gray-300">{t('tasmiWeeklyLabel')}</label><div className="mt-2 rounded-lg bg-gray-900 p-2"><div className="grid grid-cols-5 gap-2">{[1, 2, 3, 4, 5].map(day => (<div key={day}><input type="radio" id={`session-${day}`} name="sessions" value={day} checked={formData.sessions === day} onChange={() => setFormData(f => ({...f, sessions: day}))} required className="sr-only peer" /><label htmlFor={`session-${day}`} className="block text-center py-2 px-4 rounded-md cursor-pointer transition-colors duration-200 ease-in-out peer-checked:bg-gray-700 peer-checked:shadow text-gray-400 peer-checked:text-gray-100"><span className="font-semibold">{day}</span></label></div>))}</div></div></div>
                            <div><label htmlFor="portion" className="block text-sm font-medium text-gray-300">{t('tasmiPortionLabel')}</label><select id="portion" name="portion" value={formData.portion} onChange={handleInputChange} required className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm text-gray-200"><option value="" disabled>{t('selectPortionPlaceholder')}</option><option>{t('tasmiFatihahOption')}</option><option>{t('tasmiJuzAmmaOption')}</option></select></div>
                            <div><span className="block text-sm font-medium text-gray-300">{t('quizLanguageLabel')}</span><div className="mt-2 grid grid-cols-2 gap-1 rounded-lg bg-gray-900 p-1"><div className="col-span-1"><input type="radio" id="lang-ar" name="language" value="Arabic" required checked={formData.language === 'Arabic'} onChange={handleInputChange} className="sr-only peer"/><label htmlFor="lang-ar" className="block w-full text-center py-2 px-2 rounded-md cursor-pointer transition-colors text-gray-400 peer-checked:bg-gray-700 peer-checked:shadow dark:peer-checked:text-gray-100"><span className="font-semibold">{t('langArabic')}</span></label></div><div className="col-span-1"><input type="radio" id="lang-en" name="language" value="English" checked={formData.language === 'English'} onChange={handleInputChange} className="sr-only peer"/><label htmlFor="lang-en" className="block w-full text-center py-2 px-2 rounded-md cursor-pointer transition-colors text-gray-400 peer-checked:bg-gray-700 peer-checked:shadow dark:peer-checked:text-gray-100"><span className="font-semibold">{t('langEnglish')}</span></label></div><div className="col-span-2"><input type="radio" id="lang-id" name="language" value="Indonesian" checked={formData.language === 'Indonesian'} onChange={handleInputChange} className="sr-only peer"/><label htmlFor="lang-id" className="block w-full text-center py-2 px-2 rounded-md cursor-pointer transition-colors text-gray-400 peer-checked:bg-gray-700 peer-checked:shadow dark:peer-checked:text-gray-100"><span className="font-semibold">{t('langIndonesian')}</span></label></div></div></div>
                        </Card>
                    </div>
                )}
                {step === 3 && (
                    <div ref={stepRefs[3]}>
                        <Card title={t('cardTitleJourney')}>
                            <div><label htmlFor="journey" className="block text-sm font-medium text-gray-300">{t('quizJourneyLabel')}</label><textarea id="journey" name="journey" rows={6} value={formData.journey} onChange={handleInputChange} required className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm text-gray-200"></textarea></div>
                        </Card>
                    </div>
                )}

                <div className="mt-8 flex gap-4">
                    {step > 1 && <button type="button" onClick={handleBack} className="w-full bg-gray-700 text-gray-200 font-bold py-3 px-6 rounded-lg shadow-sm hover:shadow-md">{t('backButton')}</button>}
                    {step < 3 && <button type="button" onClick={handleNext} className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:shadow-lg">{t('nextButton')}</button>}
                    {step === 3 && <button type="submit" disabled={isSubmitting} className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:shadow-lg disabled:opacity-50">{t('submitButton')}</button>}
                </div>
            </form>
            <div className="mt-12 text-center"><button onClick={() => navigateTo('home')} className="text-sm font-semibold text-gray-400 hover:text-amber-400">{t('backToHome')}</button></div>
        </div>
    );
};

export default TasmiQuizPage;
