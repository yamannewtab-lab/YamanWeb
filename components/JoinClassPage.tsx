

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Page } from '../types';
import { supabase } from '../supabaseClient';
import { TIME_SLOTS, PATH_TRANSLATION_KEYS } from '../constants';
import { sendForgotPasscodeToDiscord, sendTeacherNotification, sendTeacherAbsentNotification, sendHomeworkToDiscord } from '../discordService';
import AttendanceCalendar from './AttendanceCalendar';
import WelcomeView from './WelcomeView';

// --- Sub-Components ---

interface ClassDetails {
    id: number;
    name: string;
    path: string;
    start_time_id: string;
    selected_days: string[];
    paid_state: string | null;
    next_paid: string | null;
    date_approved: string | null;
    isApproved: boolean;
    has_seen_welcome: boolean;
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
                <p className="text-sm font-semibold text-gray-300 text-center">{t('homeworkFilePlaceholder')}</p>
                 <p className="text-xs text-gray-500 mt-1">{t('homeworkFileTypes')}</p>
            </div>
        </div>
    );

    return (
        <div className="page-transition">
            <div className="flex items-center gap-4 mb-6">
                <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-700 transition-colors" aria-label={t('backButton')}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
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
                            <li key={index} className="flex justify-between items-center bg-gray-700/50 p-2 rounded-md text-sm">
                                <span className="truncate">{file.name}</span>
                                <button onClick={() => removeFile(index)} className="text-red-400 hover:text-red-300 font-bold ml-2">&times;</button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            <div className="mt-8 flex justify-end">
                <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-60"
                >
                    {isSubmitting ? t('submittingHomework') : (submitStatus === 'success' ? t('homeworkSubmittedSuccess') : (submitStatus === 'error' ? t('homeworkSubmittedError') : t('submitHomeworkButton')))}
                </button>
            </div>
        </div>
    );
};

