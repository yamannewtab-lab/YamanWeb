import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { AttendanceStatus } from '../types';

// Helper functions moved from JoinClassPage.tsx
const dayStringToNumber = (day: string): number => {
    const map: { [key: string]: number } = {
        'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3,
        'Thursday': 4, 'Friday': 5, 'Saturday': 6
    };
    return map[day] ?? -1;
};

function getJakartaTime() {
    const now = new Date();
    const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
    return new Date(utcTime + (3600000 * 7));
}

// Component and its props
interface AttendanceCalendarProps {
    studentName: string;
    scheduledDays: string[];
    isAdmin: boolean;
    t: (key: string) => string;
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
