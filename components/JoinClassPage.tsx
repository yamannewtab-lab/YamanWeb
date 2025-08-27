import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Page } from '../types';
import { supabase } from '../supabaseClient';
import { TIME_SLOTS, PATH_TRANSLATION_KEYS } from '../constants';
import { sendForgotPasscodeToDiscord, sendTeacherNotification, sendTeacherAbsentNotification, sendHomeworkToDiscord } from '../discordService';
import AttendanceCalendar from './AttendanceCalendar';
import { subscribeUser, unsubscribeUser, getSubscription } from '../pushService';

// --- Sub-Components ---

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

const HomeworkView: React.FC<{ studentName: string; t: (key: string) => string; onBack: () => void; }> = ({ studentName, t, onBack }) => {
    const [text, setText] = useState('');
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [recordingStatus, setRecordingStatus] = useState<'idle' | 'recording' | 'paused' | 'finished'>('idle');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [files, setFiles] = useState<File[]>([]);
    const [isDragging, setIsDragging] = useState(false);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            audioChunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (event) => {
                audioChunksRef.current.push(event.data);
            };

            mediaRecorderRef.current.onstop = () => {
                const blob = new Blob(audioChunksRef.current, { type: 'audio/webm;codecs=opus' });
                setAudioBlob(blob);
                setAudioUrl(URL.createObjectURL(blob));
                setRecordingStatus('finished');
                stream.getTracks().forEach(track => track.stop()); // Stop microphone access
            };

            mediaRecorderRef.current.start();
            setRecordingStatus('recording');
        } catch (err) {
            console.error("Error accessing microphone:", err);
            alert("Could not access microphone. Please ensure permission is granted.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && (recordingStatus === 'recording' || recordingStatus === 'paused')) {
            mediaRecorderRef.current.stop();
        }
    };
    
    const pauseRecording = () => {
        if (mediaRecorderRef.current && recordingStatus === 'recording') {
            mediaRecorderRef.current.pause();
            setRecordingStatus('paused');
        }
    };

    const resumeRecording = () => {
        if (mediaRecorderRef.current && recordingStatus === 'paused') {
            mediaRecorderRef.current.resume();
            setRecordingStatus('recording');
        }
    };
    
    const handleAudioReset = () => {
        setAudioBlob(null);
        if(audioUrl) URL.revokeObjectURL(audioUrl);
        setAudioUrl(null);
        setRecordingStatus('idle');
        audioChunksRef.current = [];
    };

    const handleSubmit = async () => {
        if (!text.trim() && !audioBlob && files.length === 0) {
            alert("Please provide either text, an audio recording, or a file for your homework.");
            return;
        }
        setIsSubmitting(true);
        setSubmitStatus('idle');
        try {
            await sendHomeworkToDiscord({ studentName, text, audioBlob, files });
            setSubmitStatus('success');
            setTimeout(() => {
                onBack();
            }, 2000);
        } catch (error) {
            console.error("Failed to submit homework:", error);
            setSubmitStatus('error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            setFiles(prev => [...prev, ...Array.from(e.dataTransfer.files)]);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
        }
    };

    const removeFile = (indexToRemove: number) => {
        setFiles(prev => prev.filter((_, index) => index !== indexToRemove));
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const RecorderControls = () => (
        <div className="bg-gray-700/50 p-4 rounded-lg space-y-4 h-full flex flex-col justify-between">
            <div className="text-center font-semibold text-gray-300 capitalize">{recordingStatus}</div>
            {recordingStatus === 'finished' && audioUrl && (
                <audio src={audioUrl} controls className="w-full" />
            )}
            <div className="flex justify-center items-center gap-3">
                {recordingStatus === 'idle' && (
                    <button onClick={startRecording} className="bg-red-600 text-white font-bold py-2 px-4 rounded-full">{t('recordButton')}</button>
                )}
                {recordingStatus === 'recording' && (
                    <>
                        <button onClick={pauseRecording} className="bg-yellow-500 text-white font-bold py-2 px-4 rounded-full">{t('pauseButton')}</button>
                        <button onClick={stopRecording} className="bg-gray-600 text-white font-bold py-2 px-4 rounded-full">{t('stopButton')}</button>
                    </>
                )}
                {recordingStatus === 'paused' && (
                     <>
                        <button onClick={resumeRecording} className="bg-green-500 text-white font-bold py-2 px-4 rounded-full">{t('resumeButton')}</button>
                        <button onClick={stopRecording} className="bg-gray-600 text-white font-bold py-2 px-4 rounded-full">{t('stopButton')}</button>
                    </>
                )}
                {recordingStatus === 'finished' && (
                    <button onClick={handleAudioReset} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-full">{t('resetButton')}</button>
                )}
            </div>
        </div>
    );

    const FileUploader = () => (
        <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative flex flex-col w-full h-full p-4 bg-gray-700/50 rounded-lg border-2 border-dashed transition-all duration-300 ${isDragging ? 'border-amber-500 bg-gray-700' : 'border-gray-600'}`}
        >
            <div
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center flex-grow cursor-pointer"
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    multiple
                />
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-500 mb-2" fill="none" viewBox="0 0 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-sm font-semibold text-gray-300">{t('homeworkFilePlaceholder')}</p>
                <p className="text-xs text-gray-500 mt-1">{t('homeworkFileTypes')}</p>
            </div>

            {files.length > 0 && (
                <div className="mt-4 border-t border-gray-600 pt-2">
                    <ul className="space-y-2 max-h-24 overflow-y-auto custom-scrollbar pr-2">
                        {files.map((file, index) => (
                             <li key={`${file.name}-${index}`} className="flex items-center justify-between bg-gray-600/50 p-2 rounded-md animate-fade-in">
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-gray-200 truncate">{file.name}</p>
                                    <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(2)} KB</p>
                                </div>
                                <button
                                    onClick={(e) => { e.stopPropagation(); removeFile(index); }}
                                    className="ml-2 flex-shrink-0 text-red-400 hover:text-red-300 p-1 rounded-full hover:bg-red-500/20"
                                    aria-label={`Remove ${file.name}`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );


    return (
        <div className="page-transition">
            <div className="flex items-center gap-4 mb-6">
                <button onClick={onBack} className="text-gray-400 hover:text-white">&larr;</button>
                <h3 className="text-xl font-bold text-gray-100">{t('homeworkTitle')}</h3>
            </div>
            <div className="space-y-6">
                <div>
                    <label htmlFor="homework-text" className="block text-sm font-medium text-gray-300 mb-2">{t('homeworkTextLabel')}</label>
                    <textarea
                        id="homework-text"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        rows={5}
                        className="w-full bg-gray-700 p-2 rounded-md border border-gray-600 focus:ring-amber-500 focus:border-amber-500"
                        placeholder={t('homeworkTextPlaceholder')}
                    />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">{t('homeworkAudioLabel')}</label>
                        <RecorderControls />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">{t('homeworkFileLabel')}</label>
                        <FileUploader />
                    </div>
                </div>
                <div>
                    <button 
                        onClick={handleSubmit} 
                        disabled={isSubmitting || submitStatus === 'success'}
                        className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:shadow-lg disabled:opacity-60"
                    >
                        {isSubmitting ? t('submittingHomework') : (submitStatus === 'success' ? t('homeworkSubmittedSuccess') : t('submitHomeworkButton'))}
                    </button>
                    {submitStatus === 'error' && <p className="text-red-400 text-center text-sm mt-2">{t('homeworkSubmittedError')}</p>}
                </div>
            </div>
        </div>
    );
};


const ClassDetailsView: React.FC<{ classDetails: ClassDetails; t: (key: string) => string; navigateTo: (page: Page) => void; onOpenChat: (name: string) => void; unreadCount: number; onHomeworkClick: () => void; }> = ({ classDetails, t, navigateTo, onOpenChat, unreadCount, onHomeworkClick }) => {
    const [countdown, setCountdown] = useState<string>('');
    const [expirationCountdown, setExpirationCountdown] = useState<string>('');
    const [currentMeetingUrl, setCurrentMeetingUrl] = useState<string>('#');
    const [readyStatus, setReadyStatus] = useState<'ready' | 'notifying' | 'notified'>('ready');
    const [absentStatus, setAbsentStatus] = useState<'ready' | 'notifying' | 'notified'>('ready');
    
    const [currentDate, setCurrentDate] = useState(new Date());
    const [attendanceData, setAttendanceData] = useState<{ [day: string]: 'attended' | 'missed' }>({});
    const [isLoadingCalendar, setIsLoadingCalendar] = useState(true);

    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isSubscriptionLoading, setIsSubscriptionLoading] = useState(true);

    useEffect(() => {
        const checkSubscription = async () => {
            setIsSubscriptionLoading(true);
            const sub = await getSubscription();
            setIsSubscribed(!!sub);
            setIsSubscriptionLoading(false);
        };
        checkSubscription();
    }, []);

    const handleSubscriptionToggle = async () => {
        setIsSubscriptionLoading(true);
        try {
            if (isSubscribed) {
                await unsubscribeUser();
                setIsSubscribed(false);
                alert(t('notificationsDisabled'));
            } else {
                if (Notification.permission === 'denied') {
                    alert(t('notificationsBlocked'));
                    setIsSubscriptionLoading(false);
                    return;
                }
                await subscribeUser(classDetails.id);
                setIsSubscribed(true);
                alert(t('notificationsEnabled'));
            }
        } catch (error: any) {
            alert(`Error: ${error.message}`);
        } finally {
            setIsSubscriptionLoading(false);
        }
    };

    const timeSlotDetails = useMemo(() => {
        return Object.values(TIME_SLOTS).flat().find(slot => slot.id === classDetails.start_time_id);
    }, [classDetails.start_time_id]);
    
    const scheduledTimeText = timeSlotDetails ? t(timeSlotDetails.key) : 'N/A';
    
    const dayStringToNumber = (day: string): number => ({
        'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6
    }[day.trim()] ?? -1);

    const scheduledDaysNumbers = useMemo(() => classDetails.selected_days.map(dayStringToNumber).filter(d => d !== -1), [classDetails.selected_days]);

    useEffect(() => {
        const fetchMeetingUrl = async () => {
            const { data, error } = await supabase.from('links').select('zoom_link').eq('name', classDetails.name).single();
            if (data?.zoom_link) setCurrentMeetingUrl(data.zoom_link);
        };
        fetchMeetingUrl();
    }, [classDetails.name]);
    
    useEffect(() => {
        const fetchAttendance = async () => {
            setIsLoadingCalendar(true);
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth() + 1;
            const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
            const endDate = `${year}-${String(month).padStart(2, '0')}-${new Date(year, month, 0).getDate()}`;

            const { data, error } = await supabase
                .from('attendance')
                .select('session_date, status')
                .eq('student_name', classDetails.name)
                .gte('session_date', startDate)
                .lte('session_date', endDate);

            if (error) {
                console.error("Error fetching attendance:", error);
            } else {
                const formattedData = data.reduce((acc: any, record: any) => {
                    acc[record.session_date] = record.status;
                    return acc;
                }, {});
                setAttendanceData(formattedData);
            }
            setIsLoadingCalendar(false);
        };
        fetchAttendance();
    }, [classDetails.name, currentDate]);

    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date();
            const [hours, minutes] = (timeSlotDetails?.key ? t(timeSlotDetails.key).match(/\d+/g)?.map(Number) || [0,0] : [0,0]);
            
            let nextSession: Date | null = null;
            for (let i = 0; i < 7; i++) {
                const checkDate = new Date();
                checkDate.setDate(now.getDate() + i);
                if (scheduledDaysNumbers.includes(checkDate.getDay())) {
                    const sessionTime = new Date(checkDate);
                    sessionTime.setHours(hours, minutes, 0, 0);
                    if (sessionTime > now) {
                        nextSession = sessionTime;
                        break;
                    }
                }
            }
            
            if (nextSession) {
                const diff = nextSession.getTime() - now.getTime();
                const d = Math.floor(diff / (1000 * 60 * 60 * 24));
                const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const s = Math.floor((diff % (1000 * 60)) / 1000);
                setCountdown(`${d}d ${h}h ${m}m ${s}s`);
            } else {
                setCountdown(t('joinClassNoUpcoming'));
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [t, timeSlotDetails, scheduledDaysNumbers]);
    
     useEffect(() => {
        if (!classDetails.date_approved) return;
        const interval = setInterval(() => {
            const approvedDate = new Date(classDetails.date_approved);
            const expirationDate = new Date(approvedDate);
            expirationDate.setDate(approvedDate.getDate() + 2);
            const now = new Date();
            const diff = expirationDate.getTime() - now.getTime();
            if (diff > 0) {
                const h = Math.floor(diff / (1000 * 60 * 60));
                const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                setExpirationCountdown(t('cardExpirationInfo').replace('{time}', `${h}h ${m}m`));
            } else {
                setExpirationCountdown(t('cardExpired'));
                clearInterval(interval);
            }
        }, 60000);
        return () => clearInterval(interval);
    }, [classDetails.date_approved, t]);

    const handleReadyClick = async () => {
        setReadyStatus('notifying');
        await sendTeacherNotification({ name: classDetails.name, program: classDetails.path, time: scheduledTimeText });
        setReadyStatus('notified');
    };

    const handleAbsentClick = async () => {
        setAbsentStatus('notifying');
        try {
            const today = new Date();
            const dateString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
            
            const { error } = await supabase.from('attendance').upsert({ student_name: classDetails.name, session_date: dateString, status: 'missed' }, { onConflict: 'student_name, session_date' });
            if (error) throw error;
            
            setAttendanceData(prev => ({ ...prev, [dateString]: 'missed' }));
            await sendTeacherAbsentNotification({ name: classDetails.name, program: classDetails.path, time: scheduledTimeText });
            setAbsentStatus('notified');
        } catch (error: any) {
            alert(`Failed to update attendance: ${error.message}`);
            setAbsentStatus('ready');
        }
    };

    const isTodayASessionDay = scheduledDaysNumbers.includes(new Date().getDay());

    return (
        <div className="page-transition space-y-6">
            <h2 className="text-center text-3xl font-bold text-gray-100">{t('joinClassDetailsTitle')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-800 p-4 rounded-lg text-center"><p className="text-sm text-gray-400">{t('joinClassSelectedIjazah')}</p><p className="font-bold text-lg text-gray-200">{t(PATH_TRANSLATION_KEYS[classDetails.path] || classDetails.path)}</p></div>
                <div className="bg-gray-800 p-4 rounded-lg text-center"><p className="text-sm text-gray-400">{t('joinClassSelectedTime')}</p><p className="font-bold text-lg text-gray-200">{scheduledTimeText}</p></div>
                <div className="bg-gray-800 p-4 rounded-lg text-center"><p className="text-sm text-gray-400">{t('joinClassPaymentStatus')}</p><p className={`font-bold text-lg ${classDetails.paid_state === 'PAID' ? 'text-green-400' : 'text-red-400'}`}>{classDetails.paid_state === 'PAID' ? t('statusPaid') : t('statusUnpaid')}</p></div>
                <div className="bg-gray-800 p-4 rounded-lg text-center"><p className="text-sm text-gray-400">{t('joinClassNextSession')}</p><p className="font-bold text-lg text-gray-200">{countdown}</p></div>
            </div>
            {isTodayASessionDay && (
                <div className="flex flex-col sm:flex-row gap-2">
                    <button onClick={handleReadyClick} disabled={readyStatus !== 'ready'} className="w-full bg-green-600 text-white font-bold py-3 px-4 rounded-lg disabled:opacity-50">{t(readyStatus === 'ready' ? 'imReadyButton' : (readyStatus === 'notifying' ? 'imReadyButtonSending' : 'imReadyButtonSent'))}</button>
                    <button onClick={handleAbsentClick} disabled={absentStatus !== 'ready'} className="w-full bg-red-600 text-white font-bold py-3 px-4 rounded-lg disabled:opacity-50">{t(absentStatus === 'ready' ? 'cantAttendButton' : (absentStatus === 'notifying' ? 'cantAttendButtonSending' : 'cantAttendButtonSent'))}</button>
                </div>
            )}
            <div className="space-y-2">
                <a href={currentMeetingUrl} target="_blank" rel="noopener noreferrer" className="block w-full text-center bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:shadow-lg">{t('joinClassJoinButton')}</a>
                <button onClick={() => onOpenChat(classDetails.name)} className="relative w-full text-center bg-gray-700 text-gray-200 font-bold py-3 px-6 rounded-lg shadow-sm hover:bg-gray-600">{t('chatWithTeacher')} {unreadCount > 0 && <span className="absolute top-2 right-2 flex h-5 w-5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-5 w-5 bg-red-500 items-center justify-center text-xs">{unreadCount}</span></span>}</button>
                <button onClick={onHomeworkClick} className="w-full text-center bg-blue-600 text-white font-bold py-3 px-6 rounded-lg shadow-sm hover:bg-blue-700">{t('homeworkButton')}</button>
                 <button 
                    onClick={handleSubscriptionToggle} 
                    disabled={isSubscriptionLoading}
                    className="w-full text-center bg-gray-600 text-white font-bold py-3 px-6 rounded-lg shadow-sm hover:bg-gray-500 disabled:opacity-60"
                >
                    {isSubscriptionLoading ? t('loading') : (isSubscribed ? t('disableNotifications') : t('enableNotifications'))}
                </button>
            </div>
            
            <details className="bg-gray-800 rounded-lg">
                <summary className="p-4 cursor-pointer font-semibold text-gray-200">{t('viewMonthlyLessons')}</summary>
                <div className="p-4 border-t border-gray-700">
                    <AttendanceCalendar year={currentDate.getFullYear()} month={currentDate.getMonth()} scheduledDays={scheduledDaysNumbers} attendanceData={attendanceData} t={t} />
                </div>
            </details>
            
            <p className="text-center text-xs text-gray-500">{expirationCountdown}</p>
        </div>
    );
};

const LoginPage: React.FC<{ t: (key: string) => string; onLogin: (name: string, passcode: string) => Promise<void>; loading: boolean; error: string | null; onForgot: () => void; }> = ({ t, onLogin, loading, error, onForgot }) => {
    const [name, setName] = useState('');
    const [passcode, setPasscode] = useState('');
    return (
        <form onSubmit={(e) => { e.preventDefault(); onLogin(name, passcode); }} className="space-y-6">
            <h2 className="text-center text-3xl font-bold text-gray-100">{t('joinClassPageTitle')}</h2>
            <div><label htmlFor="join-name" className="block text-sm font-medium text-gray-300">{t('accountNameLabel')}</label><input type="text" id="join-name" value={name} onChange={(e) => setName(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm text-gray-200" /></div>
            <div><label htmlFor="join-passcode" className="block text-sm font-medium text-gray-300">{t('passwordLabel')}</label><input type="password" id="join-passcode" value={passcode} onChange={(e) => setPasscode(e.target.value)} required pattern="\d{3}" maxLength={3} className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm text-gray-200 text-center tracking-[0.5em]" /></div>
            {error && <p className="text-red-400 text-sm text-center">{error}</p>}
            <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:shadow-lg disabled:opacity-50">{loading ? '...' : t('joinClassSubmitButton')}</button>
            <div className="text-center"><button type="button" onClick={onForgot} className="text-xs text-gray-400 hover:text-amber-400">{t('forgotPasscodeLink')}</button></div>
        </form>
    );
};

const ForgotPasscodePage: React.FC<{ t: (key: string) => string; onBack: () => void; }> = ({ t, onBack }) => {
    const [name, setName] = useState('');
    const [whatsapp, setWhatsapp] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [isSent, setIsSent] = useState(false);
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSending(true);
        await sendForgotPasscodeToDiscord({ name, whatsapp });
        setIsSending(false);
        setIsSent(true);
    };
    return (
        <div className="space-y-6"><h2 className="text-center text-2xl font-bold text-gray-100">{t('forgotPasscodeTitle')}</h2>{isSent ? <p className="text-center text-green-400">{t('forgotPasscodeSuccessMessage')}</p> : <form onSubmit={handleSubmit} className="space-y-4"><div><label htmlFor="forgot-name" className="block text-sm font-medium text-gray-300">{t('forgotPasscodeNameLabel')}</label><input type="text" id="forgot-name" value={name} onChange={(e) => setName(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm text-gray-200" /></div><div><label htmlFor="forgot-whatsapp" className="block text-sm font-medium text-gray-300">{t('forgotPasscodeWhatsappLabel')}</label><input type="tel" id="forgot-whatsapp" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm text-gray-200" /></div><button type="submit" disabled={isSending} className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-blue-700 disabled:opacity-50">{isSending ? '...' : t('forgotPasscodeSendButton')}</button></form>}<button onClick={onBack} className="w-full text-sm font-semibold text-gray-400 hover:text-amber-400">&larr; {t('backButton')}</button></div>
    );
};


// --- Main Component ---
interface JoinClassPageProps {
    navigateTo: (page: Page) => void;
    t: (key: string) => string;
    onOpenChat: (name: string) => void;
    unreadCount: number;
}

const JoinClassPage: React.FC<JoinClassPageProps> = ({ navigateTo, t, onOpenChat, unreadCount }) => {
    const [view, setView] = useState<'login' | 'details' | 'forgot' | 'homework'>('login');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [classDetails, setClassDetails] = useState<ClassDetails | null>(null);

    const handleLogin = async (name: string, passcode: string) => {
        setLoading(true);
        setError(null);
        try {
            const { data, error: queryError } = await supabase
                .from('passcodes')
                .select('*')
                .eq('name', name.trim())
                .eq('code', passcode.trim())
                .limit(1)
                .single();
                
            if (queryError || !data) throw new Error(t('joinClassInvalidCredentials'));

            const details: ClassDetails = {
                id: data.id,
                name: data.name,
                path: data.path,
                start_time_id: data.start_time_id,
                selected_days: data.selected_days ? data.selected_days.split(',').map((s: string) => s.trim()) : [],
                paid_state: data.paid_state,
                next_paid: data.next_paid,
                date_approved: data.date_approved,
                isApproved: !!data.date_approved
            };
            
            setClassDetails(details);
            setView('details');

        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div className="max-w-xl mx-auto">
            {view === 'login' && <LoginPage t={t} onLogin={handleLogin} loading={loading} error={error} onForgot={() => setView('forgot')} />}
            {view === 'forgot' && <ForgotPasscodePage t={t} onBack={() => setView('login')} />}
            {view === 'details' && classDetails && (
                classDetails.isApproved
                    ? <ClassDetailsView classDetails={classDetails} t={t} navigateTo={navigateTo} onOpenChat={onOpenChat} unreadCount={unreadCount} onHomeworkClick={() => setView('homework')} />
                    : <div className="text-center bg-blue-900/50 p-6 rounded-lg border border-blue-500/30 text-blue-200 font-semibold">{t('pendingApproval')}</div>
            )}
            {view === 'homework' && classDetails && <HomeworkView studentName={classDetails.name} t={t} onBack={() => setView('details')} />}
            <div className="mt-12 text-center">
                <button onClick={() => navigateTo('home')} className="text-sm font-semibold text-gray-400 hover:text-amber-400 transition-colors">{t('backToHome')}</button>
            </div>
        </div>
    );
};

export default JoinClassPage;