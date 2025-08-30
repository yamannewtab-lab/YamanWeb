import React from 'react';

interface AttendanceCalendarProps {
    year: number;
    month: number; // 0-11
    scheduledDays: number[]; // 0=Sun, 1=Mon, ..., 6=Sat
    attendanceData: { [day: string]: 'attended' | 'missed' };
    isEditable?: boolean;
    onDayClick?: (day: number, currentStatus: 'scheduled' | 'attended' | 'missed') => void;
    t: (key: string) => string;
}

const AttendanceCalendar: React.FC<AttendanceCalendarProps> = ({
    year,
    month,
    scheduledDays,
    attendanceData,
    isEditable = false,
    onDayClick = () => {},
    t
}) => {
    const today = new Date();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0=Sun, 1=Mon...

    const getDayStatus = (day: number): { status: 'scheduled' | 'attended' | 'missed', isScheduled: boolean } => {
        const date = new Date(year, month, day);
        const dayOfWeek = date.getDay();
        const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

        const isScheduled = scheduledDays.includes(dayOfWeek);
        const attendanceStatus = attendanceData[dateString];

        if (attendanceStatus) {
            return { status: attendanceStatus, isScheduled };
        }
        return { status: 'scheduled', isScheduled };
    };

    const handleDayClick = (day: number) => {
        const { status, isScheduled } = getDayStatus(day);
        if (isEditable && isScheduled) {
            onDayClick(day, status);
        }
    };
    
    const renderCalendar = () => {
        const calendarDays = [];
        // Add empty cells for days before the first of the month
        for (let i = 0; i < firstDayOfMonth; i++) {
            calendarDays.push(<div key={`empty-start-${i}`} className="rounded-full"></div>);
        }

        // Add cells for each day of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const { status, isScheduled } = getDayStatus(day);
            const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
            
            let bgColor = 'bg-gray-900'; // Non-lesson day (Darker Grey)
            if (isScheduled) {
                bgColor = 'bg-gray-600'; // Scheduled lesson day (Grey)
            }
            if (status === 'attended') {
                bgColor = 'bg-green-600'; // Attended (Green)
            } else if (status === 'missed') {
                bgColor = 'bg-red-600'; // Missed (Red)
            }
            
            const isPast = new Date(year, month, day) < new Date(new Date().setDate(new Date().getDate() - 1));
            
            calendarDays.push(
                <div
                    key={day}
                    onClick={() => handleDayClick(day)}
                    className={`
                        text-center rounded-full aspect-square flex items-center justify-center text-xs sm:text-sm
                        ${bgColor}
                        ${isEditable && isScheduled && 'cursor-pointer hover:ring-2 ring-amber-400 transition-all'}
                        ${!isScheduled ? 'text-gray-500' : 'text-white font-bold'}
                        ${isPast && isScheduled && status === 'scheduled' ? 'opacity-50' : ''}
                        ${isToday ? 'ring-2 ring-yellow-400' : ''}
                    `}
                >
                    {day}
                </div>
            );
        }
        return calendarDays;
    };
    
    const weekdays = ['daySunday', 'dayMonday', 'dayTuesday', 'dayWednesday', 'dayThursday', 'dayFriday', 'daySaturday'];
    const isArabic = document.documentElement.dir === 'rtl';

    return (
        <div className="p-2 bg-gray-800 rounded-lg">
            <div className={`grid grid-cols-7 gap-px sm:gap-1 mb-2 text-center font-bold text-gray-400 ${isArabic ? 'text-[9px] sm:text-[10px] leading-tight' : 'text-[10px] sm:text-xs'}`}>
                {weekdays.map(dayKey => <div key={dayKey} className="flex items-center justify-center h-6">{isArabic ? t(dayKey) : t(dayKey).substring(0, 3)}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
                {renderCalendar()}
            </div>
            {(isEditable || Object.values(attendanceData).length > 0) && (
                <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs">
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-gray-600"></div><span>{t('calendarScheduled')}</span></div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-600"></div><span>{t('calendarAttended')}</span></div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-600"></div><span>{t('calendarMissed')}</span></div>
                </div>
            )}
        </div>
    );
};

export default AttendanceCalendar;