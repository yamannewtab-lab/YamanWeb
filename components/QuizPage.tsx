import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Page, IjazahApplication, SubmissionType } from '../types';
import { IJAZAH_PRICES, TIME_SLOTS, MAIN_TIME_BLOCKS, PATH_TRANSLATION_KEYS } from '../constants';
import { supabase } from '../supabaseClient';
import { isTestModeEnabled, sendIjazahApplicationToDiscord } from '../discordService';

interface QuizPageProps {
    navigateTo: (page: Page) => void;
    t: (key: string) => string;
    ijazahApplication: IjazahApplication;
    setIjazahApplication: React.Dispatch<React.SetStateAction<IjazahApplication>>;
    setLastSubmissionType: (type: SubmissionType) => void;
}

const Card = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div className="bg-gray-800/50 p-6 rounded-xl shadow-sm border border-gray-700/50">
        <h3 className="text-xl font-bold text-gray-100 mb-6 border-b border-gray-700 pb-3">{title}</h3>
        <div className="space-y-6">{children}</div>
    </div>
);

const FormProgress = ({ currentStep, totalSteps, t }: { currentStep: number, totalSteps: number, t: (key: string) => string }) => (
    <div className="mb-6 text-center">
        <p className="text-sm font-semibold text-gray-400">
            {t('stepIndicator').replace('{current}', String(currentStep)).replace('{total}', String(totalSteps))}
        </p>
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
}> = React.memo(({ day, t, isSelected, onClick }) => {
    return (
        <button
            type="button"
            onClick={() => onClick(day)}
            className={`w-full text-center py-2 px-2 rounded-md cursor-pointer transition-all duration-200 ease-in-out border-2 text-sm font-semibold ${
                isSelected 
                    ? 'bg-amber-500 text-white border-amber-600 shadow-lg' 
                    : 'bg-gray-700 text-gray-300 border-transparent hover:border-amber-400'
            }`}
        >
            {t(`day${day}`)}
        </button>
    );
});

