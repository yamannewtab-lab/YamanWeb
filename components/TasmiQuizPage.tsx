import React, { useState, useEffect, useRef } from 'react';
import { Page } from '../types';
import { sendTasmiRequestToDiscord, isTestModeEnabled } from '../discordService';
import { TIME_SLOTS, MAIN_TIME_BLOCKS } from '../constants';
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
    time: string; // This will be the slot ID
    language: string;
    journey: string;
}

const TasmiQuizPage: React.FC<TasmiQuizPageProps> = ({ navigateTo, t }) => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState<TasmiFormData>({
        name: '', age: '', whatsapp: '', sessions: 1, 
        portion: t('tasmiFatihahOption'), time: '', language: 'Arabic', journey: ''
    });
    const [bookedSeats, setBookedSeats] = useState<string[]>([]);
    const [isLoadingSeats, setIsLoadingSeats] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [expandedBlock, setExpandedBlock] = useState<string | null>(null);
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
    
    const fetchBookedSeats = async () => {
        setIsLoadingSeats(true);
        try {
            const { data, error } = await supabase.from('seats').select('time_slot');
            if (error) throw error;
            if (data) setBookedSeats(data.map(seat => seat.time_slot));
        } catch (error: any) {
            console.error('Error fetching booked seats:', error.message || error);
        } finally {
            setIsLoadingSeats(false);
        }
    };

    useEffect(() => {
        fetchBookedSeats();
        const channel = supabase.channel('public-seats');
        const subscription = channel
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'seats' }, (payload) => {
                const newBookedSlot = payload.new.time_slot;
                if (newBookedSlot) {
                    setBookedSeats(currentSeats => currentSeats.includes(newBookedSlot) ? currentSeats : [...currentSeats, newBookedSlot]);
                }
            }).subscribe();
        
        return () => { 
            supabase.removeChannel(channel); 
        };
    }, []);
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({...prev, [name]: value}));
    };

    const handleNext = () => {
        const form = formRef.current;
        if (!form) return;

        let fieldsToValidate: string[] = [];
        if (step === 1) fieldsToValidate = ['name', 'age', 'whatsapp'];
        if (step === 2) fieldsToValidate = ['sessions', 'portion', 'time', 'language'];
        
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

        const selectedTimeSlot = formData.time;
        if (!selectedTimeSlot) {
            alert('Please select a time slot.');
            setIsSubmitting(false);
            return;
        }
        
        try {
            if (!isTestModeEnabled()) {
                const { error: bookingError } = await supabase.from('seats').insert({ 
                    time_slot: selectedTimeSlot, seat_number: `tasmi_${selectedTimeSlot}`, is_booked: true,
                });
                if (bookingError) throw bookingError;
            }

            let preferredTimeText = '';
            Object.values(TIME_SLOTS).flat().find(slot => {
                if (slot.id === selectedTimeSlot) {
                    preferredTimeText = t(slot.key);
                    return true;
                }
                return false;
            });
            
            await sendTasmiRequestToDiscord({ ...formData, time: preferredTimeText }, t);
            navigateTo('tasmiInfo');
        } catch (error: any) {
            console.error('Error booking seat or submitting request:', error.message || error);
            alert('This time slot was just booked by someone else, or an error occurred. Please select another time and try again.');
            fetchBookedSeats();
        } finally {
            setIsSubmitting(false);
        }
    };

    const Card = ({ title, children }: { title: string, children: React.ReactNode }) => (
        <div className="bg-gray-800/50 p-6 rounded-xl shadow-sm border border-gray-700/50 page-transition">
            <h3 className="text-xl font-bold text-gray-100 mb-6 border-b border-gray-700 pb-3">{title}</h3>
            <div className="space-y-6">{children}</div>
        </div>
    );

    const FormProgress = ({ currentStep, totalSteps }: { currentStep: number, totalSteps: number }) => (
        <div className="mb-6 text-center"><p className="text-sm font-semibold text-gray-400">{t('stepIndicator').replace('{current}', String(currentStep)).replace('{total}', String(totalSteps))}</p><div className="mt-2 flex justify-center items-center gap-2">{[...Array(totalSteps)].map((_, i) => (<div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i + 1 <= currentStep ? 'bg-amber-500' : 'bg-gray-600'}`} style={{ width: `${100 / totalSteps}%`}}></div>))}</div></div>
    );

    return (
        <div>
            <div className="text-center mb-6"><h2 className="text-3xl font-bold text-gray-100">{t('tasmiQuizTitle')}</h2></div>
            <form ref={formRef} onSubmit={handleSubmit} className="max-w-2xl mx-auto">
                <FormProgress currentStep={step} totalSteps={3} />
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
                            <div><label className="block text-sm font-medium text-gray-300">{t('tasmiWeeklyLabel')}</label><div className="mt-2 rounded-lg bg-gray-900 p-2"><div className="grid grid-cols-5 gap-2">{[1, 2, 3, 4, 5].map(day => (<div key={day}><input type="radio" id={`session-${day}`} name="sessions" value={day} checked={formData.sessions === day} onChange={() => setFormData(f => ({...f, sessions: day}))} className="sr-only peer" /><label htmlFor={`session-${day}`} className="block text-center py-2 px-4 rounded-md cursor-pointer transition-colors duration-200 ease-in-out peer-checked:bg-gray-700 peer-checked:shadow text-gray-400 peer-checked:text-gray-100"><span className="font-semibold">{day}</span></label></div>))}</div></div></div>
                            <div><label htmlFor="portion" className="block text-sm font-medium text-gray-300">{t('tasmiPortionLabel')}</label><select id="portion" name="portion" value={formData.portion} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm text-gray-200"><option>{t('tasmiFatihahOption')}</option><option>{t('tasmiJuzAmmaOption')}</option></select></div>
                            <div><span className="block text-sm font-medium text-gray-300">{t('tasmiTimeLabel')}</span><div className="mt-2 rounded-lg bg-gray-900 p-3 space-y-3">{isLoadingSeats ? (<div className="space-y-3">{[...Array(3)].map((_, i) => (<div key={i} className="h-16 bg-gray-800 rounded-lg animate-pulse"></div>))}</div>) : (MAIN_TIME_BLOCKS.map(block => (<div key={block.id}><button type="button" onClick={() => setExpandedBlock(b => b === block.id ? null : block.id)} className="w-full text-left p-4 rounded-lg bg-gray-700/50 hover:bg-gray-700 transition-all shadow-sm flex justify-between items-center"><><div><h4 className="font-semibold text-gray-200">{t(block.key)}</h4><p className="text-xs text-gray-400">{t(block.timeRangeKey)}</p></div><svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-stone-500 transform transition-transform ${expandedBlock === block.id ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg></></button>{expandedBlock === block.id && (<div className="mt-2 p-3 bg-gray-700/30 rounded-lg"><div className="flex flex-col gap-2">{block.slots.map(slot => { const isBooked = bookedSeats.includes(slot.id); return (<div key={slot.id}><input type="radio" id={`time-${slot.id}`} name="time" value={slot.id} required disabled={isBooked} className="sr-only peer" onChange={() => setFormData(f => ({...f, time: slot.id}))} checked={formData.time === slot.id} /><label htmlFor={`time-${slot.id}`} className={`block text-center py-3 px-2 rounded-lg cursor-pointer transition-all border-2 text-sm font-semibold ${isBooked ? 'bg-gray-800 text-gray-600 cursor-not-allowed line-through border-transparent' : 'bg-gray-700 text-gray-300 border-transparent hover:border-amber-400 peer-checked:bg-amber-500 peer-checked:text-white peer-checked:border-amber-600 peer-checked:shadow-lg'}`}>{t(slot.key)}</label></div>); })}</div></div>)}</div>)))}</div><p className="text-center mt-2 text-xs text-gray-400">{t('timezoneNote')}</p></div>
                            <div><span className="block text-sm font-medium text-gray-300">{t('quizLanguageLabel')}</span><div className="mt-2 grid grid-cols-2 gap-1 rounded-lg bg-gray-900 p-1"><div className="col-span-1"><input type="radio" id="lang-ar" name="language" value="Arabic" checked={formData.language === 'Arabic'} onChange={handleInputChange} className="sr-only peer"/><label htmlFor="lang-ar" className="block w-full text-center py-2 px-2 rounded-md cursor-pointer transition-colors text-gray-400 peer-checked:bg-gray-700 peer-checked:shadow dark:peer-checked:text-gray-100"><span className="font-semibold">{t('langArabic')}</span></label></div><div className="col-span-1"><input type="radio" id="lang-en" name="language" value="English" checked={formData.language === 'English'} onChange={handleInputChange} className="sr-only peer"/><label htmlFor="lang-en" className="block w-full text-center py-2 px-2 rounded-md cursor-pointer transition-colors text-gray-400 peer-checked:bg-gray-700 peer-checked:shadow dark:peer-checked:text-gray-100"><span className="font-semibold">{t('langEnglish')}</span></label></div><div className="col-span-2"><input type="radio" id="lang-id" name="language" value="Indonesian" checked={formData.language === 'Indonesian'} onChange={handleInputChange} className="sr-only peer"/><label htmlFor="lang-id" className="block w-full text-center py-2 px-2 rounded-md cursor-pointer transition-colors text-gray-400 peer-checked:bg-gray-700 peer-checked:shadow dark:peer-checked:text-gray-100"><span className="font-semibold">{t('langIndonesian')}</span></label></div></div></div>
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