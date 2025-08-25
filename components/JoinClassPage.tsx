import React, { useState, useEffect } from 'react';
import { Page, AttendanceStatus, AttendanceRecord } from '../types';
import { supabase } from '../supabaseClient';
import { TIME_SLOTS, PATH_TRANSLATION_KEYS } from '../constants';
import { sendForgotPasscodeToDiscord, sendTeacherNotification } from '../discordService';

// Reusable day string to number converter
const dayStringToNumber = (day: string): number => {
    const map: { [key: string]: number } = {
        'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3,
        'Thursday': 4, 'Friday': 5, 'Saturday': 6
    };
    return map[day] ?? -1;
};

// --- AttendanceCalendar Component ---
interface AttendanceCalendarProps {
    studentName: string;
    scheduledDays: string[];
    isAdmin: boolean;
    t: (key: string) => string;
}

function getJakartaTime() {
    const now = new Date();
    const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
    return new Date(utcTime + (3600000 * 7));
}

export const AttendanceCalendar: React.FC<AttendanceCalendarProps> = ({ studentName, scheduledDays, isAdmin, t }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [attendance, setAttendance] = useState<Map<string, AttendanceStatus>>(new Map());
    const [loading, setLoading] = useState(true);

    const scheduledDayNumbers = scheduledDays.map(dayStringToNumber);

    const fetchAttendance = async () => {
        setLoading(true);
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1).toISOString().split('T')[0];
        const lastDay = new Date(year, month + 1, 0).toISOString().split('T')[0];

        const { data, error } = await supabase
            .from('attendance')
            .select('lesson_date, status')
            .eq('student_name', studentName)
            .gte('lesson_date', firstDay)
            .lte('lesson_date', lastDay);
        
        if (error) {
            console.error('Error fetching attendance:', error);
        } else if (data) {
            const newAttendance = new Map<string, AttendanceStatus>();
            data.forEach((record: any) => {
                newAttendance.set(record.lesson_date, record.status);
            });
            setAttendance(newAttendance);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchAttendance();
    }, [studentName, currentDate]);

    const handleStatusChange = async (date: Date, currentStatus: AttendanceStatus | undefined) => {
        if (!isAdmin) return;
        const lesson_date = date.toISOString().split('T')[0];

        if (currentStatus === 'attended') { // Cycle: attended -> missed
            const { error } = await supabase.from('attendance').upsert({ student_name: studentName, lesson_date, status: 'missed' }, { onConflict: 'student_name, lesson_date' });
            if (error) console.error(error);
        } else if (currentStatus === 'missed') { // Cycle: missed -> unmarked (delete)
            const { error } = await supabase.from('attendance').delete().match({ student_name: studentName, lesson_date });
            if (error) console.error(error);
        } else { // Cycle: unmarked -> attended
            const { error } = await supabase.from('attendance').upsert({ student_name: studentName, lesson_date, status: 'attended' }, { onConflict: 'student_name, lesson_date' });
            if (error) console.error(error);
        }
        fetchAttendance(); // Re-fetch to update UI
    };

    const renderCalendar = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const days = [];
        
        const todayJakarta = getJakartaTime();
        const todayDateOnly = new Date(todayJakarta.getFullYear(), todayJakarta.getMonth(), todayJakarta.getDate());

        for (let i = 0; i < firstDayOfMonth; i++) {
            days.push(<div key={`empty-${i}`} className="p-1"></div>);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dateString = date.toISOString().split('T')[0];
            const dayOfWeek = date.getDay();
            const isScheduled = scheduledDayNumbers.includes(dayOfWeek);
            const isToday = date.getFullYear() === todayJakarta.getFullYear() && date.getMonth() === todayJakarta.getMonth() && date.getDate() === day;
            const isPast = date.getTime() < todayDateOnly.getTime();

            const status = attendance.get(dateString);
            
            let cellClass = 'bg-gray-700/50';
            let textColor = 'text-gray-400';
            
            if (isScheduled) {
                if (status === 'attended') { cellClass = 'bg-green-600/70'; textColor = 'text-white'; }
                else if (status === 'missed') { cellClass = 'bg-red-600/70'; textColor = 'text-white'; }
                else if (isPast) { cellClass = 'bg-gray-500/70'; textColor = 'text-gray-200'; } // Past, unmarked
                else { cellClass = 'bg-gray-600/70'; textColor = 'text-gray-200'; } // Future or today, scheduled
            }

            if (isToday) {
                cellClass += ' ring-2 ring-amber-400';
            }

            const dayContent = (
                <div className={`h-10 w-full flex items-center justify-center text-sm font-semibold rounded-md transition-transform duration-200 ${isAdmin && isScheduled ? 'cursor-pointer hover:scale-110' : ''} ${cellClass} ${textColor}`}>
                    {day}
                </div>
            );

            days.push(
                <div key={day} className="relative p-1" onClick={() => handleStatusChange(date, status)}>
                    {dayContent}
                </div>
            );
        }

        return days;
    };
    
    return (
        <div className="bg-gray-900/70 p-4 rounded-lg">
            <h3 className="text-xl font-bold text-gray-100 mb-4 text-center">{t('attendanceTitle')}</h3>
            <div className="flex items-center justify-between mb-4">
                <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))} className="p-2 rounded-full hover:bg-gray-700">&lt;</button>
                <span className="font-semibold text-lg">{currentDate.toLocaleString(undefined, { month: 'long', year: 'numeric' })}</span>
                <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))} className="p-2 rounded-full hover:bg-gray-700">&gt;</button>
            </div>
            {loading ? <p>Loading...</p> : (
                <>
                    <div className="grid grid-cols-7 text-center text-xs text-gray-400 mb-2">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d}>{d}</div>)}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                        {renderCalendar()}
                    </div>
                </>
            )}
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-4 text-xs">
                <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-green-600/70"></div>{t('attendanceStatusAttended')}</span>
                <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-red-600/70"></div>{t('attendanceStatusMissed')}</span>
                <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-gray-600/70"></div>Scheduled</span>
                <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-gray-500/70"></div>Unmarked</span>
            </div>
        </div>
    );
};


