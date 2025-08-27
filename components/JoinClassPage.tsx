
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Page } from '../types';
import { supabase } from '../supabaseClient';
import { TIME_SLOTS, PATH_TRANSLATION_KEYS } from '../constants';
import { sendForgotPasscodeToDiscord, sendTeacherNotification, sendTeacherAbsentNotification, sendHomeworkToDiscord } from '../discordService';
import AttendanceCalendar from './AttendanceCalendar';

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
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-sm font-semibold text-gray-300 text-center">{t('homeworkFilePlaceholder')}</p>
                 <p className="text-xs text-gray-500 mt-1">{t('homeworkFileTypes')}</p>
            </div>
        </div>
    );

    return (
        <div className="page-transition">
            <div className="flex items-center gap-4 mb-6">
                <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-700 transition-colors" aria-label={t('backButton')}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                </button>
                <h2 className="text-2xl font-bold text-gray-100">{t('homeworkTitle')}</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-6">
                    <div>
                        <label htmlFor="homework-text" className="block text-sm font-medium text-gray-300 mb-2">{t('homeworkTextLabel')}</label>
                        <textarea
                            id="homework-text"
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder={t('homeworkTextPlaceholder')}
                            rows={6}
                            className="w-full bg-gray-700/50 p-3 rounded-lg border border-gray-600 focus:ring-amber-500 focus:border-amber-500 transition"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">{t('homeworkFileLabel')}</label>
                        <div className="h-48">
                            <FileUploader />
                        </div>
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">{t('homeworkAudioLabel')}</label>
                    <div className="h-48">
                       <RecorderControls />
                    </div>
                </div>
            </div>
            {files.length > 0 && (
                <div className="mt-6">
                    <h4 className="font-semibold mb-2">{t('uploadedFilesTitle')}:</h4>
                    <ul className="space-y-2">
                        {files.map((file, index) => (
                            <li key={index} className="flex justify-between items-center bg-gray-700/50 p-2 rounded-lg text-sm">
                                <span>{file.name}</span>
                                <button onClick={() => removeFile(index)} className="text-red-400 hover:text-red-300 font-bold text-lg px-2" aria-label={t('removeFileButton')}>&times;</button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            <div className="mt-8 text-center">
                <button 
                    onClick={handleSubmit} 
                    disabled={isSubmitting || submitStatus === 'success'}
                    className="w-full sm:w-auto bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-60"
                >
                    {isSubmitting ? t('submittingHomework') : submitStatus === 'success' ? t('homeworkSubmittedSuccess') : t('submitHomeworkButton')}
                </button>
                {submitStatus === 'error' && <p className="text-red-400 mt-2">{t('homeworkSubmittedError')}</p>}
            </div>
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
    const [view, setView] = useState<'login' | 'details' | 'homework' | 'forgot_passcode' | 'calendar'>('login');
    const [name, setName] = useState('');
    const [passcode, setPasscode] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [classDetails, setClassDetails] = useState<ClassDetails | null>(null);
    const [link, setLink] = useState<string | null>(null);
    const [forgotName, setForgotName] = useState('');
    const [forgotWhatsapp, setForgotWhatsapp] = useState('');
    const [forgotSuccess, setForgotSuccess] = useState(false);
    const [readyButtonState, setReadyButtonState] = useState<'idle' | 'sending' | 'sent'>('idle');
    const [attendanceData, setAttendanceData] = useState<{ [day: string]: 'attended' | 'missed' }>({});
    
    const dayStringToNumber = (day: string): number => {
        const map: { [key: string]: number } = { 'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6 };
        return map[day.trim() as keyof typeof map] ?? -1;
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);
        try {
            const { data, error: queryError } = await supabase
                .from('passcodes')
                .select('id, name, path, start_time_id, selected_days, paid_state, next_paid, date_approved')
                .eq('name', name.trim())
                .eq('code', passcode.trim())
                .single();

            if (queryError || !data) {
                throw new Error(t('joinClassInvalidCredentials'));
            }

            setClassDetails({
                ...data,
                selected_days: data.selected_days ? data.selected_days.split(',').map((d: string) => d.trim()) : [],
                isApproved: !!data.date_approved,
            });
            setView('details');

        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };
    
     const handleForgotPasscode = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        await sendForgotPasscodeToDiscord({ name: forgotName, whatsapp: forgotWhatsapp });
        setIsLoading(false);
        setForgotSuccess(true);
    };

    useEffect(() => {
        if (classDetails?.isApproved) {
            const fetchLink = async () => {
                const { data, error } = await supabase.from('links').select('zoom_link').eq('name', classDetails.name).single();
                if (!error && data) setLink(data.zoom_link);
            };
            fetchLink();
            
            const fetchAttendance = async () => {
                const { data, error } = await supabase.from('attendance').select('session_date, status').eq('student_name', classDetails.name);
                if (!error && data) {
                    const formattedData = data.reduce((acc: any, record: any) => {
                        acc[record.session_date] = record.status;
                        return acc;
                    }, {});
                    setAttendanceData(formattedData);
                }
            };
            fetchAttendance();
        }
    }, [classDetails]);
    
    const timeSlotToKey = (slotId: string): string => {
        for (const block of Object.values(TIME_SLOTS)) {
            const found = block.find(s => s.id === slotId);
            if (found) return t(found.key);
        }
        return slotId;
    };

    const handleImReady = async () => {
        if (!classDetails) return;
        setReadyButtonState('sending');
        await sendTeacherNotification({
            name: classDetails.name,
            program: t(PATH_TRANSLATION_KEYS[classDetails.path] || classDetails.path),
            time: timeSlotToKey(classDetails.start_time_id)
        });
        setReadyButtonState('sent');
        setTimeout(() => setReadyButtonState('idle'), 5000);
    };

    const handleCantAttend = async () => {
        if (!classDetails) return;
        setReadyButtonState('sending');
        const today = new Date();
        const dateString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        
        await supabase.from('attendance').upsert({ student_name: classDetails.name, session_date: dateString, status: 'missed' }, { onConflict: 'student_name, session_date' });
        
        await sendTeacherAbsentNotification({
            name: classDetails.name,
            program: t(PATH_TRANSLATION_KEYS[classDetails.path] || classDetails.path),
            time: timeSlotToKey(classDetails.start_time_id)
        });
        setReadyButtonState('sent');
    };

    if (isLoading) return <p className="text-center">{t('loading')}</p>;
    
    if (view === 'homework' && classDetails) {
        return <HomeworkView studentName={classDetails.name} t={t} onBack={() => setView('details')} />;
    }

    if (view === 'details' && classDetails) {
        if (!classDetails.isApproved) {
            return (
                <div className="text-center py-10">
                    <h2 className="text-2xl font-bold">{t('helloUser').replace('{name}', classDetails.name)}</h2>
                    <p className="mt-4 text-gray-400 bg-blue-900/50 p-4 rounded-lg">{t('pendingApproval')}</p>
                </div>
            );
        }
        return (
            <div>
                 <h2 className="text-3xl font-bold text-center mb-6">{t('joinClassWelcomeTitle').replace('{name}', classDetails.name)}</h2>
                 <div className="space-y-4 max-w-md mx-auto">
                    <div className="bg-gray-800/50 p-4 rounded-lg">
                        <p className="text-sm text-gray-400">{t('joinClassSelectedIjazah')}</p>
                        <p className="font-semibold text-lg">{t(PATH_TRANSLATION_KEYS[classDetails.path] || classDetails.path)}</p>
                    </div>
                    <div className="bg-gray-800/50 p-4 rounded-lg">
                        <p className="text-sm text-gray-400">{t('joinClassSelectedTime')}</p>
                        <p className="font-semibold text-lg">{timeSlotToKey(classDetails.start_time_id)}</p>
                    </div>
                    <div className="bg-gray-800/50 p-4 rounded-lg">
                        <p className="text-sm text-gray-400">{t('joinClassPaymentStatus')}</p>
                        <p className={`font-semibold text-lg ${classDetails.paid_state === 'PAID' ? 'text-green-400' : 'text-red-400'}`}>
                            {classDetails.paid_state === 'PAID' ? t('statusPaid') : t('statusUnpaid')}
                        </p>
                    </div>
                    {link ? (
                        <div className="flex flex-col gap-3 pt-4">
                            <a href={link} target="_blank" rel="noopener noreferrer" className="w-full text-center bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold py-3 px-4 rounded-lg shadow-md">{t('joinClassJoinButton')}</a>
                             <button onClick={handleImReady} disabled={readyButtonState !== 'idle'} className="w-full text-center bg-blue-600 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50">{readyButtonState === 'idle' ? t('imReadyButton') : (readyButtonState === 'sending' ? t('imReadyButtonSending') : t('imReadyButtonSent'))}</button>
                             <button onClick={handleCantAttend} className="w-full text-center bg-red-600 text-white font-bold py-2 px-4 rounded-lg">{t('cantAttendButton')}</button>
                        </div>
                    ) : <p className="text-center text-amber-400">Waiting for class link from admin...</p>}
                     <div className="flex flex-col gap-3 pt-2">
                        <button onClick={() => setView('homework')} className="w-full text-center bg-gray-700 text-white font-bold py-2 px-4 rounded-lg">{t('homeworkButton')}</button>
                        <button onClick={() => setView('calendar')} className="w-full text-center bg-gray-700 text-white font-bold py-2 px-4 rounded-lg">{t('viewMonthlyLessons')}</button>
                        <button onClick={() => onOpenChat(classDetails.name)} className="relative w-full text-center bg-gray-700 text-white font-bold py-2 px-4 rounded-lg">
                            {t('chatWithTeacher')}
                            {unreadCount > 0 && <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">{unreadCount}</span>}
                        </button>
                    </div>
            </div>
            </div>
        )
    }
    
    if (view === 'calendar' && classDetails) {
         return (
             <div>
                <button onClick={() => setView('details')} className="mb-4 text-sm font-semibold text-gray-400 hover:text-amber-400">&larr; {t('backButton')}</button>
                <h3 className="text-xl font-bold text-center mb-4">{t('attendanceCalendarTitle')}</h3>
                <AttendanceCalendar year={new Date().getFullYear()} month={new Date().getMonth()} scheduledDays={classDetails.selected_days.map(dayStringToNumber)} attendanceData={attendanceData} t={t} />
             </div>
         )
    }

    if (view === 'forgot_passcode') {
        return (
            <div>
                 <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-gray-100">{t('forgotPasscodeTitle')}</h2>
                </div>
                {forgotSuccess ? <p className="text-center text-green-400">{t('forgotPasscodeSuccessMessage')}</p> : (
                <form onSubmit={handleForgotPasscode} className="max-w-md mx-auto space-y-4">
                    <input type="text" value={forgotName} onChange={e => setForgotName(e.target.value)} placeholder={t('forgotPasscodeNameLabel')} required className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-200" />
                    <input type="tel" value={forgotWhatsapp} onChange={e => setForgotWhatsapp(e.target.value)} placeholder={t('forgotPasscodeWhatsappLabel')} required className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-200" />
                    <button type="submit" className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold py-2 px-4 rounded-lg">{t('forgotPasscodeSendButton')}</button>
                </form>
                )}
                <div className="text-center mt-4">
                    <button onClick={() => setView('login')} className="text-sm text-gray-400 hover:text-amber-400">&larr; {t('backButton')}</button>
                </div>
            </div>
        )
    }

    return (
        <div>
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-100">{t('joinClassPageTitle')}</h2>
            </div>
            <form onSubmit={handleLogin} className="max-w-sm mx-auto space-y-4">
                <div>
                    <label htmlFor="join-name" className="sr-only">{t('joinClassNameLabel')}</label>
                    <input id="join-name" type="text" value={name} onChange={e => setName(e.target.value)} placeholder={t('joinClassNameLabel')} required className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-200" />
                </div>
                <div>
                    <label htmlFor="join-passcode" className="sr-only">{t('joinClassPasscodeLabel')}</label>
                    <input id="join-passcode" type="password" value={passcode} onChange={e => setPasscode(e.target.value)} placeholder={t('joinClassPasscodeLabel')} required maxLength={3} pattern="[0-9]*" inputMode="numeric" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-200 text-center tracking-[0.5em]" />
                </div>
                {error && <p className="text-red-400 text-sm text-center">{error}</p>}
                <button type="submit" disabled={isLoading} className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold py-3 px-4 rounded-lg disabled:opacity-50">{t('joinClassSubmitButton')}</button>
                 <div className="text-center">
                    <button type="button" onClick={() => setView('forgot_passcode')} className="text-sm text-gray-400 hover:text-amber-400">{t('forgotPasscodeLink')}</button>
                </div>
            </form>
        </div>
    );
};

export default JoinClassPage;
