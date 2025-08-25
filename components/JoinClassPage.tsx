import React, { useState, useEffect } from 'react';
import { Page } from '../types';
import { supabase } from '../supabaseClient';
import { TIME_SLOTS, PATH_TRANSLATION_KEYS } from '../constants';
import { sendForgotPasscodeToDiscord, sendTeacherNotification } from '../discordService';

interface ClassDetails {
    id: string; // passcode_id (uuid)
    name: string;
    path: string;
    start_time_id: string;
    selected_days: string[];
    paid_state: string | null;
    next_paid: string | null;
    date_approved: string | null;
    isApproved: boolean;
}

// Helper to get current time in Jakarta (GMT+7)
function getJakartaTime() {
    const now = new Date();
    const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
    return new Date(utcTime + (3600000 * 7));
}

const dayStringToNumber = (day: string): number => {
    const map: { [key: string]: number } = {
        'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3,
        'Thursday': 4, 'Friday': 5, 'Saturday': 6
    };
    return map[day] ?? -1;
};

const ClassDetailsView: React.FC<{ classDetails: ClassDetails; t: (key: string) => string; navigateTo: (page: Page) => void; }> = ({ classDetails, t, navigateTo }) => {
    const [countdown, setCountdown] = useState<string>('');
    const [expirationCountdown, setExpirationCountdown] = useState<string>('');
    const [currentMeetingUrl, setCurrentMeetingUrl] = useState<string>('#');
    const [showNotifyButton, setShowNotifyButton] = useState<boolean>(false);
    const [notificationStatus, setNotificationStatus] = useState<'ready' | 'notifying' | 'notified'>('ready');
    
    useEffect(() => {
        const fetchMeetingLink = async () => {
            if (!classDetails.isApproved) return;
            const { data, error } = await supabase
                .from('links')
                .select('zoom_link')
                .eq('name', classDetails.name)
                .limit(1)
                .single();
            
            if (error) {
                console.error("Failed to fetch meeting link:", error);
            } else if (data && data.zoom_link) {
                setCurrentMeetingUrl(data.zoom_link);
            }
        };
        fetchMeetingLink();
    }, [classDetails.name, classDetails.isApproved]);


    useEffect(() => {
        const calculateNextSession = () => {
            const { start_time_id, selected_days } = classDetails;
            if (!start_time_id || !selected_days || selected_days.length === 0) return null;
            
            const timePart = start_time_id.split('_')[1];
            if (!timePart || timePart.length < 4) return null;
            
            const [startHour, startMinute] = [parseInt(timePart.substring(0, 2)), parseInt(timePart.substring(2, 4))];
            const scheduledDays = selected_days.map(day => dayStringToNumber(day.trim())).filter(d => d !== -1);
            if (scheduledDays.length === 0) return null;
            
            const nowJakarta = getJakartaTime();
            
            for (let i = 0; i < 7; i++) {
                const checkDate = new Date(nowJakarta);
                checkDate.setDate(nowJakarta.getDate() + i);
                
                if (scheduledDays.includes(checkDate.getDay())) {
                    const potentialSession = new Date(checkDate);
                    potentialSession.setHours(startHour, startMinute, 0, 0);

                    if (potentialSession.getTime() + (16 * 60 * 1000) < nowJakarta.getTime()) {
                        continue;
                    }
                    
                    return potentialSession;
                }
            }
            return null; // No upcoming session found
        };

        const interval = setInterval(() => {
            const nextSessionDate = calculateNextSession();
            
            if (nextSessionDate) {
                const now = getJakartaTime();
                const diff = nextSessionDate.getTime() - now.getTime();

                if (diff > 0 && diff <= 10 * 60 * 1000) {
                    setShowNotifyButton(true);
                } else {
                    setShowNotifyButton(false);
                }
                
                const sessionStartTime = nextSessionDate.getTime();
                const sessionWindowEnd = sessionStartTime + 16 * 60 * 1000;
                const sessionJoinTime = sessionStartTime - 5 * 60 * 1000;

                if (now.getTime() >= sessionJoinTime && now.getTime() < sessionWindowEnd) {
                    const remaining = sessionWindowEnd - now.getTime();
                    const minutes = Math.floor(remaining / (1000 * 60));
                    const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
                    setCountdown(`${t('joinClassStartsNow')} (${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')})`);
                
                } else if (diff > 0) {
                    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
                    setCountdown(`${days}d ${hours}h ${minutes}m ${seconds}s`);
                
                } else {
                     setCountdown(t('joinClassNoUpcoming'));
                }
            } else {
                setCountdown(t('joinClassNoUpcoming'));
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [classDetails, t]);

    useEffect(() => {
        if (classDetails.isApproved && classDetails.paid_state === 'unpaid' && classDetails.date_approved) {
            const approvalDate = new Date(classDetails.date_approved);
            const expirationDate = new Date(approvalDate);
            expirationDate.setMonth(expirationDate.getMonth() + 1);

            const interval = setInterval(() => {
                const now = new Date();
                const diff = expirationDate.getTime() - now.getTime();

                if (diff <= 0) {
                    setExpirationCountdown(t('cardExpired'));
                    clearInterval(interval);
                    return;
                }

                const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((diff % (1000 * 60)) / 1000);

                setExpirationCountdown(`${days}d ${hours}h ${minutes}m ${seconds}s`);
            }, 1000);

            return () => clearInterval(interval);
        }
    }, [classDetails.isApproved, classDetails.paid_state, classDetails.date_approved, t]);
    
    const timeSlotKey = classDetails.start_time_id ? Object.values(TIME_SLOTS).flat().find(s => s.id === classDetails.start_time_id)?.key : null;
    const scheduledTime = timeSlotKey ? t(timeSlotKey) : classDetails.start_time_id;
    const programName = PATH_TRANSLATION_KEYS[classDetails.path] ? t(PATH_TRANSLATION_KEYS[classDetails.path]) : classDetails.path;

    const handleNotifyTeacher = async () => {
        if (notificationStatus !== 'ready') return;
        setNotificationStatus('notifying');
        try {
            await sendTeacherNotification({
                name: classDetails.name,
                program: programName,
                time: scheduledTime
            });
            setNotificationStatus('notified');
        } catch (error) {
            console.error("Failed to send notification:", error);
            setNotificationStatus('ready'); // Reset on error
        }
    };
    
    let notifyButtonText = t('notifyTeacherButtonReady');
    if (notificationStatus === 'notifying') {
        notifyButtonText = t('notifyTeacherButtonNotifying');
    } else if (notificationStatus === 'notified') {
        notifyButtonText = t('notifyTeacherButtonNotified');
    }

    return (
        <div className="page-transition">
            <h2 className="text-3xl font-bold text-gray-100">{t('joinClassWelcomeTitle').replace('{name}', classDetails.name)}</h2>
            <div className="mt-8 max-w-md mx-auto bg-gray-800/50 border border-amber-500/30 p-6 rounded-2xl shadow-lg">
                <h3 className="text-xl font-bold text-gray-100 mb-6 border-b border-gray-700 pb-3">{t('joinClassDetailsTitle')}</h3>
                <div className="space-y-4 text-left">
                    <div>
                        <p className="text-sm text-gray-400">{t('joinClassSelectedIjazah')}</p>
                        <p className="font-semibold text-gray-200 text-lg">{programName}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-400">{t('joinClassSelectedTime')}</p>
                        <p className="font-semibold text-gray-200 text-lg">{scheduledTime}</p>
                    </div>
                    {classDetails.selected_days && (
                         <div>
                            <p className="text-sm text-gray-400">{t('summaryPreferredDays')}</p>
                            <p className="font-semibold text-gray-200 text-lg">
                                {classDetails.selected_days.map(day => t(`day${day}`)).join(' - ')}
                            </p>
                        </div>
                    )}
                    {classDetails.isApproved && (
                        <div>
                            <p className="text-sm text-gray-400">{t('joinClassNextSession')}</p>
                            <p className="font-mono text-amber-400 text-2xl tracking-wider">{countdown}</p>
                        </div>
                    )}
                     {classDetails.isApproved && (
                        <div className="border-t border-gray-700 pt-4">
                            <p className="text-sm text-gray-400">{t('joinClassPaymentStatus')}</p>
                            {classDetails.paid_state === 'PAID' ? (
                                <>
                                    <div className="text-lg font-bold p-2 rounded-md text-center bg-green-500/20 text-green-300">
                                        {t('statusPaid')}
                                    </div>
                                    {classDetails.next_paid && (
                                        <p className="text-center text-sm text-red-400 mt-2">
                                            {t('nextPaymentDue').replace('{date}', new Date(classDetails.next_paid).toLocaleDateString())}
                                        </p>
                                    )}
                                </>
                            ) : (
                                <>
                                    <div className="text-lg font-bold p-2 rounded-md text-center bg-red-500/20 text-red-300">
                                        {t('statusUnpaid')}
                                    </div>
                                    {expirationCountdown && (
                                        <p className="text-center text-sm text-yellow-300 mt-2">
                                            {t('cardExpirationInfo').replace('{time}', expirationCountdown)}
                                        </p>
                                    )}
                                    <button
                                        className="mt-4 w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300"
                                    >
                                        {t('payNowButton')}
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {classDetails.isApproved ? (
                    <>
                        {showNotifyButton && (
                            <button
                                onClick={handleNotifyTeacher}
                                disabled={notificationStatus !== 'ready'}
                                className="mt-6 inline-block w-full bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-60 disabled:cursor-wait"
                            >
                                {notifyButtonText}
                            </button>
                        )}
                        <a
                            href={currentMeetingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`inline-block w-full bg-gradient-to-r from-blue-500 to-sky-500 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300 ${currentMeetingUrl === '#' ? 'opacity-50 cursor-not-allowed' : ''} ${showNotifyButton ? 'mt-4' : 'mt-6'}`}
                            onClick={(e) => { if (currentMeetingUrl === '#') e.preventDefault(); }}
                        >
                            {t('joinClassJoinButton')}
                        </a>
                    </>
                ) : (
                    <div className="mt-6 text-center bg-gray-700 p-4 rounded-lg">
                        <p className="font-semibold text-yellow-300">{t('pendingApproval')}</p>
                    </div>
                )}
            </div>
            <div className="mt-12 text-center">
                <button onClick={() => navigateTo('home')} className="text-sm font-semibold text-gray-400 hover:text-amber-400 transition-colors">{t('backToHome')}</button>
            </div>
        </div>
    );
};

interface JoinClassPageProps {
    navigateTo: (page: Page) => void;
    t: (key: string) => string;
}

const JoinClassPage: React.FC<JoinClassPageProps> = ({ navigateTo, t }) => {
    const [name, setName] = useState('');
    const [passcode, setPasscode] = useState('');
    const [classDetails, setClassDetails] = useState<ClassDetails | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showForgotPasscodeForm, setShowForgotPasscodeForm] = useState(false);
    const [forgotPasscodeSuccess, setForgotPasscodeSuccess] = useState(false);
    const [forgotPasscodeName, setForgotPasscodeName] = useState('');
    const [forgotPasscodeWhatsapp, setForgotPasscodeWhatsapp] = useState('');

    const handleJoinSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!name.trim() || !passcode.trim() || isLoading) return;

        setIsLoading(true);
        setError(null);

        try {
            const { data, error: queryError } = await supabase
                .from('passcodes')
                .select('id, name, path, start_time_id, selected_days, paid_state, next_paid, date_approved')
                .eq('name', name.trim())
                .eq('code', passcode.trim())
                .limit(1)
                .single();

            if (queryError) {
                 if (queryError.code === 'PGRST116') { // "Not a single row was found"
                    setError(t('joinClassInvalidCredentials'));
                    setName('');
                    setPasscode('');
                    return;
                }
                throw queryError;
            }

            if (data) {
                setClassDetails({
                    ...data,
                    isApproved: !!data.date_approved,
                    selected_days: typeof data.selected_days === 'string' 
                        ? data.selected_days.split(',').map((d: string) => d.trim()) 
                        : (data.selected_days || []),
                });
            } else {
                 setError(t('joinClassInvalidCredentials'));
                 setName('');
                 setPasscode('');
            }
        } catch (err: any) {
            console.error("Error during class join authentication:", JSON.stringify(err, null, 2));
            setError("An unexpected error occurred. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleForgotPasscodeSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!forgotPasscodeName.trim() || !forgotPasscodeWhatsapp.trim()) return;

        try {
            await sendForgotPasscodeToDiscord({ 
                name: forgotPasscodeName, 
                whatsapp: forgotPasscodeWhatsapp 
            });
            setForgotPasscodeSuccess(true);
            setShowForgotPasscodeForm(false);
        } catch (err) {
            console.error("Failed to send forgot passcode request", err);
        }
    };


    if (classDetails) {
        return <ClassDetailsView classDetails={classDetails} t={t} navigateTo={navigateTo} />;
    }

    return (
        <div className="page-transition">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-100">{t('joinClassPageTitle')}</h2>
            </div>
            
            {!showForgotPasscodeForm && !forgotPasscodeSuccess && (
                 <form onSubmit={handleJoinSubmit} className="max-w-sm mx-auto">
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-300 sr-only">{t('joinClassNameLabel')}</label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder={t('joinClassNameLabel')}
                                required
                                autoFocus
                                className="mt-1 block w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-amber-500 focus:border-amber-500 text-gray-200 text-center text-lg"
                            />
                        </div>
                        <div>
                            <label htmlFor="passcode" className="block text-sm font-medium text-gray-300 sr-only">{t('joinClassPasscodeLabel')}</label>
                            <input
                                type="password"
                                id="passcode"
                                name="passcode"
                                value={passcode}
                                onChange={(e) => setPasscode(e.target.value)}
                                placeholder={t('joinClassPasscodeLabel')}
                                required
                                className="mt-1 block w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-amber-500 focus:border-amber-500 text-gray-200 text-center text-lg tracking-widest"
                            />
                        </div>
                         {error && (
                             <div className="text-center pt-2">
                                <p className="text-red-400 text-sm">{error}</p>
                                <button 
                                    type="button" 
                                    onClick={() => {
                                        setShowForgotPasscodeForm(true);
                                        setError(null);
                                    }} 
                                    className="mt-2 text-sm font-semibold text-amber-400 hover:text-amber-300 underline"
                                >
                                    {t('forgotPasscodeLink')}
                                </button>
                            </div>
                        )}
                    </div>
                    <div className="mt-6">
                        <button 
                            type="submit" 
                            disabled={isLoading}
                            className="w-full flex justify-center items-center bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300 ease-in-out disabled:opacity-60 disabled:cursor-wait"
                        >
                            {isLoading ? (
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : (
                                t('joinClassSubmitButton')
                            )}
                        </button>
                    </div>
                </form>
            )}

            {showForgotPasscodeForm && (
                <div className="max-w-sm mx-auto page-transition">
                    <h3 className="text-xl font-bold text-center text-gray-100 mb-4">{t('forgotPasscodeTitle')}</h3>
                    <form onSubmit={handleForgotPasscodeSubmit}>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="forgot-name" className="sr-only">{t('forgotPasscodeNameLabel')}</label>
                                <input
                                    type="text"
                                    id="forgot-name"
                                    value={forgotPasscodeName}
                                    onChange={(e) => setForgotPasscodeName(e.target.value)}
                                    placeholder={t('forgotPasscodeNameLabel')}
                                    required
                                    className="mt-1 block w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-amber-500 focus:border-amber-500 text-gray-200 text-center"
                                />
                            </div>
                            <div>
                                <label htmlFor="forgot-whatsapp" className="sr-only">{t('forgotPasscodeWhatsappLabel')}</label>
                                <input
                                    type="tel"
                                    id="forgot-whatsapp"
                                    value={forgotPasscodeWhatsapp}
                                    onChange={(e) => setForgotPasscodeWhatsapp(e.target.value)}
                                    placeholder={t('forgotPasscodeWhatsappLabel')}
                                    required
                                    className="mt-1 block w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-amber-500 focus:border-amber-500 text-gray-200 text-center"
                                />
                            </div>
                        </div>
                        <div className="mt-6">
                            <button type="submit" className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold py-3 px-6 rounded-lg">
                                {t('forgotPasscodeSendButton')}
                            </button>
                        </div>
                    </form>
                </div>
            )}
            
            {forgotPasscodeSuccess && (
                <div className="max-w-sm mx-auto text-center page-transition bg-green-900/50 border border-green-500/30 p-6 rounded-lg">
                    <p className="text-green-300 font-semibold">{t('forgotPasscodeSuccessMessage')}</p>
                </div>
            )}

             <div className="mt-12 text-center">
                <button onClick={() => navigateTo('home')} className="text-sm font-semibold text-gray-400 hover:text-amber-400 transition-colors">{t('backToHome')}</button>
            </div>
        </div>
    );
};

export default JoinClassPage;