// --- Main Component Logic ---
interface ClassDetails {
    id: string;
    name: string;
    path: string;
    start_time_id: string;
    selected_days: string[];
    paid_state: string | null;
    next_paid: string | null;
    date_approved: string | null;
    isApproved: boolean;
}

const ClassDetailsView: React.FC<{ classDetails: ClassDetails; t: (key: string) => string; navigateTo: (page: Page) => void; onOpenChat: (name: string) => void; unreadCount: number; }> = ({ classDetails, t, navigateTo, onOpenChat, unreadCount }) => {
    const [countdown, setCountdown] = useState<string>('');
    const [expirationCountdown, setExpirationCountdown] = useState<string>('');
    const [currentMeetingUrl, setCurrentMeetingUrl] = useState<string>('#');
    const [showNotifyButton, setShowNotifyButton] = useState<boolean>(false);
    const [notificationStatus, setNotificationStatus] = useState<'ready' | 'notifying' | 'notified'>('ready');
    const [showCalendar, setShowCalendar] = useState(false);
    
    useEffect(() => {
        const fetchMeetingLink = async () => {
            if (!classDetails.isApproved) return;
            const { data, error } = await supabase.from('links').select('zoom_link').eq('name', classDetails.name).limit(1).single();
            if (error) console.error("Failed to fetch meeting link:", error);
            else if (data && data.zoom_link) setCurrentMeetingUrl(data.zoom_link);
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
                    if (potentialSession.getTime() + (16 * 60 * 1000) < nowJakarta.getTime()) continue;
                    return potentialSession;
                }
            }
            return null;
        };

        const interval = setInterval(() => {
            const nextSessionDate = calculateNextSession();
            if (nextSessionDate) {
                const now = getJakartaTime();
                const diff = nextSessionDate.getTime() - now.getTime();
                if (diff > 0) setShowNotifyButton(true); else setShowNotifyButton(false);
                const sessionStartTime = nextSessionDate.getTime();
                const sessionWindowEnd = sessionStartTime + 16 * 60 * 1000;
                const sessionJoinTime = sessionStartTime - 5 * 60 * 1000;
                if (now.getTime() >= sessionJoinTime && now.getTime() < sessionWindowEnd) {
                    const remaining = sessionWindowEnd - now.getTime();
                    const minutes = Math.floor(remaining / (1000 * 60));
                    setCountdown(`${t('joinClassStartsNow')} (${minutes}m)`);
                } else if (diff > 0) {
                    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                    setCountdown(`${days}d ${hours}h ${minutes}m`);
                } else setCountdown(t('joinClassNoUpcoming'));
            } else setCountdown(t('joinClassNoUpcoming'));
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
                setExpirationCountdown(`${days}d ${hours}h ${minutes}m`);
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
            await sendTeacherNotification({ name: classDetails.name, program: programName, time: scheduledTime });
            setNotificationStatus('notified');
        } catch (error) {
            console.error("Failed to send notification:", error);
            setNotificationStatus('ready');
        }
    };
    
    const notifyButtonText = notificationStatus === 'notifying' ? t('notifyTeacherButtonNotifying') : notificationStatus === 'notified' ? t('notifyTeacherButtonNotified') : t('notifyTeacherButtonReady');

    return (
        <div className="page-transition">
            <h2 className="text-3xl font-bold text-gray-100">{t('joinClassWelcomeTitle').replace('{name}', classDetails.name)}</h2>
            <div className="mt-8 max-w-md mx-auto bg-gray-800/50 border border-amber-500/30 p-6 rounded-2xl shadow-lg">
                <h3 className="text-xl font-bold text-gray-100 mb-6 border-b border-gray-700 pb-3">{t('joinClassDetailsTitle')}</h3>
                <div className="space-y-4 text-left">
                    <div><p className="text-sm text-gray-400">{t('joinClassSelectedIjazah')}</p><p className="font-semibold text-gray-200 text-lg">{programName}</p></div>
                    <div><p className="text-sm text-gray-400">{t('joinClassSelectedTime')}</p><p className="font-semibold text-gray-200 text-lg">{scheduledTime}</p></div>
                    {classDetails.selected_days && <div><p className="text-sm text-gray-400">{t('summaryPreferredDays')}</p><p className="font-semibold text-gray-200 text-lg">{classDetails.selected_days.map(day => t(`day${day}`)).join(' - ')}</p></div>}
                    {classDetails.isApproved && <div><p className="text-sm text-gray-400">{t('joinClassNextSession')}</p><p className="font-mono text-amber-400 text-2xl tracking-wider">{countdown}</p></div>}
                    {classDetails.isApproved && (<div className="border-t border-gray-700 pt-4"><p className="text-sm text-gray-400">{t('joinClassPaymentStatus')}</p>{classDetails.paid_state === 'PAID' ? (<><div className="text-lg font-bold p-2 rounded-md text-center bg-green-500/20 text-green-300">{t('statusPaid')}</div>{classDetails.next_paid && (<p className="text-center text-sm text-red-400 mt-2">{t('nextPaymentDue').replace('{date}', new Date(classDetails.next_paid).toLocaleDateString())}</p>)}</>) : (<><div className="text-lg font-bold p-2 rounded-md text-center bg-red-500/20 text-red-300">{t('statusUnpaid')}</div>{expirationCountdown && (<p className="text-center text-sm text-yellow-300 mt-2">{t('cardExpirationInfo').replace('{time}', expirationCountdown)}</p>)}</>)}</div>)}
                </div>
            </div>
            
            {classDetails.isApproved ? (
                <div className="mt-6 max-w-md mx-auto space-y-4">
                     <button onClick={() => setShowCalendar(p => !p)} className="w-full bg-gray-700/80 border border-gray-600 hover:border-amber-500 text-amber-300 font-bold py-2 px-4 rounded-lg transition-all duration-300">
                        {showCalendar ? 'Hide Lessons' : t('viewLessonsButton')}
                    </button>
                    {showCalendar && <AttendanceCalendar studentName={classDetails.name} scheduledDays={classDetails.selected_days} isAdmin={false} t={t} />}
                    <div className="flex items-stretch justify-center gap-4">
                        {showNotifyButton && (<button onClick={handleNotifyTeacher} disabled={notificationStatus !== 'ready'} className="flex-grow bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-60 disabled:cursor-wait">{notifyButtonText}</button>)}
                        <div className="relative flex-shrink-0"><button onClick={() => onOpenChat(classDetails.name)} className="h-full bg-gray-700/80 text-gray-200 p-3 rounded-lg hover:bg-gray-600 transition-colors" aria-label="Open Live Chat"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg></button>{unreadCount > 0 && (<span className="absolute top-[-4px] right-[-4px] w-5 h-5 bg-red-500 rounded-full text-white text-[10px] flex items-center justify-center font-bold border-2 border-gray-800">{unreadCount}</span>)}</div>
                    </div>
                    <a href={currentMeetingUrl} target="_blank" rel="noopener noreferrer" className={`inline-block w-full text-center bg-gradient-to-r from-blue-500 to-sky-500 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300 ${currentMeetingUrl === '#' ? 'opacity-50 cursor-not-allowed' : ''}`} onClick={(e) => { if (currentMeetingUrl === '#') e.preventDefault(); }}>{t('joinClassJoinButton')}</a>
                </div>
            ) : (
                <div className="mt-6 text-center bg-gray-700 p-4 rounded-lg max-w-md mx-auto"><p className="font-semibold text-yellow-300">{t('pendingApproval')}</p></div>
            )}

            <div className="mt-12 text-center"><button onClick={() => navigateTo('home')} className="text-sm font-semibold text-gray-400 hover:text-amber-400 transition-colors">{t('backToHome')}</button></div>
        </div>
    );
};

