import React, { useState, useEffect, useRef } from 'react';
import { Page, SubmissionType } from '../types';
import { TAJWID_IMPROVEMENT_PRICES, TIME_SLOTS, MAIN_TIME_BLOCKS } from '../constants';
import { sendTajwidRequestToDiscord, isTestModeEnabled } from '../discordService';
import { supabase } from '../supabaseClient';

interface TajwidQuizPageProps {
    navigateTo: (page: Page) => void;
    t: (key: string) => string;
    setLastSubmissionType: (type: SubmissionType) => void;
}

interface TajwidFormData {
    name: string;
    age: string;
    whatsapp: string;
    time: string; // Slot ID
    tajwidLevel: string;
    subscription: number;
    additionalNotes: string;
}

const TajwidQuizPage: React.FC<TajwidQuizPageProps> = ({ navigateTo, t, setLastSubmissionType }) => {
    const subscriptionOptions = Object.keys(TAJWID_IMPROVEMENT_PRICES).map(Number).sort((a, b) => b - a);
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState<TajwidFormData>({
        name: '', age: '', whatsapp: '', time: '', tajwidLevel: t('tajwidLevelNormal'), 
        subscription: subscriptionOptions[0], additionalNotes: ''
    });
    const [bookedSeats, setBookedSeats] = useState<string[]>([]);
    const [isLoadingSeats, setIsLoadingSeats] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [expandedBlock, setExpandedBlock] = useState<string | null>(null);
    const formRef = useRef<HTMLFormElement>(null);
    const pageTopRef = useRef<HTMLDivElement>(null);
    
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
        return () => { supabase.removeChannel(channel); };
    }, []);

    const scrollToTop = () => {
        pageTopRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({...prev, [name]: value}));
    };
    
    const handleNext = () => {
        const form = formRef.current;
        if (!form) return;
        let fieldsToValidate: string[] = [];
        if (step === 1) fieldsToValidate = ['name', 'age', 'whatsapp'];
        if (step === 2) fieldsToValidate = ['time', 'tajwidLevel', 'subscription'];
        
        const areFieldsValid = fieldsToValidate.every(fieldName => {
            const field = form.elements.namedItem(fieldName) as RadioNodeList | HTMLInputElement;
            if (field instanceof RadioNodeList) return Array.from(field).some(radio => (radio as HTMLInputElement).checked);
            if (field) return field.checkValidity();
            return false;
        });

        if (areFieldsValid) {
            setStep(s => s + 1);
            scrollToTop();
        } else {
            form.reportValidity();
        }
    };

    const handleBack = () => {
        setStep(s => s - 1);
        scrollToTop();
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
                    time_slot: selectedTimeSlot, seat_number: `tajwid_${selectedTimeSlot}`, is_booked: true,
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
            
            const dayToKeyMap: {[key: number]: string} = { 15: 'subscriptionOption15Days', 10: 'subscriptionOption10Days', 5: 'subscriptionOption5Days' };
            const subscriptionText = t(dayToKeyMap[formData.subscription]);
            const priceText = TAJWID_IMPROVEMENT_PRICES[formData.subscription].toLocaleString() + " IDR";

            await sendTajwidRequestToDiscord({
                ...formData,
                time: preferredTimeText,
                subscriptionText,
                priceText,
            }, t);
            
            setLastSubmissionType('paid');
            navigateTo('thanks');
        } catch (error: any) {
            console.error('Error booking seat or submitting request:', error.message || error);
            alert('This time slot was just booked by someone else, or an error occurred. Please select another time and try again.');
            fetchBookedSeats();
        } finally {
            setIsSubmitting(false);
        }
    };

    const tajwidLevels = [{ key: 'tajwidLevelGood' }, { key: 'tajwidLevelNormal' }, { key: 'tajwidLevelNotTooGood' }, { key: 'tajwidLevelBad' }, { key: 'tajwidLevelReallyBad' }];

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
        <div ref={pageTopRef}>
            <div className="text-center mb-6"><h2 className="text-3xl font-bold text-gray-100">{t('tajwidQuizTitle')}</h2></div>
            <form ref={formRef} onSubmit={handleSubmit} className="max-w-2xl mx-auto">
                <FormProgress currentStep={step} totalSteps={4} />
                {step === 1 && (<Card title={t('cardTitlePersonalInfo')}>
                    <div><label htmlFor="name" className="block text-sm font-medium text-gray-300">{t('quizNameLabel')}</label><input type="text" id="name" name="name" value={formData.name} onChange={handleInputChange} required className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm text-gray-200" /></div>
                    <div><label htmlFor="age" className="block text-sm font-medium text-gray-300">{t('quizAgeLabel')}</label><input type="text" inputMode="decimal" pattern="[0-9٠-٩]*" id="age" name="age" value={formData.age} onChange={handleInputChange} required className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm text-gray-200" /></div>
                    <div><label htmlFor="whatsapp" className="block text-sm font-medium text-gray-300">{t('whatsappLabel')}</label><input type="tel" id="whatsapp" name="whatsapp" value={formData.whatsapp} onChange={handleInputChange} required className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm text-gray-200" /></div>
                </Card>)}
                {step === 2 && (<Card title={t('cardTitleSessionDetails')}>
                    <div><span className="block text-sm font-medium text-gray-300">{t('quizTimeLabel')}</span><div className="mt-2 rounded-lg bg-gray-900 p-3 space-y-3">{isLoadingSeats ? (<div className="space-y-3">{[...Array(3)].map((_, i) => (<div key={i} className="h-16 bg-gray-800 rounded-lg animate-pulse"></div>))}</div>) : (MAIN_TIME_BLOCKS.map(block => (<div key={block.id}><button type="button" onClick={() => setExpandedBlock(b => b === block.id ? null : block.id)} className="w-full text-left p-4 rounded-lg bg-gray-700/50 hover:bg-gray-700 transition-all shadow-sm flex justify-between items-center"><><div><h4 className="font-semibold text-gray-200">{t(block.key)}</h4><p className="text-xs text-gray-400">{t(block.timeRangeKey)}</p></div><svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-stone-500 transform transition-transform ${expandedBlock === block.id ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg></></button>{expandedBlock === block.id && (<div className="mt-2 p-3 bg-gray-700/30 rounded-lg"><div className="flex flex-col gap-2">{block.slots.map(slot => { const isBooked = bookedSeats.includes(slot.id); return (<div key={slot.id}><input type="radio" id={`time-${slot.id}`} name="time" value={slot.id} required disabled={isBooked} className="sr-only peer" onChange={() => setFormData(f => ({...f, time: slot.id}))} checked={formData.time === slot.id} /><label htmlFor={`time-${slot.id}`} className={`block text-center py-3 px-2 rounded-lg cursor-pointer transition-all border-2 text-sm font-semibold ${isBooked ? 'bg-gray-800 text-gray-600 cursor-not-allowed line-through border-transparent' : 'bg-gray-700 text-gray-300 border-transparent hover:border-amber-400 peer-checked:bg-amber-500 peer-checked:text-white peer-checked:border-amber-600 peer-checked:shadow-lg'}`}>{t(slot.key)}</label></div>); })}</div></div>)}</div>)))}</div><p className="text-center mt-2 text-xs text-gray-400">{t('timezoneNote')}</p></div>
                    <div><span className="block text-sm font-medium text-gray-300">{t('tajwidLevelLabel')}</span><div className="mt-2 space-y-2">{tajwidLevels.map(level => (<div key={level.key}><input type="radio" id={level.key} name="tajwidLevel" value={t(level.key)} checked={formData.tajwidLevel === t(level.key)} onChange={(e) => setFormData(f => ({...f, tajwidLevel: e.target.value}))} className="sr-only peer" /><label htmlFor={level.key} className="block w-full text-center py-2 px-4 rounded-md cursor-pointer transition-colors bg-gray-900 text-gray-400 peer-checked:bg-gray-700 peer-checked:shadow dark:peer-checked:text-gray-100"><span className="font-semibold">{t(level.key)}</span></label></div>))}</div></div>
                    <div><span className="block text-sm font-medium text-gray-300">{t('subscriptionLengthLabel')}</span><div className="mt-2 grid grid-cols-3 gap-2 rounded-lg bg-gray-900 p-1">{subscriptionOptions.map(days => {const dayToKeyMap: {[k: number]: string} = {15:'subscriptionOption15Days',10:'subscriptionOption10Days',5:'subscriptionOption5Days'};return (<div key={days}><input type="radio" id={`sub-${days}`} name="subscription" value={days} checked={formData.subscription === days} onChange={() => setFormData(f => ({...f, subscription: days}))} className="sr-only peer"/><label htmlFor={`sub-${days}`} className="block w-full text-center py-2 px-2 rounded-md cursor-pointer transition-colors text-gray-400 peer-checked:bg-gray-700 peer-checked:shadow dark:peer-checked:text-gray-100"><span className="font-semibold">{t(dayToKeyMap[days])}</span></label></div>);})}</div><div className="text-center mt-2"><p className="text-sm font-semibold text-gray-300">{t('priceDisplay').replace('{price}', TAJWID_IMPROVEMENT_PRICES[formData.subscription].toLocaleString())}</p></div></div>
                </Card>)}
                {step === 3 && (
                    <Card title={t('cardTitleAdditionalNotes')}>
                        <div>
                            <label htmlFor="additionalNotes" className="block text-sm font-medium text-gray-300">{t('infoLabel')}</label>
                            <textarea id="additionalNotes" name="additionalNotes" rows={6} value={formData.additionalNotes} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm text-gray-200"></textarea>
                        </div>
                    </Card>
                )}
                {step === 4 && (<Card title={t('cardTitleSummary')}>
                    <div className="bg-gray-700/50 p-4 rounded-lg text-left space-y-4">
                        <h4 className="font-bold text-lg text-center text-gray-100 pb-2 border-b border-gray-600">{t('summaryTitle')}</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-400">{t('summaryTime')}</p>
                                <p className="font-semibold text-gray-200">{formData.time ? t(TIME_SLOTS.morning.find(s=>s.id===formData.time)?.key || TIME_SLOTS.afternoon.find(s=>s.id===formData.time)?.key || TIME_SLOTS.evening.find(s=>s.id===formData.time)?.key || '') : ''}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-400">{t('tajwidLevelLabel')}</p>
                                <p className="font-semibold text-gray-200">{formData.tajwidLevel}</p>
                            </div>
                        </div>
                        {formData.additionalNotes && (
                             <div className="border-t border-gray-600 pt-4">
                                <p className="text-sm text-gray-400">{t('infoLabel')}</p>
                                <p className="font-semibold text-gray-200 whitespace-pre-wrap">{formData.additionalNotes}</p>
                            </div>
                        )}
                        <div className="border-t border-gray-600 pt-4">
                            <p className="text-sm text-gray-400">{t('subscriptionLengthLabel')}</p>
                            <p className="text-2xl font-bold text-gray-100">{t('priceDisplay').replace('{price}', TAJWID_IMPROVEMENT_PRICES[formData.subscription].toLocaleString())}</p>
                        </div>
                    </div>
                </Card>)}
                <div className="mt-8 flex gap-4">
                    {step > 1 && <button type="button" onClick={handleBack} className="w-full bg-gray-700 text-gray-200 font-bold py-3 px-6 rounded-lg shadow-sm hover:shadow-md">{t('backButton')}</button>}
                    {step < 4 && <button type="button" onClick={handleNext} className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:shadow-lg">{t('nextButton')}</button>}
                    {step === 4 && <button type="submit" disabled={isSubmitting} className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:shadow-lg disabled:opacity-50">{t('submitButton')}</button>}
                </div>
            </form>
            <div className="mt-12 text-center"><button onClick={() => navigateTo('home')} className="text-sm font-semibold text-gray-400 hover:text-amber-400">{t('backToHome')}</button></div>
        </div>
    );
};

export default TajwidQuizPage;