const ClassDetailsView: React.FC<{
    classDetails: ClassDetails;
    t: (key: string) => string;
    onOpenChat: (name: string) => void;
    unreadCount: number;
    onShowHomework: () => void;
}> = ({ classDetails, t, onOpenChat, unreadCount, onShowHomework }) => {
    
    const [currentTime, setCurrentTime] = useState(new Date());
    const [imReadyStatus, setImReadyStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
    const [cantAttendStatus, setCantAttendStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
    const [attendance, setAttendance] = useState<{ [day: string]: 'attended' | 'missed' }>({});
    const [isCalendarVisible, setIsCalendarVisible] = useState(false);
    const [selectedCountdownDay, setSelectedCountdownDay] = useState<string | null>(null);

    const staticZoomLink = "https://us05web.zoom.us/j/2220657355?pwd=5LYF7JxcuWGqYqwIydNbi3cA8uAlxV.1";

    const dayMap: { [key: string]: number } = useMemo(() => ({ 'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6 }), []);

    const timeSlot = useMemo(() => {
        return Object.values(TIME_SLOTS).flat().find(slot => slot.id === classDetails.start_time_id);
    }, [classDetails.start_time_id]);
    
    const timeText = timeSlot ? t(timeSlot.key) : 'N/A';
    
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const nextSession = useMemo(() => {
        const scheduledDayNumbers = classDetails.selected_days.map(d => dayMap[d]);

        if (!classDetails.start_time_id || scheduledDayNumbers.length === 0) return null;

        const timeParts = classDetails.start_time_id.split('_');
        if (timeParts.length < 2) return null;
        const timeString = timeParts[1];
        const hour = parseInt(timeString.substring(0, 2), 10);
        const minute = parseInt(timeString.substring(2, 4), 10);

        if (isNaN(hour) || isNaN(minute)) return null;
        
        const now = new Date();

        if (selectedCountdownDay) {
            const targetDayNumber = dayMap[selectedCountdownDay];
            const currentDayNumber = now.getDay();
            let daysToAdd = (targetDayNumber - currentDayNumber + 7) % 7;
            
            const potentialDate = new Date(now);
            potentialDate.setDate(now.getDate() + daysToAdd);
            potentialDate.setHours(hour, minute, 0, 0);

            if (potentialDate < now) {
                potentialDate.setDate(potentialDate.getDate() + 7);
            }
            return potentialDate;
        } else {
            // Find the soonest upcoming session
            for (let i = 0; i < 14; i++) {
                let nextDate = new Date(now);
                nextDate.setDate(now.getDate() + i);
                nextDate.setHours(hour, minute, 0, 0);

                if (scheduledDayNumbers.includes(nextDate.getDay()) && nextDate > new Date(Date.now() - 20 * 60 * 1000)) { // 20 min grace period
                    return nextDate;
                }
            }
        }
        return null;
    }, [classDetails.selected_days, classDetails.start_time_id, selectedCountdownDay, dayMap]);
    
    const timeDiff = nextSession ? nextSession.getTime() - currentTime.getTime() : null;
    
    const Countdown: React.FC<{ diff: number | null }> = ({ diff }) => {
        if (diff === null) return <p>{t('joinClassNoUpcoming')}</p>;
        if (diff <= 1000) return <p className="font-bold text-green-400">{t('joinClassStartsNow')}</p>;

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / 1000 / 60) % 60);
        const seconds = Math.floor((diff / 1000) % 60);

        if (days > 0) return <p>{days}d {hours}h</p>;
        if (hours > 0) return <p>{hours}h {minutes}m</p>;
        return <p>{minutes}m {seconds}s</p>;
    };

    const isJoinButtonEnabled = timeDiff !== null && timeDiff <= 5 * 60 * 1000 && timeDiff > -20 * 60 * 1000;

    const handleImReady = async () => {
        setImReadyStatus('sending');
        try {
            await sendTeacherNotification({
                name: classDetails.name,
                program: t(PATH_TRANSLATION_KEYS[classDetails.path] || classDetails.path),
                time: timeText
            });
            setImReadyStatus('sent');
            setTimeout(() => setImReadyStatus('idle'), 5000);
        } catch (error) {
            console.error("Failed to send 'I'm Ready' notification:", error);
            setImReadyStatus('idle');
        }
    };
    
    const handleCantAttend = async () => {
        setCantAttendStatus('sending');
        try {
            const today = new Date();
            const dateString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
            
            const { error } = await supabase
                .from('attendance')
                .upsert({ student_name: classDetails.name, session_date: dateString, status: 'missed' }, { onConflict: 'student_name, session_date' });

            if (error) throw error;
            
            await sendTeacherAbsentNotification({
                name: classDetails.name,
                program: t(PATH_TRANSLATION_KEYS[classDetails.path] || classDetails.path),
                time: timeText
            });

            setCantAttendStatus('sent');
            setTimeout(() => setCantAttendStatus('idle'), 5000);
        } catch (error) {
            console.error("Failed to mark as absent:", error);
            alert("Failed to update status. Please try again.");
            setCantAttendStatus('idle');
        }
    };
    
    useEffect(() => {
        if (isCalendarVisible) {
            const fetchAttendance = async () => {
                const today = new Date();
                const year = today.getFullYear();
                const month = today.getMonth() + 1;
                const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
                const endDate = `${year}-${String(month).padStart(2, '0')}-${new Date(year, month, 0).getDate()}`;
                
                const { data, error } = await supabase
                    .from('attendance')
                    .select('session_date, status')
                    .eq('student_name', classDetails.name)
                    .gte('session_date', startDate)
                    .lte('session_date', endDate);
                
                if (error) console.error("Error fetching attendance:", error);
                else {
                    const formattedData = data.reduce((acc: any, record: any) => {
                        acc[record.session_date] = record.status;
                        return acc;
                    }, {});
                    setAttendance(formattedData);
                }
            };
            fetchAttendance();
        }
    }, [isCalendarVisible, classDetails.name]);
    
     const dayStringToNumber = (day: string): number => {
        const map: { [key: string]: number } = { 'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6 };
        return map[day.trim()] ?? -1;
    };
    
    const sessionsInCurrentMonth = useMemo(() => {
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth();
        const scheduledDayNumbers = classDetails.selected_days.map(dayStringToNumber);
        
        let count = 0;
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        for (let day = 1; day <= daysInMonth; day++) {
            const currentDate = new Date(year, month, day);
            if (scheduledDayNumbers.includes(currentDate.getDay())) {
                count++;
            }
        }
        return count;
    }, [classDetails.selected_days]);

    const sortedSelectedDays = useMemo(() => 
        [...classDetails.selected_days].sort((a, b) => dayMap[a] - dayMap[b]),
    [classDetails.selected_days, dayMap]);

    return (
        <div className="page-transition">
            <h2 className="text-2xl font-bold text-center text-gray-100">{t('helloUser').replace('{name}', classDetails.name)}</h2>
            
            <div className="mt-6 p-6 bg-gray-800/50 rounded-xl shadow-lg border border-gray-700/50 space-y-4">
                <div>
                    <p className="text-sm text-gray-400">{t('joinClassSelectedIjazah')}</p>
                    <p className="font-semibold text-gray-200">{t(PATH_TRANSLATION_KEYS[classDetails.path] || classDetails.path)}</p>
                </div>
                <div>
                    <p className="text-sm text-gray-400">{t('joinClassSelectedTime')}</p>
                    <p className="font-semibold text-gray-200">{timeText}</p>
                </div>
                <div className="border-t border-gray-700/50 pt-4 text-center">
                    <p className="text-sm text-gray-400 mb-2">{t('yourSchedule')}</p>
                    <div className="flex flex-wrap justify-center gap-2">
                        <button
                            onClick={() => setSelectedCountdownDay(null)}
                            className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${
                                selectedCountdownDay === null 
                                ? 'bg-amber-500 text-white shadow-md' 
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}
                        >
                            {t('nextUpcoming')}
                        </button>
                        {sortedSelectedDays.map(day => (
                            <button 
                                key={day}
                                onClick={() => setSelectedCountdownDay(day)}
                                className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${
                                    selectedCountdownDay === day 
                                    ? 'bg-amber-500 text-white shadow-md' 
                                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                }`}
                            >
                                {t(`day${day}`)}
                            </button>
                        ))}
                    </div>
                    <p className="text-sm text-gray-400 mt-4">
                        {selectedCountdownDay 
                            ? `${t('countdownFor')} ${t(`day${selectedCountdownDay}`)}`
                            : t('joinClassNextSession')
                        }
                    </p>
                    <div className="text-2xl font-bold text-amber-400"><Countdown diff={timeDiff} /></div>
                </div>
            </div>

            <div className="mt-8 flex flex-col items-center gap-4">
                <a href={staticZoomLink} target="_blank" rel="noopener noreferrer" className={`w-full text-center font-bold py-3 px-6 rounded-lg shadow-md transition-all duration-300 text-lg ${isJoinButtonEnabled ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:shadow-lg transform hover:-translate-y-0.5' : 'bg-gray-700 text-gray-500 cursor-not-allowed'}`} aria-disabled={!isJoinButtonEnabled}>
                    {t('joinClassJoinButton')}
                </a>
                 <div className="grid grid-cols-2 gap-4 w-full">
                    <button onClick={handleImReady} disabled={imReadyStatus !== 'idle'} className="w-full bg-green-600 text-white font-bold py-2 px-4 rounded-lg shadow-sm hover:bg-green-700 disabled:opacity-50 transition-all">
                        {imReadyStatus === 'sending' ? t('imReadyButtonSending') : imReadyStatus === 'sent' ? t('imReadyButtonSent') : t('imReadyButton')}
                    </button>
                    <button onClick={handleCantAttend} disabled={cantAttendStatus !== 'idle'} className="w-full bg-red-600 text-white font-bold py-2 px-4 rounded-lg shadow-sm hover:bg-red-700 disabled:opacity-50 transition-all">
                        {cantAttendStatus === 'sending' ? t('cantAttendButtonSending') : cantAttendStatus === 'sent' ? t('cantAttendButtonSent') : t('cantAttendButton')}
                    </button>
                 </div>
                  <p className="text-xs text-center text-gray-500">{t('cantAttendWarning')}</p>
            </div>

             <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                 <button onClick={() => setIsCalendarVisible(!isCalendarVisible)} className="w-full bg-gray-700 text-gray-200 font-bold py-3 px-4 rounded-lg shadow-sm hover:bg-gray-600 transition-colors flex items-center justify-center gap-2">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" /></svg>
                     {t('viewMonthlyLessons')}
                 </button>
                 <button onClick={onShowHomework} className="w-full bg-gray-700 text-gray-200 font-bold py-3 px-4 rounded-lg shadow-sm hover:bg-gray-600 transition-colors flex items-center justify-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>
                    {t('homeworkButton')}
                </button>
                <button onClick={() => onOpenChat(classDetails.name)} className="relative w-full sm:col-span-2 bg-gray-700 text-gray-200 font-bold py-3 px-4 rounded-lg shadow-sm hover:bg-gray-600 transition-colors flex items-center justify-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M2 5a2 2 0 012-2h12a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm14 1a1 1 0 00-1-1H5a1 1 0 00-1 1v5l4-3 4 3 4-3v-5z" /></svg>
                    {t('chatWithTeacher')}
                    {unreadCount > 0 && <span className="absolute top-0 right-0 -mt-2 -mr-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">{unreadCount}</span>}
                </button>
            </div>
            
            {isCalendarVisible && (
                 <div className="mt-6 page-transition">
                    <h3 className="text-lg font-bold text-center mb-2">{t('attendanceCalendarTitle')}</h3>
                    <p className="text-center text-sm text-gray-400 mb-4">{t('sessionsThisMonth').replace('{count}', String(sessionsInCurrentMonth))}</p>
                    <AttendanceCalendar 
                        year={currentTime.getFullYear()} 
                        month={currentTime.getMonth()} 
                        scheduledDays={classDetails.selected_days.map(dayStringToNumber)}
                        attendanceData={attendance}
                        t={t}
                    />
                </div>
            )}
        </div>
    );
};

const LoginView: React.FC<{
    onLogin: (name: string, code: string) => void;
    isLoading: boolean;
    error: string | null;
    t: (key: string) => string;
}> = ({ onLogin, isLoading, error, t }) => {
    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [showForgot, setShowForgot] = useState(false);
    const [forgotName, setForgotName] = useState('');
    const [forgotWhatsapp, setForgotWhatsapp] = useState('');
    const [forgotStatus, setForgotStatus] = useState<'idle' | 'sending' | 'sent'>('idle');

    const handleLoginSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onLogin(name, code);
    };

    const handleForgotSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setForgotStatus('sending');
        try {
            await sendForgotPasscodeToDiscord({ name: forgotName, whatsapp: forgotWhatsapp });
            setForgotStatus('sent');
        } catch (err) {
            console.error(err);
            setForgotStatus('idle');
            alert("An error occurred. Please try again.");
        }
    };
    
    return (
        <div className="page-transition">
            {showForgot ? (
                <div>
                    <h2 className="text-2xl font-bold text-center text-gray-100">{t('forgotPasscodeTitle')}</h2>
                    {forgotStatus === 'sent' ? (
                        <div className="mt-6 text-center">
                            <p className="text-green-400">{t('forgotPasscodeSuccessMessage')}</p>
                            <button onClick={() => setShowForgot(false)} className="mt-4 text-sm font-semibold text-gray-400 hover:text-amber-400">&larr; {t('backButton')}</button>
                        </div>
                    ) : (
                        <form onSubmit={handleForgotSubmit} className="mt-6 space-y-4">
                            <div><label htmlFor="forgot-name" className="block text-sm font-medium text-gray-300">{t('forgotPasscodeNameLabel')}</label><input type="text" id="forgot-name" value={forgotName} onChange={(e) => setForgotName(e.target.value)} required className="w-full bg-gray-700 p-2 rounded-md" /></div>
                            <div><label htmlFor="forgot-whatsapp" className="block text-sm font-medium text-gray-300">{t('forgotPasscodeWhatsappLabel')}</label><input type="tel" id="forgot-whatsapp" value={forgotWhatsapp} onChange={(e) => setForgotWhatsapp(e.target.value)} required className="w-full bg-gray-700 p-2 rounded-md" /></div>
                            <button type="submit" disabled={forgotStatus === 'sending'} className="w-full bg-amber-500 text-white font-bold p-2 rounded-md">{forgotStatus === 'sending' ? t('loading') : t('forgotPasscodeSendButton')}</button>
                            <button type="button" onClick={() => setShowForgot(false)} className="w-full text-center text-sm mt-2 text-gray-400 hover:text-amber-400">&larr; {t('backButton')}</button>
                        </form>
                    )}
                </div>
            ) : (
                <div>
                    <h2 className="text-2xl font-bold text-center text-gray-100">{t('joinClassPageTitle')}</h2>
                    <form onSubmit={handleLoginSubmit} className="mt-6 space-y-4">
                        <div><label htmlFor="join-name" className="block text-sm font-medium text-gray-300">{t('joinClassNameLabel')}</label><input type="text" id="join-name" value={name} onChange={(e) => setName(e.target.value)} required className="w-full bg-gray-700 p-2 rounded-md" /></div>
                        <div><label htmlFor="join-code" className="block text-sm font-medium text-gray-300">{t('joinClassPasscodeLabel')}</label><input type="password" id="join-code" value={code} onChange={(e) => setCode(e.target.value)} required pattern="[0-9]*" inputMode="numeric" maxLength={3} className="w-full bg-gray-700 p-2 rounded-md text-center tracking-[0.5em]" /></div>
                        {error && <p className="text-red-400 text-sm text-center">{error}</p>}
                        <button type="submit" disabled={isLoading} className="w-full bg-amber-500 text-white font-bold p-2 rounded-md">{isLoading ? t('loading') : t('joinClassSubmitButton')}</button>
                    </form>
                    <div className="text-center mt-4">
                        <button onClick={() => setShowForgot(true)} className="text-sm text-gray-400 hover:text-amber-400">{t('forgotPasscodeLink')}</button>
                    </div>
                </div>
            )}
        </div>
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
    const [view, setView] = useState<'login' | 'details' | 'homework' | 'pending'>('login');
    const [classDetails, setClassDetails] = useState<ClassDetails | null>(null);
    const [loginError, setLoginError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showWelcome, setShowWelcome] = useState(false);

    const handleLogin = async (name: string, code: string) => {
        setIsLoading(true);
        setLoginError(null);
        try {
            const { data, error } = await supabase
                .from('passcodes')
                .select('id, name, code, path, start_time_id, selected_days, paid_state, next_paid, date_approved, has_seen_welcome')
                .ilike('name', name.trim())
                .single();

            if (error || !data) {
                if (error && error.code !== 'PGRST116') {
                    console.error("Supabase login error:", JSON.stringify(error, null, 2));
                }
                setLoginError(t('joinClassInvalidCredentials'));
                return;
            }

            if (String(data.code) !== code.trim()) {
                 setLoginError(t('joinClassInvalidCredentials'));
                 return;
            }
            
            const details: ClassDetails = {
                id: data.id,
                name: data.name,
                path: data.path,
                start_time_id: data.start_time_id,
                selected_days: data.selected_days ? data.selected_days.split(',').map((d: string) => d.trim()) : [],
                paid_state: data.paid_state,
                next_paid: data.next_paid,
                date_approved: data.date_approved,
                isApproved: !!data.date_approved,
                has_seen_welcome: data.has_seen_welcome,
            };
            setClassDetails(details);
            if (details.isApproved && !details.has_seen_welcome) {
                setShowWelcome(true);
            } else {
                setView(details.isApproved ? 'details' : 'pending');
            }
        } catch (err: any) {
            setLoginError('An unexpected error occurred.');
            console.error("Supabase login error:", err.message, err);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleWelcomeContinue = async () => {
        if (!classDetails) return;
        const { error } = await supabase
            .from('passcodes')
            .update({ has_seen_welcome: true })
            .eq('id', classDetails.id);

        if (error) {
            console.error("Failed to update welcome status:", error);
        }
        setShowWelcome(false);
        setView('details');
    };

    const renderContent = () => {
        if (showWelcome && classDetails) {
            return (
                <WelcomeView 
                    studentName={classDetails.name}
                    programName={t(PATH_TRANSLATION_KEYS[classDetails.path] || classDetails.path)}
                    t={t}
                    onContinue={handleWelcomeContinue}
                />
            );
        }
        
        switch (view) {
            case 'login':
                return <LoginView onLogin={handleLogin} isLoading={isLoading} error={loginError} t={t} />;
            case 'details':
                if (classDetails) {
                    return <ClassDetailsView classDetails={classDetails} t={t} onOpenChat={onOpenChat} unreadCount={unreadCount} onShowHomework={() => setView('homework')} />;
                }
                return null;
            case 'homework':
                if (classDetails) {
                    return <HomeworkView studentName={classDetails.name} t={t} onBack={() => setView('details')} />;
                }
                return null;
            case 'pending':
                 return (
                    <div className="text-center py-16 page-transition">
                         <h2 className="text-2xl font-bold text-center text-gray-100">{t('helloUser').replace('{name}', classDetails?.name || '')}</h2>
                         <p className="mt-4 text-gray-400">{t('pendingApproval')}</p>
                    </div>
                 );
            default:
                return <LoginView onLogin={handleLogin} isLoading={isLoading} error={loginError} t={t} />;
        }
    };
    
    return <div>{renderContent()}</div>;
};

export default JoinClassPage;