interface JoinClassPageProps {
    navigateTo: (page: Page) => void;
    t: (key: string) => string;
    onOpenChat: (name: string) => void;
    unreadCount: number;
}

const JoinClassPage: React.FC<JoinClassPageProps> = ({ navigateTo, t, onOpenChat, unreadCount }) => {
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
            const { data, error: queryError } = await supabase.from('passcodes').select('id, name, path, start_time_id, selected_days, paid_state, next_paid, date_approved').eq('name', name.trim()).eq('code', passcode.trim()).limit(1).single();
            if (queryError) {
                 if (queryError.code === 'PGRST116') { setError(t('joinClassInvalidCredentials')); setName(''); setPasscode(''); return; }
                throw queryError;
            }
            if (data) setClassDetails({ ...data, isApproved: !!data.date_approved, selected_days: typeof data.selected_days === 'string' ? data.selected_days.split(',').map((d: string) => d.trim()) : (data.selected_days || []) });
            else { setError(t('joinClassInvalidCredentials')); setName(''); setPasscode(''); }
        } catch (err: any) {
            console.error("Error during class join authentication:", JSON.stringify(err, null, 2));
            setError("An unexpected error occurred. Please try again.");
        } finally { setIsLoading(false); }
    };
    
    const handleForgotPasscodeSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!forgotPasscodeName.trim() || !forgotPasscodeWhatsapp.trim()) return;
        try {
            await sendForgotPasscodeToDiscord({ name: forgotPasscodeName, whatsapp: forgotPasscodeWhatsapp });
            setForgotPasscodeSuccess(true);
            setShowForgotPasscodeForm(false);
        } catch (err) { console.error("Failed to send forgot passcode request", err); }
    };

    if (classDetails) {
        return <ClassDetailsView classDetails={classDetails} t={t} navigateTo={navigateTo} onOpenChat={onOpenChat} unreadCount={unreadCount} />;
    }

    return (
        <div className="page-transition">
            <div className="text-center mb-8"><h2 className="text-3xl font-bold text-gray-100">{t('joinClassPageTitle')}</h2></div>
            {!showForgotPasscodeForm && !forgotPasscodeSuccess && (<form onSubmit={handleJoinSubmit} className="max-w-sm mx-auto"><div className="space-y-4"><div><label htmlFor="name" className="block text-sm font-medium text-gray-300 sr-only">{t('joinClassNameLabel')}</label><input type="text" id="name" name="name" value={name} onChange={(e) => setName(e.target.value)} placeholder={t('joinClassNameLabel')} required autoFocus className="mt-1 block w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-amber-500 focus:border-amber-500 text-gray-200 text-center text-lg"/></div><div><label htmlFor="passcode" className="block text-sm font-medium text-gray-300 sr-only">{t('joinClassPasscodeLabel')}</label><input type="password" id="passcode" name="passcode" value={passcode} onChange={(e) => setPasscode(e.target.value)} placeholder={t('joinClassPasscodeLabel')} required className="mt-1 block w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-amber-500 focus:border-amber-500 text-gray-200 text-center text-lg tracking-widest"/></div>{error && (<div className="text-center pt-2"><p className="text-red-400 text-sm">{error}</p><button type="button" onClick={() => { setShowForgotPasscodeForm(true); setError(null); }} className="mt-2 text-sm font-semibold text-amber-400 hover:text-amber-300 underline">{t('forgotPasscodeLink')}</button></div>)}</div><div className="mt-6"><button type="submit" disabled={isLoading} className="w-full flex justify-center items-center bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300 ease-in-out disabled:opacity-60 disabled:cursor-wait">{isLoading ? (<svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>) : (t('joinClassSubmitButton'))}</button></div></form>)}
            {showForgotPasscodeForm && (<div className="max-w-sm mx-auto page-transition"><h3 className="text-xl font-bold text-center text-gray-100 mb-4">{t('forgotPasscodeTitle')}</h3><form onSubmit={handleForgotPasscodeSubmit}><div className="space-y-4"><div><label htmlFor="forgot-name" className="sr-only">{t('forgotPasscodeNameLabel')}</label><input type="text" id="forgot-name" value={forgotPasscodeName} onChange={(e) => setForgotPasscodeName(e.target.value)} placeholder={t('forgotPasscodeNameLabel')} required className="mt-1 block w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-amber-500 focus:border-amber-500 text-gray-200 text-center"/></div><div><label htmlFor="forgot-whatsapp" className="sr-only">{t('forgotPasscodeWhatsappLabel')}</label><input type="tel" id="forgot-whatsapp" value={forgotPasscodeWhatsapp} onChange={(e) => setForgotPasscodeWhatsapp(e.target.value)} placeholder={t('forgotPasscodeWhatsappLabel')} required className="mt-1 block w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-amber-500 focus:border-amber-500 text-gray-200 text-center"/></div></div><div className="mt-6"><button type="submit" className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold py-3 px-6 rounded-lg">{t('forgotPasscodeSendButton')}</button></div></form></div>)}
            {forgotPasscodeSuccess && (<div className="max-w-sm mx-auto text-center page-transition bg-green-900/50 border border-green-500/30 p-6 rounded-lg"><p className="text-green-300 font-semibold">{t('forgotPasscodeSuccessMessage')}</p></div>)}
            <div className="mt-12 text-center"><button onClick={() => navigateTo('home')} className="text-sm font-semibold text-gray-400 hover:text-amber-400 transition-colors">{t('backToHome')}</button></div>
        </div>
    );
};

export default JoinClassPage;