const QuizPage: React.FC<QuizPageProps> = ({ navigateTo, t, ijazahApplication, setIjazahApplication, setLastSubmissionType }) => {
    const [step, setStep] = useState(1);
    const [localDetails, setLocalDetails] = useState(ijazahApplication.fullDetails);
    const [allBookings, setAllBookings] = useState<{ seat_number: number; booked_day: string; }[]>([]);
    const [isLoadingSeats, setIsLoadingSeats] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [expandedBlock, setExpandedBlock] = useState<string | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const formRef = useRef<HTMLFormElement>(null);
    const stepRefs = {
        1: useRef<HTMLDivElement>(null),
        2: useRef<HTMLDivElement>(null),
        3: useRef<HTMLDivElement>(null),
        4: useRef<HTMLDivElement>(null),
    };

    useEffect(() => {
        setLocalDetails(ijazahApplication.fullDetails);
    }, [ijazahApplication.fullDetails]);

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
            const { data, error } = await supabase
                .from('seats')
                .select('seat_number, booked_day');

            if (error) throw error;
            
            if (data) setAllBookings(data || []);
        } catch (error: any) {
            console.error('Error fetching booked seats:', error.message || error);
        } finally {
            setIsLoadingSeats(false);
        }
    };

    useEffect(() => {
        fetchAllBookings();
        const channel = supabase.channel('public-seats');
        const subscription = channel
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'seats' },
                (payload) => {
                    const newBooking = payload.new as { seat_number: number, booked_day: string };
                    if (newBooking.seat_number && newBooking.booked_day) {
                         setAllBookings(currentBookings =>
                            currentBookings.some(b => b.seat_number === newBooking.seat_number && b.booked_day === newBooking.booked_day)
                                ? currentBookings
                                : [...currentBookings, newBooking]
                        );
                    }
                }
            )
            .subscribe();
            
        return () => { 
            supabase.removeChannel(channel); 
        };
    }, []);

    const handleDaySelection = (days: number) => {
        setIjazahApplication(prev => ({ 
            ...prev, 
            daysPerWeek: days,
        }));
        // Reset selected days locally when commitment changes
        setLocalDetails(prev => ({...prev, selectedDays: []}));
    };
    
    const handleDayToggle = useCallback((day: string) => {
        setLocalDetails(prev => {
            const currentDays = prev.selectedDays || [];
            const isSelected = currentDays.includes(day);
            let newDays;

            if (isSelected) {
                newDays = currentDays.filter(d => d !== day);
            } else {
                if (currentDays.length < ijazahApplication.daysPerWeek) {
                    newDays = [...currentDays, day];
                } else {
                    const withoutLast = currentDays.slice(0, -1);
                    newDays = [...withoutLast, day];
                }
            }
            return { ...prev, selectedDays: newDays };
        });
    }, [ijazahApplication.daysPerWeek]);

    const handleDetailChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setLocalDetails(prev => ({...prev, [name]: value}));
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

    const handleNext = () => {
        const form = formRef.current;
        if (!form || !form.checkValidity()) {
            form?.reportValidity();
            return;
        }
        
        if (step === 2 && ijazahApplication.daysPerWeek < 7 && (localDetails.selectedDays?.length ?? 0) !== ijazahApplication.daysPerWeek) {
            alert(t('daysSelected').replace('{count}', String(localDetails.selectedDays?.length ?? 0)).replace('{total}', String(ijazahApplication.daysPerWeek)) + `. Please select exactly ${ijazahApplication.daysPerWeek} days.`);
            return;
        }

        const arabicToEnglishNumbers = (str: string): string => {
            if (!str) return '';
            const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
            let newStr = str;
            for (let i = 0; i < 10; i++) {
                newStr = newStr.replace(new RegExp(arabicNumerals[i], 'g'), String(i));
            }
            return newStr.replace(/[^0-9]/g, '');
        };

        let preferredTimeText = '';
        if (selectedTime) {
            Object.values(TIME_SLOTS).flat().find(slot => {
                if (slot.id === selectedTime) {
                    preferredTimeText = t(slot.key);
                    return true;
                }
                return false;
            });
        }

        const finalDetails = {
            ...localDetails,
            age: localDetails.age ? arabicToEnglishNumbers(localDetails.age) : undefined,
            preferredTime: preferredTimeText,
        };

        setIjazahApplication(prev => ({
            ...prev,
            fullDetails: finalDetails
        }));

        setStep(s => s + 1);
    };

    const handleBack = () => {
        setStep(s => s - 1);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!selectedTime) {
            alert("Please select a time slot.");
            return;
        }
        setIsSubmitting(true);
       
        try {
             const daysToBook = ijazahApplication.daysPerWeek === 7
                ? ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
                : localDetails.selectedDays || [];

            if (daysToBook.length === 0) {
                alert("Please select your preferred days before submitting.");
                setIsSubmitting(false);
                return;
            }

            const selectedSlot = Object.values(TIME_SLOTS).flat().find(s => s.id === selectedTime);
            if (!selectedSlot) {
                throw new Error("Selected time slot details could not be found.");
            }

            const newBookings = daysToBook.map(day => ({
                seat_number: selectedSlot.intId,
                is_booked: true,
                booked_day: day,
            }));

            if (!isTestModeEnabled()) {
                const { error } = await supabase.from('seats').insert(newBookings);
                if (error) throw error;
            }
            
            await sendIjazahApplicationToDiscord({ ...ijazahApplication, fullDetails: localDetails }, priceString, t);
            setLastSubmissionType('paid');
            navigateTo('thanks');

        } catch (error: any) {
            console.error('Error booking seat:', error.message || error);
            alert('This time slot was just booked by someone else on one of your selected days. Please select another time or change your days.');
            fetchAllBookings();
        } finally {
            setIsSubmitting(false);
        }
    };

    const price = IJAZAH_PRICES[ijazahApplication.path]?.[ijazahApplication.daysPerWeek] || 0;
    const priceString = `${price.toLocaleString()} IDR`;
    
    let timeEstimationText: string, showSpeedNote = false;
    if (ijazahApplication.path === 'The Ten Recitations') {
        timeEstimationText = t('tenRecitationsTime');
    } else {
        timeEstimationText = t(`hafsTime_${ijazahApplication.daysPerWeek}`);
        showSpeedNote = true;
    }
    
    const weekdays = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const selectedDays = localDetails.selectedDays || [];

    return (
        <div>
            <div className="text-center mb-6">
                <h2 className="text-3xl font-bold text-gray-100">{t('quizTitle')}</h2>
            </div>
            
            <form ref={formRef} onSubmit={handleSubmit} className="max-w-2xl mx-auto">
                <FormProgress currentStep={step} totalSteps={4} t={t} />
                <div className="relative">
                    {step === 1 && (
                        <div ref={stepRefs[1]}>
                            <Card title={t('cardTitlePersonalInfo')}>
                                <div>
                                    <label htmlFor="quiz-name" className="block text-sm font-medium text-gray-300">{t('quizNameLabel')}</label>
                                    <input type="text" id="quiz-name" name="name" value={localDetails.name || ''} onChange={handleDetailChange} required className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm text-gray-200" />
                                </div>
                                <div>
                                    <label htmlFor="quiz-age" className="block text-sm font-medium text-gray-300">{t('quizAgeLabel')}</label>
                                    <input type="text" inputMode="decimal" pattern="[0-9٠-٩]*" id="quiz-age" name="age" value={localDetails.age || ''} onChange={handleDetailChange} required className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm text-gray-200" />
                                </div>
                                <div>
                                    <label htmlFor="quiz-whatsapp" className="block text-sm font-medium text-gray-300">{t('whatsappLabel')}</label>
                                    <input type="tel" id="quiz-whatsapp" name="whatsapp" value={localDetails.whatsapp || ''} onChange={handleDetailChange} required className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm text-gray-200" />
                                </div>
                                <div>
                                    <label htmlFor="quiz-from" className="block text-sm font-medium text-gray-300">{t('quizFromLabel')}</label>
                                    <input type="text" id="quiz-from" name="from" value={localDetails.from || ''} onChange={handleDetailChange} required className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm text-gray-200" />
                                </div>
                            </Card>
                        </div>
                    )}
                    {step === 2 && (
                        <div ref={stepRefs[2]}>
                            <Card title={t('cardTitleSessionDetails')}>
                                {ijazahApplication.path === "Different Qira'ah" && (
                                    <div>
                                        <label htmlFor="quiz-qiraah" className="block text-sm font-medium text-gray-300">{t('quizQiraahLabel')}</label>
                                        <input type="text" id="quiz-qiraah" name="qiraah" value={localDetails.qiraah || ''} onChange={handleDetailChange} required className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm text-gray-200" />
                                    </div>
                                )}
                                 <div>
                                    <label className="block text-sm font-medium text-gray-300">{t('quizWeeklyLabel')}</label>
                                    <div className="mt-2 rounded-lg bg-gray-900 p-2"><div className="grid grid-cols-12 gap-2">{[1, 2, 3, 4, 5, 6, 7].map(day => (<div key={day} className={day <= 4 ? 'col-span-3' : 'col-span-4'}><input type="radio" id={`day-${day}`} name="daysPerWeek" value={day} checked={ijazahApplication.daysPerWeek === day} onChange={() => handleDaySelection(day)} className="sr-only peer" /><label htmlFor={`day-${day}`} className={`block text-center py-2 px-4 rounded-md cursor-pointer transition-colors duration-200 ease-in-out peer-checked:shadow text-gray-400 ${getDayButtonColors(day)}`}><span className="font-semibold">{day}</span></label></div>))}</div></div>
                                    <div className="text-center mt-2"><p className="text-sm text-gray-400">{`Price: ${priceString} / month`}</p><div className="mt-2 inline-block relative px-3 py-1.5"><div className="absolute inset-0 bg-gray-800 opacity-50 rounded-md"></div><div className="relative z-10 text-xs text-gray-300"><p><span className="font-semibold">{t('ijazahTimeEstimationTitle')}</span> {timeEstimationText}</p>{showSpeedNote && <p className="italic">{t('ijazahTimeNoteSpeed')}</p>}</div></div></div>
                                </div>
                                {ijazahApplication.daysPerWeek < 7 && (
                                    <div>
                                        <span className="block text-sm font-medium text-gray-300">{t('selectDaysOfWeek')}</span>
                                        <div className="mt-2 p-2 rounded-lg bg-gray-900">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                {weekdays.map(day => (
                                                    <DayButton
                                                        key={day}
                                                        day={day}
                                                        t={t}
                                                        isSelected={selectedDays.includes(day)}
                                                        onClick={handleDayToggle}
                                                    />
                                                ))}
                                            </div>
                                            <p className="text-center text-xs text-gray-400 mt-2">
                                                {t('daysSelected').replace('{count}', String(selectedDays.length)).replace('{total}', String(ijazahApplication.daysPerWeek))}
                                            </p>
                                        </div>
                                    </div>
                                )}
                                 <div>
                                    <span className="block text-sm font-medium text-gray-300">{t('quizTimeLabel')}</span>
                                    <div className="mt-2 rounded-lg bg-gray-900 p-3 space-y-3">
                                        {isLoadingSeats ? (<div className="space-y-3">{[...Array(3)].map((_, i) => (<div key={i} className="h-16 bg-gray-800 rounded-lg animate-pulse"></div>))}</div>) : (MAIN_TIME_BLOCKS.map(block => (<div key={block.id}><button type="button" onClick={() => setExpandedBlock(expandedBlock === block.id ? null : block.id)} className="w-full text-left p-4 rounded-lg bg-gray-700/50 hover:bg-gray-700 transition-all duration-200 ease-in-out shadow-sm flex justify-between items-center" aria-expanded={expandedBlock === block.id} aria-controls={`time-slots-${block.id}`}><div><h4 className="font-semibold text-gray-200">{t(block.key)}</h4><p className="text-xs text-gray-400">{t(block.timeRangeKey)}</p></div><svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-gray-400 transform transition-transform duration-300 ${expandedBlock === block.id ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg></button>{expandedBlock === block.id && (<div id={`time-slots-${block.id}`} className="mt-2 p-3 bg-gray-700/30 rounded-lg"><div className="flex flex-col gap-2">{block.slots.map(slot => { const isBooked = selectedDays.length > 0 && allBookings.some(booking => booking.seat_number === slot.intId && selectedDays.includes(booking.booked_day)); return (<div key={slot.id}><input type="radio" id={`time-${slot.id}`} name="time" value={slot.id} required disabled={isBooked} className="sr-only peer" onChange={() => setSelectedTime(slot.id)} checked={selectedTime === slot.id} /><label htmlFor={`time-${slot.id}`} className={`block text-center py-3 px-2 rounded-lg cursor-pointer transition-all duration-200 ease-in-out border-2 text-xs sm:text-sm font-semibold ${isBooked ? 'bg-gray-800 text-gray-600 cursor-not-allowed line-through border-transparent' : 'bg-gray-700 text-gray-300 border-transparent hover:border-amber-400 peer-checked:bg-amber-500 peer-checked:text-white peer-checked:border-amber-600 peer-checked:shadow-lg'}`}>{t(slot.key)}</label></div>); })}</div></div>)}</div>)))}
                                    </div>
                                    <p className="text-center mt-2 text-xs text-gray-400">{t('timezoneNote')}</p>
                                </div>
                                 <div>
                                    <span className="block text-sm font-medium text-gray-300">{t('quizLanguageLabel')}</span>
                                    <div className="mt-2 grid grid-cols-2 gap-1 rounded-lg bg-gray-900 p-1"><div className="col-span-1"><input type="radio" id="lang-ar" name="language" value="Arabic" className="sr-only peer" checked={localDetails.language === "Arabic" || !localDetails.language} onChange={handleDetailChange} /><label htmlFor="lang-ar" className="block w-full text-center py-2 px-2 rounded-md cursor-pointer transition-colors duration-200 ease-in-out text-gray-400 peer-checked:bg-gray-700 peer-checked:text-gray-100 peer-checked:shadow"><span className="font-semibold">{t('langArabic')}</span></label></div><div className="col-span-1"><input type="radio" id="lang-en" name="language" value="English" className="sr-only peer" checked={localDetails.language === "English"} onChange={handleDetailChange}/><label htmlFor="lang-en" className="block w-full text-center py-2 px-2 rounded-md cursor-pointer transition-colors duration-200 ease-in-out text-gray-400 peer-checked:bg-gray-700 peer-checked:text-gray-100 peer-checked:shadow"><span className="font-semibold">{t('langEnglish')}</span></label></div><div className="col-span-2"><input type="radio" id="lang-id" name="language" value="Indonesian" className="sr-only peer" checked={localDetails.language === "Indonesian"} onChange={handleDetailChange}/><label htmlFor="lang-id" className="block w-full text-center py-2 px-2 rounded-md cursor-pointer transition-colors duration-200 ease-in-out text-gray-400 peer-checked:bg-gray-700 peer-checked:text-gray-100 peer-checked:shadow"><span className="font-semibold">{t('langIndonesian')}</span></label></div></div>
                                </div>
                                <div>
                                    <span className="block text-sm font-medium text-gray-300">{t('quizSheikhLabel')}</span>
                                    <div className="mt-2 grid grid-cols-2 gap-2 rounded-lg bg-gray-900 p-1"><div><input type="radio" id="sheikh-yes" name="sheikh" value="yes" className="sr-only peer" checked={localDetails.sheikh === 'yes'} onChange={handleDetailChange}/><label htmlFor="sheikh-yes" className="block w-full text-center py-2 px-4 rounded-md cursor-pointer transition-colors duration-200 ease-in-out text-gray-400 peer-checked:bg-gray-700 peer-checked:text-gray-100 peer-checked:shadow"><span className="font-semibold">{t('yes')}</span></label></div><div><input type="radio" id="sheikh-no" name="sheikh" value="no" className="sr-only peer" checked={localDetails.sheikh !== 'yes'} onChange={handleDetailChange}/><label htmlFor="sheikh-no" className="block w-full text-center py-2 px-4 rounded-md cursor-pointer transition-colors duration-200 ease-in-out text-gray-400 peer-checked:bg-gray-700 peer-checked:text-gray-100 peer-checked:shadow"><span className="font-semibold">{t('no')}</span></label></div></div>
                                </div>
                            </Card>
                        </div>
                    )}
                    {step === 3 && (
                        <div ref={stepRefs[3]}>
                             <Card title={t('cardTitleJourney')}>
                                 <div>
                                    <label htmlFor="quiz-journey" className="block text-sm font-medium text-gray-300">{t('quizJourneyLabel')}</label>
                                    <textarea id="quiz-journey" name="journey" rows={6} value={localDetails.journey || ''} onChange={handleDetailChange} required className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm text-gray-200"></textarea>
                                </div>
                            </Card>
                        </div>
                    )}
                    {step === 4 && (
                        <div ref={stepRefs[4]}>
                            <Card title={t('cardTitleSummary')}>
                                <div className="bg-gray-700/50 p-4 rounded-lg text-left space-y-4">
                                    <div className="text-center pb-2 border-b border-gray-600">
                                        <h4 className="font-bold text-lg text-gray-100">{t('summaryTitle')}</h4>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div><p className="text-sm text-gray-400">{t('summaryPath')}</p><p className="font-semibold text-gray-200">{t(PATH_TRANSLATION_KEYS[ijazahApplication.path] || ijazahApplication.path)}</p></div>
                                        {ijazahApplication.memorization && (<div><p className="text-sm text-gray-400">{t('summaryMemorization')}</p><p className="font-semibold text-gray-200">{ijazahApplication.memorization === 'with' ? t('summaryWithMemorization') : t('summaryWithoutMemorization')}</p></div>)}
                                        {localDetails.qiraah && (<div><p className="text-sm text-gray-400">{t('summaryQiraah')}</p><p className="font-semibold text-gray-200">{localDetails.qiraah}</p></div>)}
                                        <div><p className="text-sm text-gray-400">{t('summaryCommitment')}</p><p className="font-semibold text-gray-200">{t('daysPerWeek').replace('{count}', String(ijazahApplication.daysPerWeek))}</p></div>
                                        <div><p className="text-sm text-gray-400">{t('summaryTime')}</p><p className="font-semibold text-gray-200">{localDetails.preferredTime}</p></div>
                                        <div><p className="text-sm text-gray-400">{t('summaryLanguage')}</p><p className="font-semibold text-gray-200">{localDetails.language}</p></div>
                                    </div>
                                    {selectedDays.length > 0 && (
                                         <div className="border-t border-gray-600 pt-4">
                                            <p className="text-sm text-gray-400">{t('summaryPreferredDays')}</p>
                                            <p className="font-semibold text-gray-200">{selectedDays.map(day => t(`day${day}`)).join(', ')}</p>
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
                </div>
                
                <div className="mt-8 flex gap-4">
                    {step > 1 && <button type="button" onClick={handleBack} className="w-full bg-gray-700 text-gray-200 font-bold py-3 px-6 rounded-lg shadow-sm hover:shadow-md hover:bg-gray-600 transition-all">{t('backButton')}</button>}
                    {step < 4 && <button type="button" onClick={handleNext} className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all">{t('nextButton')}</button>}
                    {step === 4 && <button type="submit" disabled={isSubmitting} className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-wait">{isSubmitting ? '...' : t('payButton')}</button>}
                </div>
            </form>
            
            <div className="mt-4 text-center">
                 <button onClick={() => navigateTo('ijazah')} className="w-full sm:w-1/2 mx-auto bg-gray-700 text-gray-200 font-semibold px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors">{t('changeIjazahButton')}</button>
            </div>
            <div className="mt-8 text-center">
                <button onClick={() => navigateTo('home')} className="text-sm font-semibold text-gray-400 hover:text-amber-400 transition-colors">{t('backToHome')}</button>
            </div>
        </div>
    );
};

export default QuizPage;