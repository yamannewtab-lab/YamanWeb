import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Page, SubmissionType } from '../types';
import { TAJWID_IMPROVEMENT_PRICES, TIME_SLOTS, MAIN_TIME_BLOCKS } from '../constants';
import { sendTajwidRequestToDiscord, isTestModeEnabled } from '../discordService';
import { supabase } from '../supabaseClient';

interface TajwidQuizPageProps {
    navigateTo: (page: Page) => void;
    t: (key: string) => string;
    setLastSubmissionType: (type: SubmissionType) => void;
    setLastSubmittedName: (name: string) => void;
}

interface TajwidFormData {
    name: string;
    age: string;
    whatsapp: string;
    time: string; // Slot ID
    tajwidLevel: string;
    daysPerWeek: number;
    selectedDays: string[];
    additionalNotes: string;
    requestedSessions?: string;
    paymentPreference?: string;
    paymentMethod?: string;
    agreedToTerms?: boolean;
}

const Card = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div className="bg-gray-800/50 p-6 rounded-xl shadow-sm border border-gray-700/50 page-transition">
        <h3 className="text-xl font-bold text-gray-100 mb-6 border-b border-gray-700 pb-3">{title}</h3>
        <div className="space-y-6">{children}</div>
    </div>
);

const FormProgress = ({ currentStep, totalSteps, t }: { currentStep: number, totalSteps: number, t: (key: string) => string }) => (
    <div className="mb-6 text-center">
        <p className="text-sm font-semibold text-gray-400">{t('stepIndicator').replace('{current}', String(currentStep)).replace('{total}', String(totalSteps))}</p>
        <div className="mt-2 flex justify-center items-center gap-2">
            {[...Array(totalSteps)].map((_, i) => (
                <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i + 1 <= currentStep ? 'bg-amber-500' : 'bg-gray-600'}`} style={{ width: `${100 / totalSteps}%`}}></div>
            ))}
        </div>
    </div>
);

const DayButton: React.FC<{
    day: string;
    t: (key: string) => string;
    isSelected: boolean;
    onClick: (day: string) => void;
    disabled?: boolean;
}> = React.memo(({ day, t, isSelected, onClick, disabled }) => {
    return (
        <button
            type="button"
            onClick={() => onClick(day)}
            disabled={disabled}
            className={`w-full text-center py-2 px-2 rounded-md cursor-pointer transition-all duration-200 ease-in-out border-2 text-sm font-semibold ${
                isSelected 
                    ? 'bg-amber-500 text-white border-amber-600 shadow-lg' 
                    : 'bg-gray-700 text-gray-300 border-transparent hover:border-amber-400'
            } ${disabled ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
            {t(`day${day}`)}
        </button>
    );
});


const TajwidQuizPage: React.FC<TajwidQuizPageProps> = ({ navigateTo, t, setLastSubmissionType, setLastSubmittedName }) => {
    const weekdays = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState<TajwidFormData>({
        name: '', age: '', whatsapp: '', time: '', 
        tajwidLevel: '', 
        daysPerWeek: 0,
        selectedDays: [],
        additionalNotes: '',
        agreedToTerms: false,
    });
    const [accountName, setAccountName] = useState('');
    const [accountPassword, setAccountPassword] = useState('');
    const [allBookings, setAllBookings] = useState<{ time_slot: string; day_number: number; }[]>([]);
    const [isLoadingSeats, setIsLoadingSeats] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [expandedBlock, setExpandedBlock] = useState<string | null>(null);
    const formRef = useRef<HTMLFormElement>(null);
    const stepRefs = {
        1: useRef<HTMLDivElement>(null),
        2: useRef<HTMLDivElement>(null),
        3: useRef<HTMLDivElement>(null),
        4: useRef<HTMLDivElement>(null),
        5: useRef<HTMLDivElement>(null),
        6: useRef<HTMLDivElement>(null),
    };

    const dayStringToNumber = (day: string): number => {
        const map: { [key: string]: number } = {
            'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3,
            'Thursday': 4, 'Friday': 5, 'Saturday': 6
        };
        return map[day] ?? -1;
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
    
    const fetchAllBookings = async () => {
        setIsLoadingSeats(true);
        try {
            const { data, error } = await supabase.from('booking').select('time_slot, day_number').eq('is_booked', true);
            if (error) throw error;
            if (data) setAllBookings(data || []);
        } catch (error: any) {
            console.error('Error fetching booked slots:', error.message || error);
        } finally {
            setIsLoadingSeats(false);
        }
    };

    useEffect(() => {
        fetchAllBookings();
        const channel = supabase.channel('public-booking');
        const subscription = channel
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'booking' }, (payload) => {
                 const newBooking = payload.new as { time_slot: string, day_number: number, is_booked: boolean };
                if (newBooking.time_slot && newBooking.day_number !== undefined && newBooking.is_booked) {
                    setAllBookings(currentBookings =>
                        currentBookings.some(b => b.time_slot === newBooking.time_slot && b.day_number === newBooking.day_number)
                            ? currentBookings
                            : [...currentBookings, { time_slot: newBooking.time_slot, day_number: newBooking.day_number }]
                    );
                }
            }).subscribe();

        return () => { 
            supabase.removeChannel(channel);
        };
    }, []);

    const handleDaySelection = (days: number) => {
        setFormData(prev => {
            const newSelectedDays = days === 7 ? weekdays : [];
            return {
                ...prev,
                daysPerWeek: days,
                selectedDays: newSelectedDays,
            };
        });
    };
    
    const handleDayToggle = useCallback((day: string) => {
        if (formData.daysPerWeek === 7) return;

        setFormData(prev => {
            const currentDays = prev.selectedDays || [];
            const isSelected = currentDays.includes(day);
            let newDays;

            if (isSelected) {
                newDays = currentDays.filter(d => d !== day);
            } else {
                if (currentDays.length < prev.daysPerWeek) {
                    newDays = [...currentDays, day];
                } else {
                    const withoutLast = currentDays.slice(0, -1);
                    newDays = [...withoutLast, day];
                }
            }
            return { ...prev, selectedDays: newDays };
        });
    }, [formData.daysPerWeek]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        setFormData(prev => ({...prev, [name]: type === 'checkbox' ? checked : value}));
    };
    
    const handleNext = () => {
        const form = formRef.current;
        if (!form || !form.checkValidity()) {
            form?.reportValidity();
            return;
        }

        if (step === 2) {
             if (formData.daysPerWeek === 0 || !formData.daysPerWeek) {
                alert(`Please select your ${t('quizWeeklyLabel').toLowerCase().replace(':', '')}.`);
                return;
             }
             if (formData.daysPerWeek < 7 && (formData.selectedDays?.length ?? 0) !== formData.daysPerWeek) {
                alert(t('daysSelected').replace('{count}', String(formData.selectedDays?.length ?? 0)).replace('{total}', String(formData.daysPerWeek)) + `. Please select exactly ${formData.daysPerWeek} days.`);
                return;
            }
        }
        
        setStep(s => s + 1);
    };

    const handleBack = () => {
        setStep(s => s - 1);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!formData.time) {
            alert("Please select a time slot.");
            return;
        }
        if (!accountName.trim() || !accountPassword.trim()) {
            alert("Please create an account name and password.");
            return;
        }
        setIsSubmitting(true);
       
        try {
            const daysToBook = formData.daysPerWeek === 7
                ? weekdays
                : formData.selectedDays || [];

            if (daysToBook.length === 0) {
                alert("Please select your preferred days before submitting.");
                setIsSubmitting(false);
                return;
            }

            const selectedSlot = Object.values(TIME_SLOTS).flat().find(s => s.id === formData.time);
            if (!selectedSlot) {
                throw new Error("Selected time slot details could not be found.");
            }

            // Check if account name already exists
            const { data: existingUser, error: selectError } = await supabase
                .from('passcodes')
                .select('name')
                .eq('name', accountName.trim())
                .single();

            if (selectError && selectError.code !== 'PGRST116') { // PGRST116 means no rows found, which is good
                throw selectError;
            }

            if (existingUser) {
                alert('This account name is already taken. Please choose another one.');
                setIsSubmitting(false);
                return;
            }
            
            // Store name and passcode with all details
            const { error: passcodeError } = await supabase
                .from('passcodes')
                .insert([{ 
                    name: accountName.trim(), 
                    code: accountPassword.trim(),
                    path: t('tajwidQuizTitle'),
                    start_time_id: formData.time,
                    selected_days: daysToBook.join(', ')
                }]);

            if (passcodeError) {
                throw passcodeError;
            }
            
            const slotsToBook = daysToBook.map(day => ({
                time_slot: selectedSlot.id,
                day_number: dayStringToNumber(day),
            }));
            
            const approvalRequest = {
                name: formData.name,
                application_type: 'Tajwid',
                requested_slots: JSON.stringify(slotsToBook),
                application_data: JSON.stringify(formData),
                status: 'pending'
            };

            if (!isTestModeEnabled()) {
                const { error } = await supabase.from('approvals').insert([approvalRequest]);
                if (error) throw error;
            }

            const preferredTimeText = t(selectedSlot.key);
            const priceText = TAJWID_IMPROVEMENT_PRICES[formData.daysPerWeek].toLocaleString() + " IDR";

            await sendTajwidRequestToDiscord({
                ...formData,
                time: preferredTimeText,
                selectedDays: daysToBook,
                priceText,
            }, t);
            
            setLastSubmittedName(accountName.trim());
            setLastSubmissionType('paid');
            navigateTo('thanks');
        } catch (error: any) {
            console.error('Error submitting Tajwid application:', error.message || error);
            alert('An error occurred while submitting your application. Please try again.');
            fetchAllBookings();
        } finally {
            setIsSubmitting(false);
        }
    };

    const getDayButtonColors = (day: number): string => {
        const colors = [
            'peer-checked:bg-red-600 peer-checked:text-white',
            'peer-checked:bg-orange-500 peer-checked:text-white',
            'peer-checked:bg-amber-500 peer-checked:text-stone-800',
            'peer-checked:bg-yellow-500 peer-checked:text-stone-800',
            'peer-checked:bg-lime-600 peer-checked:text-white',
            'peer-checked:bg-green-600 peer-checked:text-white',
            'peer-checked:bg-teal-600 peer-checked:text-white',
        ];
        return colors[day - 1] || 'peer-checked:bg-gray-700';
    };

    const price = TAJWID_IMPROVEMENT_PRICES[formData.daysPerWeek] || 0;
    const priceString = `${price.toLocaleString()} IDR`;
    const tajwidLevels = [{ key: 'tajwidLevelGood' }, { key: 'tajwidLevelNormal' }, { key: 'tajwidLevelNotTooGood' }, { key: 'tajwidLevelBad' }, { key: 'tajwidLevelReallyBad' }];

    return (
        <div>
            <div className="text-center mb-6"><h2 className="text-3xl font-bold text-gray-100">{t('tajwidQuizTitle')}</h2></div>
            <form ref={formRef} onSubmit={handleSubmit} className="max-w-2xl mx-auto">
                <FormProgress currentStep={step} totalSteps={6} t={t} />
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
                            <div>
                                <label className="block text-sm font-medium text-gray-300">{t('quizWeeklyLabel')}</label>
                                <div className="mt-2 rounded-lg bg-gray-900 p-2"><div className="grid grid-cols-12 gap-2">{[1, 2, 3, 4, 5, 6, 7].map(day => (<div key={day} className={day <= 4 ? 'col-span-3' : 'col-span-4'}><input type="radio" id={`day-${day}`} name="daysPerWeek" value={day} checked={formData.daysPerWeek === day} onChange={() => handleDaySelection(day)} className="sr-only peer" /><label htmlFor={`day-${day}`} className={`block text-center py-2 px-4 rounded-md cursor-pointer transition-colors duration-200 ease-in-out peer-checked:shadow text-gray-400 ${getDayButtonColors(day)}`}><span className="font-semibold">{day}</span></label></div>))}</div></div>
                                <div className="text-center mt-2"><p className="text-sm text-gray-400">{`Price: ${priceString} / month`}</p></div>
                            </div>
                             
                             {formData.daysPerWeek > 0 && formData.daysPerWeek !== 7 && (
                                <div>
                                    <span className="block text-sm font-medium text-gray-300">{t('selectDaysOfWeek')}</span>
                                    <div className="mt-2 p-2 rounded-lg bg-gray-900">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            {weekdays.map(day => (
                                                <DayButton
                                                    key={day}
                                                    day={day}
                                                    t={t}
                                                    isSelected={formData.selectedDays.includes(day)}
                                                    onClick={handleDayToggle}
                                                    disabled={formData.daysPerWeek === 7}
                                                />
                                            ))}
                                        </div>
                                        <p className="text-center text-xs text-gray-400 mt-2">
                                            {t('daysSelected').replace('{count}', String(formData.selectedDays.length)).replace('{total}', String(formData.daysPerWeek))}
                                        </p>
                                    </div>
                                </div>
                             )}
                            
                            <div><span className="block text-sm font-medium text-gray-300">{t('quizTimeLabel')}</span><div className="mt-2 rounded-lg bg-gray-900 p-3 space-y-3">{isLoadingSeats ? (<div className="space-y-3">{[...Array(3)].map((_, i) => (<div key={i} className="h-16 bg-gray-800 rounded-lg animate-pulse"></div>))}</div>) : (MAIN_TIME_BLOCKS.map(block => (<div key={block.id}><button type="button" onClick={() => setExpandedBlock(b => b === block.id ? null : block.id)} className="w-full text-left p-4 rounded-lg bg-gray-700/50 hover:bg-gray-700 transition-all shadow-sm flex justify-between items-center"><><div><h4 className="font-semibold text-gray-200">{t(block.key)}</h4><p className="text-xs text-gray-400">{t(block.timeRangeKey)}</p></div><svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-stone-500 transform transition-transform ${expandedBlock === block.id ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg></></button>{expandedBlock === block.id && (<div className="mt-2 p-3 bg-gray-700/30 rounded-lg"><div className="flex flex-col gap-2">{block.slots.map(slot => { const bookingsForSlot = allBookings.filter(b => b.time_slot === slot.id); const bookedDayNumbers = new Set(bookingsForSlot.map(b => b.day_number)); const isFullyBooked = bookedDayNumbers.size >= 7; let conflictDays: string[] = []; if (formData.selectedDays.length > 0) { conflictDays = formData.selectedDays.filter(day => bookedDayNumbers.has(dayStringToNumber(day))); } const isBookedOnSelectedDays = conflictDays.length > 0; const isDisabled = isFullyBooked || isBookedOnSelectedDays; return (<div key={slot.id}><div className="relative"><input type="radio" id={`time-${slot.id}`} name="time" value={slot.id} required disabled={isDisabled} className="sr-only peer" onChange={() => setFormData(f => ({...f, time: slot.id}))} checked={formData.time === slot.id} /><label htmlFor={`time-${slot.id}`} className={`block text-center py-3 px-2 rounded-lg cursor-pointer transition-all border-2 text-sm font-semibold ${isDisabled ? 'bg-gray-800 text-gray-600 cursor-not-allowed border-transparent' : 'bg-gray-700 text-gray-300 border-transparent hover:border-amber-400 peer-checked:bg-amber-500 peer-checked:text-white peer-checked:border-amber-600 peer-checked:shadow-lg'}`}><span className={isDisabled ? 'line-through' : ''}>{t(slot.key)}</span></label></div>{isDisabled && (<p className="text-xs text-red-400 text-center mt-1">{isFullyBooked ? t('fullyBooked') : t('bookedOnYourSelectedDays').replace('{days}', conflictDays.map(d => t(`day${d}`)).join(', '))}</p>)}</div>); })}</div></div>)}</div>)))}</div><p className="text-center mt-2 text-xs text-gray-400">{t('timezoneNote')}</p></div>
                            <div><span className="block text-sm font-medium text-gray-300">{t('tajwidLevelLabel')}</span><div className="mt-2 space-y-2">{tajwidLevels.map(level => (<div key={level.key}><input type="radio" id={level.key} name="tajwidLevel" value={t(level.key)} required checked={formData.tajwidLevel === t(level.key)} onChange={(e) => setFormData(f => ({...f, tajwidLevel: e.target.value}))} className="sr-only peer" /><label htmlFor={level.key} className="block w-full text-center py-2 px-4 rounded-md cursor-pointer transition-colors bg-gray-900 text-gray-400 peer-checked:bg-gray-700 peer-checked:shadow dark:peer-checked:text-gray-100"><span className="font-semibold">{t(level.key)}</span></label></div>))}</div></div>
                        </Card>
                    </div>
                )}
                {step === 3 && (
                    <div ref={stepRefs[3]}>
                        <Card title={t('cardTitleAdditionalNotes')}>
                            <div>
                                <label htmlFor="additionalNotes" className="block text-sm font-medium text-gray-300">{t('infoLabel')}</label>
                                <textarea id="additionalNotes" name="additionalNotes" rows={4} value={formData.additionalNotes} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm text-gray-200"></textarea>
                            </div>
                             <div>
                                <label htmlFor="requestedSessions" className="block text-sm font-medium text-gray-300">{t('requestedSessionsLabel')}</label>
                                <input 
                                    type="text" 
                                    id="requestedSessions" 
                                    name="requestedSessions" 
                                    value={formData.requestedSessions || ''} 
                                    onChange={handleInputChange} 
                                    className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm text-gray-200"
                                />
                            </div>
                        </Card>
                    </div>
                )}
                {step === 4 && (
                    <div ref={stepRefs[4]}>
                        <Card title={t('cardTitleSummary')}>
                            <div className="bg-gray-700/50 p-4 rounded-lg text-left space-y-4">
                                <h4 className="font-bold text-lg text-center text-gray-100 pb-2 border-b border-gray-600">{t('summaryTitle')}</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-400">{t('summaryCommitment')}</p>
                                        <p className="font-semibold text-gray-200">{t('daysPerWeek').replace('{count}', String(formData.daysPerWeek))}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-400">{t('summaryTime')}</p>
                                        <p className="font-semibold text-gray-200">{formData.time ? t(Object.values(TIME_SLOTS).flat().find(s=>s.id===formData.time)?.key || '') : ''}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-400">{t('tajwidLevelLabel')}</p>
                                        <p className="font-semibold text-gray-200">{formData.tajwidLevel}</p>
                                    </div>
                                </div>
                                {formData.selectedDays.length > 0 && (
                                     <div className="border-t border-gray-600 pt-4">
                                        <p className="text-sm text-gray-400">{t('summaryPreferredDays')}</p>
                                        <p className="font-semibold text-gray-200">{formData.selectedDays.map(day => t(`day${day}`)).join(', ')}</p>
                                    </div>
                                )}
                                {(formData.additionalNotes || formData.requestedSessions) && (
                                    <div className="border-t border-gray-600 pt-4">
                                        <div className="space-y-3">
                                            {formData.additionalNotes && (
                                                <div>
                                                    <p className="text-sm text-gray-400">{t('infoLabel')}</p>
                                                    <p className="font-semibold text-gray-200 whitespace-pre-wrap">{formData.additionalNotes}</p>
                                                </div>
                                            )}
                                            {formData.requestedSessions && (
                                                <div>
                                                    <p className="text-sm text-gray-400">{t('summaryRequestedSessions')}</p>
                                                    <p className="font-semibold text-gray-200 whitespace-pre-wrap">{formData.requestedSessions}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                                <div className="border-t border-gray-600 pt-4">
                                    <p className="text-sm text-gray-400">{t('summaryPrice')}</p>
                                     <p className="text-2xl font-bold text-gray-100"><span>{priceString}</span><span className="text-base font-medium opacity-50 ml-1">{t('monthlyText')}</span></p>
                                </div>
                            </div>
                        </Card>
                    </div>
                )}
                {step === 5 && (
                    <div ref={stepRefs[5]}>
                        <Card title={t('paymentInfoTitle')}>
                            <div>
                                <label className="block text-sm font-medium text-gray-300">{t('paymentPrefLabel')}</label>
                                <div className="mt-2 grid grid-cols-2 gap-2 rounded-lg bg-gray-900 p-1">
                                    <div>
                                        <input type="radio" id="payment-start" name="paymentPreference" value="start" required className="sr-only peer" onChange={handleInputChange} checked={formData.paymentPreference === 'start'} />
                                        <label htmlFor="payment-start" className="block w-full text-center py-2 px-4 rounded-md cursor-pointer transition-colors duration-200 ease-in-out text-gray-400 peer-checked:bg-gray-700 peer-checked:text-gray-100 peer-checked:shadow">
                                            <span className="font-semibold">{t('paymentPrefOptionStart')}</span>
                                        </label>
                                    </div>
                                    <div>
                                        <input type="radio" id="payment-end" name="paymentPreference" value="end" required className="sr-only peer" onChange={handleInputChange} checked={formData.paymentPreference === 'end'} />
                                        <label htmlFor="payment-end" className="block w-full text-center py-2 px-4 rounded-md cursor-pointer transition-colors duration-200 ease-in-out text-gray-400 peer-checked:bg-gray-700 peer-checked:text-gray-100 peer-checked:shadow">
                                             <span className="font-semibold">{t('paymentPrefOptionEnd')}</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label htmlFor="payment-method" className="block text-sm font-medium text-gray-300">{t('paymentMethodLabel')}</label>
                                <input type="text" id="payment-method" name="paymentMethod" value={formData.paymentMethod || ''} onChange={handleInputChange} required placeholder={t('paymentMethodPlaceholder')} className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm text-gray-200 placeholder-gray-400" />
                            </div>
                            <div className="mt-4 bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                                <h4 className="font-semibold text-gray-200">{t('attendancePolicyTitle')}</h4>
                                <p className="mt-2 text-sm text-gray-400">{t('attendancePolicyNote')}</p>
                                <div className="mt-4">
                                    <label htmlFor="agree-terms" className="flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            id="agree-terms"
                                            name="agreedToTerms"
                                            checked={!!formData.agreedToTerms}
                                            onChange={handleInputChange}
                                            className="h-4 w-4 rounded border-gray-500 bg-gray-700 text-amber-600 focus:ring-amber-500"
                                        />
                                        <span className="ml-3 text-sm text-gray-300">{t('agreeToTermsLabel')}</span>
                                    </label>
                                </div>
                            </div>
                        </Card>
                    </div>
                )}
                 {step === 6 && (
                    <div ref={stepRefs[6]}>
                        <Card title={t('cardTitleAccount')}>
                            <div>
                                <label htmlFor="accountName" className="block text-sm font-medium text-gray-300">{t('accountNameLabel')}</label>
                                <input type="text" id="accountName" name="accountName" value={accountName} onChange={(e) => setAccountName(e.target.value)} required placeholder={t('accountNameLabel')} className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm text-gray-200 placeholder-gray-400" />
                            </div>
                            <div>
                                <label htmlFor="accountPassword" className="block text-sm font-medium text-gray-300">{t('passwordLabel')}</label>
                                <input
                                    type="password"
                                    id="accountPassword"
                                    name="accountPassword"
                                    value={accountPassword}
                                    onChange={(e) => setAccountPassword(e.target.value)}
                                    required
                                    placeholder="•••"
                                    maxLength={3}
                                    pattern="[0-9]*"
                                    inputMode="numeric"
                                    className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm text-gray-200 placeholder-gray-400 text-center tracking-[0.5em]"
                                />
                                <p className="mt-2 text-xs text-gray-400 text-center">{t('passwordNote')}</p>
                            </div>
                        </Card>
                    </div>
                )}
                <div className="mt-8 flex gap-4">
                    {step > 1 && <button type="button" onClick={handleBack} className="w-full bg-gray-700 text-gray-200 font-bold py-3 px-6 rounded-lg shadow-sm hover:shadow-md">{t('backButton')}</button>}
                    {step < 6 && <button type="button" onClick={handleNext} disabled={step === 5 && !formData.agreedToTerms} className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:shadow-lg disabled:opacity-50">{t('nextButton')}</button>}
                    {step === 6 && <button type="submit" disabled={isSubmitting} className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:shadow-lg disabled:opacity-50">{isSubmitting ? '...' : t('submitApplicationButton')}</button>}
                </div>
            </form>
            <div className="mt-12 text-center"><button onClick={() => navigateTo('home')} className="text-sm font-semibold text-gray-400 hover:text-amber-400">{t('backToHome')}</button></div>
        </div>
    );
};

export default TajwidQuizPage;