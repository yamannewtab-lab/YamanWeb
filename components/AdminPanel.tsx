import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { TIME_SLOTS, MAIN_TIME_BLOCKS, PATH_TRANSLATION_KEYS } from '../constants';
import AttendanceCalendar from './AttendanceCalendar';

interface Visitor {
    country: string;
    city: string | null;
}

interface GroupedVisitors {
    [country: string]: {
        cities: (string | null)[];
        count: number;
    };
}

interface Feedback {
    message: string;
}

interface RawApproval {
    id: number;
    name: string;
    application_type: 'Ijazah' | 'Tasmi' | 'Tajwid';
    requested_slots: string;
    application_data: string;
    status: 'pending' | 'approved' | 'rejected';
}

interface ProcessedApproval {
    id: number;
    name: string;
    type: 'Ijazah' | 'Tasmi' | 'Tajwid';
    slots: { time_slot: string; day_number: number }[];
    data: any;
}

interface BookedSlot {
    time_slot: string;
    day_number: number;
}

interface GroupedBookings {
    [time_slot: string]: number[]; // array of day numbers
}

interface PaymentRecord {
    id: number;
    name: string;
    paid_state: string;
    last_paid: string | null;
    next_paid: string | null;
}

interface ChatMessage {
    id: number;
    created_at: string;
    session_id: string;
    sender_name: string;
    message: string;
}

interface ChatSession {
    session_id: string;
    created_at: string;
}

interface ApprovedStudent {
    name: string;
    selected_days: string;
}

interface AdminPanelProps {
    onClose: () => void;
    t: (key: string) => string;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onClose, t }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [authError, setAuthError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'visitors' | 'feedbacks' | 'approvals' | 'payments' | 'settings' | 'bookedSeats' | 'chats' | 'calendars'>('visitors');

    const [visitors, setVisitors] = useState<GroupedVisitors>({});
    const [visitorsLoading, setVisitorsLoading] = useState(true);
    const [visitorsError, setVisitorsError] = useState<string | null>(null);

    const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
    const [feedbacksLoading, setFeedbacksLoading] = useState(true);
    const [feedbacksError, setFeedbacksError] = useState<string | null>(null);
    
    const [approvals, setApprovals] = useState<ProcessedApproval[]>([]);
    const [approvalsLoading, setApprovalsLoading] = useState(true);
    const [approvalsError, setApprovalsError] = useState<string | null>(null);
    const [processingId, setProcessingId] = useState<number | null>(null);
    
    const [bookedSeats, setBookedSeats] = useState<GroupedBookings>({});
    const [bookedSeatsLoading, setBookedSeatsLoading] = useState(true);
    const [bookedSeatsError, setBookedSeatsError] = useState<string | null>(null);
    
    const [payments, setPayments] = useState<PaymentRecord[]>([]);
    const [paymentsLoading, setPaymentsLoading] = useState(true);
    const [paymentsError, setPaymentsError] = useState<string | null>(null);

    const [isTestMode, setIsTestMode] = useState<boolean>((window as any).maqraatIsTestMode || false);
    
    const [approvalForLink, setApprovalForLink] = useState<ProcessedApproval | null>(null);
    const [zoomLinkInput, setZoomLinkInput] = useState('');

    // Chat states
    const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
    const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [adminMessage, setAdminMessage] = useState('');
    const [chatsLoading, setChatsLoading] = useState(true);
    const [chatsError, setChatsError] = useState<string | null>(null);
    const chatMessagesEndRef = useRef<null | HTMLDivElement>(null);
    
    // Calendar states
    const [approvedStudents, setApprovedStudents] = useState<ApprovedStudent[]>([]);
    const [selectedStudent, setSelectedStudent] = useState<ApprovedStudent | null>(null);
    const [calendarDate, setCalendarDate] = useState(new Date());
    const [studentAttendance, setStudentAttendance] = useState<{ [day: string]: 'attended' | 'missed' }>({});
    const [calendarLoading, setCalendarLoading] = useState(false);

    const dayStringToNumber = (day: string): number => {
        const map: { [key: string]: number } = {
            'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3,
            'Thursday': 4, 'Friday': 5, 'Saturday': 6
        };
        return map[day.trim()] ?? -1;
    };

    const fetchApprovals = async () => {
        setApprovalsLoading(true);
        setApprovalsError(null);
        const { data, error } = await supabase
            .from('approvals')
            .select('id, name, application_type, requested_slots, application_data')
            .eq('status', 'pending');
        
        if (error) {
            console.error("Error fetching approvals:", error.message);
            setApprovalsError("Failed to fetch approval data.");
        } else {
             const processed = (data as RawApproval[] || []).map(raw => {
                try {
                    if (!raw.requested_slots || !raw.application_data) {
                        throw new Error(`Missing data for approval ID ${raw.id}`);
                    }
                    return {
                        id: raw.id,
                        name: raw.name,
                        type: raw.application_type,
                        slots: JSON.parse(raw.requested_slots),
                        data: JSON.parse(raw.application_data),
                    };
                } catch (e) {
                    console.error("Failed to parse approval data:", e, raw);
                    return null;
                }
            }).filter((item): item is ProcessedApproval => item !== null);
            setApprovals(processed);
        }
        setApprovalsLoading(false);
    };
    
    const fetchBookedSeats = async () => {
        setBookedSeatsLoading(true);
        setBookedSeatsError(null);
        const { data, error } = await supabase
            .from('booking')
            .select('time_slot, day_number')
            .eq('is_booked', true);

        if (error) {
            setBookedSeatsError("Failed to fetch booked seats data.");
        } else if (data) {
            const grouped = (data as BookedSlot[]).reduce((acc: GroupedBookings, slot) => {
                if (!acc[slot.time_slot]) {
                    acc[slot.time_slot] = [];
                }
                acc[slot.time_slot].push(slot.day_number);
                acc[slot.time_slot].sort((a, b) => a - b);
                return acc;
            }, {});
            setBookedSeats(grouped);
        }
        setBookedSeatsLoading(false);
    };
    
    const fetchPayments = async () => {
        setPaymentsLoading(true);
        setPaymentsError(null);
        const { data, error } = await supabase
            .from('passcodes')
            .select('id, name, paid_state, last_paid, next_paid')
            .not('date_approved', 'is', null)
            .order('name');
        
        if (error) {
            console.error("Error fetching payments:", error.message);
            setPaymentsError("Failed to fetch payment data.");
        } else {
            setPayments(data as PaymentRecord[] || []);
        }
        setPaymentsLoading(false);
    };

    const fetchChatSessions = async () => {
        setChatsLoading(true);
        setChatsError(null);
        const { data, error } = await supabase.from('chat_messages').select('session_id, created_at').order('created_at', { ascending: false });
        if (error) {
            setChatsError("Failed to fetch chat sessions.");
            console.error(error);
        } else if (data) {
            const uniqueSessions = [...new Map((data as ChatSession[]).map(item => [item.session_id, item])).values()];
            setChatSessions(uniqueSessions);
        }
        setChatsLoading(false);
    };
    
    useEffect(() => {
        if (!isAuthenticated) return;

        if (activeTab === 'visitors') {
            const fetchVisitors = async () => {
                setVisitorsLoading(true);
                setVisitorsError(null);
                const { data, error } = await supabase
                    .from('visitors')
                    .select('country, city');

                if (error) {
                    setVisitorsError("Failed to fetch visitor data.");
                } else if (data) {
                    const grouped = data.reduce((acc: GroupedVisitors, visitor: Visitor) => {
                        const country = visitor.country || "Unknown";
                        if (!acc[country]) acc[country] = { cities: [], count: 0 };
                        if (visitor.city) acc[country].cities.push(visitor.city);
                        acc[country].count += 1;
                        return acc;
                    }, {});
                    Object.keys(grouped).forEach(k => { grouped[k].cities = [...new Set(grouped[k].cities)]; });
                    setVisitors(grouped);
                }
                setVisitorsLoading(false);
            };
            fetchVisitors();
        } else if (activeTab === 'feedbacks') {
            const fetchFeedbacks = async () => {
                setFeedbacksLoading(true);
                setFeedbacksError(null);
                const { data, error } = await supabase.from('feedbacks').select('message').order('id', { ascending: false });
                if (error) setFeedbacksError("Failed to fetch feedback data.");
                else setFeedbacks(data || []);
                setFeedbacksLoading(false);
            };
            fetchFeedbacks();
        } else if (activeTab === 'approvals') {
            fetchApprovals();
        } else if (activeTab === 'payments') {
            fetchPayments();
        } else if (activeTab === 'bookedSeats') {
            fetchBookedSeats();
        } else if (activeTab === 'chats') {
            fetchChatSessions();
        } else if (activeTab === 'calendars') {
            const fetchStudents = async () => {
                setCalendarLoading(true);
                const { data, error } = await supabase
                    .from('passcodes')
                    .select('name, selected_days')
                    .not('date_approved', 'is', null)
                    .order('name');
                if (error) console.error("Error fetching students:", error);
                else setApprovedStudents(data as ApprovedStudent[] || []);
                setCalendarLoading(false);
            };
            fetchStudents();
        }
    }, [isAuthenticated, activeTab]);

    // Real-time listener for new chat sessions
    useEffect(() => {
        if (isAuthenticated && activeTab === 'chats') {
            const chatListener = supabase.channel('public-chat-messages-listener')
                .on(
                    'postgres_changes',
                    { event: 'INSERT', schema: 'public', table: 'chat_messages' },
                    (payload) => {
                        const newMessage = payload.new as ChatMessage;
                        setChatSessions(currentSessions => {
                             const existingSessionIndex = currentSessions.findIndex(s => s.session_id === newMessage.session_id);
                             const filteredSessions = existingSessionIndex > -1
                                 ? currentSessions.filter((_, index) => index !== existingSessionIndex)
                                 : currentSessions;

                             const updatedSession = { session_id: newMessage.session_id, created_at: newMessage.created_at };
                             return [updatedSession, ...filteredSessions];
                        });
                    }
                ).subscribe();

            return () => {
                supabase.removeChannel(chatListener);
            };
        }
    }, [isAuthenticated, activeTab]);
    
    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    // Effect for real-time chat messages
    useEffect(() => {
        if (!selectedSessionId) return;

        const fetchMessages = async () => {
            const { data, error } = await supabase
                .from('chat_messages')
                .select('*')
                .eq('session_id', selectedSessionId)
                .order('created_at', { ascending: true });
            if (error) {
                console.error("Error fetching chat messages:", error);
                setChatsError("Failed to load messages.");
            } else {
                setChatMessages(data || []);
            }
        };
        fetchMessages();

        const channel = supabase.channel(`chat_${selectedSessionId}`);
        const subscription = channel
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `session_id=eq.${selectedSessionId}` },
                (payload) => {
                    const newMessage = payload.new as ChatMessage;
                    setChatMessages(currentMessages => {
                        if (currentMessages.some(m => m.id === newMessage.id)) {
                            return currentMessages;
                        }
                        return [...currentMessages, newMessage];
                    });
                }
            )
            .subscribe();
            
        const intervalId = setInterval(fetchMessages, 2000);

        return () => { 
            clearInterval(intervalId);
            supabase.removeChannel(channel); 
        };
    }, [selectedSessionId]);

    useEffect(() => {
        chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages]);

    // Effect for fetching student attendance
    useEffect(() => {
        if (!selectedStudent) return;
        const fetchAttendance = async () => {
            setCalendarLoading(true);
            const year = calendarDate.getFullYear();
            const month = calendarDate.getMonth() + 1;
            const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
            const endDate = `${year}-${String(month).padStart(2, '0')}-${new Date(year, month, 0).getDate()}`;
            const { data, error } = await supabase.from('attendance').select('session_date, status').eq('student_name', selectedStudent.name).gte('session_date', startDate).lte('session_date', endDate);
            if (error) console.error("Error fetching attendance:", error);
            else {
                const formattedData = data.reduce((acc: any, record: any) => {
                    acc[record.session_date] = record.status;
                    return acc;
                }, {});
                setStudentAttendance(formattedData);
            }
            setCalendarLoading(false);
        };
        fetchAttendance();
    }, [selectedStudent, calendarDate]);


    const handlePasswordSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === 'yaman321') setIsAuthenticated(true);
        else { setAuthError('Incorrect password.'); setPassword(''); }
    };

    const handleReject = async (approvalId: number) => {
        setProcessingId(approvalId);
        const { error } = await supabase.from('approvals').delete().eq('id', approvalId);
        if (error) {
            alert(`Failed to reject: ${error.message}`);
        } else {
            setApprovals(current => current.filter(a => a.id !== approvalId));
        }
        setProcessingId(null);
    };
    
    const handleApproveClick = (approval: ProcessedApproval) => {
        setZoomLinkInput('');
        setApprovalForLink(approval);
    };

    const handleCancelApproval = () => {
        setApprovalForLink(null);
        setZoomLinkInput('');
    };

    const handleConfirmApproval = async () => {
        if (!approvalForLink) return;
        setProcessingId(approvalForLink.id);
        
        try {
            // Handle Tasmi separately as it has no booking/passcode logic
            if (approvalForLink.type === 'Tasmi') {
                const { error: updateError } = await supabase.from('approvals').update({ status: 'approved' }).eq('id', approvalForLink.id);
                if (updateError) throw updateError;
                alert('Tasmi request approved and removed from list.');
                setApprovals(current => current.filter(a => a.id !== approvalForLink.id));
                // Cleanup state after handling
                setProcessingId(null);
                handleCancelApproval();
                return;
            }

            // For Ijazah and Tajwid, proceed with booking and account linking
            if (!zoomLinkInput || zoomLinkInput.trim() === '') {
                throw new Error('Please provide a valid Zoom link.');
            }

            // CRITICAL FIX: Check for accountName and throw a clear error if missing
            const studentAccountName = approvalForLink.data?.accountName;
            if (!studentAccountName) {
                throw new Error(`Critical error: 'accountName' is missing from application data for '${approvalForLink.name}'. This application cannot be auto-approved and must be handled manually.`);
            }

            // Fetch the student's record from the passcodes table using their account name.
            const { data: passcodeData, error: passcodeFetchError } = await supabase
                .from('passcodes')
                .select('*')
                .eq('name', studentAccountName)
                .limit(1)
                .single();

            if (passcodeFetchError || !passcodeData) {
                const errorMsg = passcodeFetchError ? passcodeFetchError.message : "No matching student account found.";
                throw new Error(`Could not find the student account for "${studentAccountName}". Please ensure the account was created successfully. Error: ${errorMsg}`);
            }

            // Book the slots in the 'booking' table
            if (approvalForLink.slots && approvalForLink.slots.length > 0) {
                const bookingsToInsert = approvalForLink.slots.map(slot => ({
                    time_slot: slot.time_slot,
                    day_number: slot.day_number,
                    is_booked: true
                }));
                const { error: bookingError } = await supabase.from('booking').insert(bookingsToInsert);
                if (bookingError) throw new Error(`Failed to book slots: ${bookingError.message}`);
            }

            // Insert the zoom link into the 'links' table
            const { error: linkInsertError } = await supabase.from('links').insert([{
                name: approvalForLink.name, // Use student's full name for display
                passcode: passcodeData.code,
                zoom_link: zoomLinkInput.trim()
            }]);
            if (linkInsertError) throw new Error(`Failed to store Zoom link: ${linkInsertError.message}`);
            
            // Update the student's record in 'passcodes' to mark as approved
            const { error: passcodeUpdateError } = await supabase.from('passcodes').update({
                date_approved: new Date().toISOString(),
                paid_state: 'unpaid',
            }).eq('id', passcodeData.id);
            if (passcodeUpdateError) throw new Error(`Could not update student's approval status: ${passcodeUpdateError.message}. Please check manually.`);

            // Finally, update the approval request to 'approved' status
            const { error: approvalUpdateError } = await supabase.from('approvals').update({ status: 'approved' }).eq('id', approvalForLink.id);
            if (approvalUpdateError) throw new Error(`Failed to update approval status: ${approvalUpdateError.message}`);
            
            alert('Application approved, slots booked, and Zoom link stored successfully!');
            setApprovals(current => current.filter(a => a.id !== approvalForLink.id));

        } catch (error: any) {
            alert(`Approval failed: ${error.message}`);
        } finally {
            setProcessingId(null);
            handleCancelApproval();
        }
    };
    
     const handleMarkAsPaid = async (passcodeId: number) => {
        setProcessingId(passcodeId);
        try {
            const lastPaidDate = new Date();
            const nextPaidDate = new Date(lastPaidDate);
            nextPaidDate.setMonth(nextPaidDate.getMonth() + 1);

            const { error } = await supabase
                .from('passcodes')
                .update({
                    paid_state: 'PAID',
                    last_paid: lastPaidDate.toISOString(),
                    next_paid: nextPaidDate.toISOString()
                })
                .eq('id', passcodeId);

            if (error) throw error;
            
            await fetchPayments();
        } catch (error: any) {
            alert(`Failed to mark as paid: ${error.message}`);
        } finally {
            setProcessingId(null);
        }
    };

     const handleSendAdminMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!adminMessage.trim() || !selectedSessionId) return;

        const { error } = await supabase
            .from('chat_messages')
            .insert([{
                session_id: selectedSessionId,
                sender_name: 'Admin',
                message: adminMessage.trim(),
            }]);

        if (error) {
            console.error("Error sending admin message:", error);
            alert("Failed to send message.");
        } else {
            setAdminMessage('');
        }
    };

    const handleCalendarDayClick = async (day: number, currentStatus: 'scheduled' | 'attended' | 'missed') => {
        if (!selectedStudent) return;
        const dateString = `${calendarDate.getFullYear()}-${String(calendarDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        let nextStatus: 'attended' | 'missed' | 'scheduled' = 'attended';
        if (currentStatus === 'scheduled') nextStatus = 'attended';
        else if (currentStatus === 'attended') nextStatus = 'missed';
        else if (currentStatus === 'missed') nextStatus = 'scheduled';
        
        setCalendarLoading(true);
        try {
            if (nextStatus === 'scheduled') {
                const { error } = await supabase.from('attendance').delete().match({ student_name: selectedStudent.name, session_date: dateString });
                if (error) throw error;
                setStudentAttendance(prev => {
                    const updated = { ...prev };
                    delete updated[dateString];
                    return updated;
                });
            } else {
                const { data, error } = await supabase.from('attendance').upsert({ student_name: selectedStudent.name, session_date: dateString, status: nextStatus }, { onConflict: 'student_name, session_date' }).select();
                if (error) throw error;
                if (data) setStudentAttendance(prev => ({ ...prev, [dateString]: data[0].status }));
            }
        } catch (error: any) {
            alert(`Failed to update attendance: ${error.message}`);
        } finally {
            setCalendarLoading(false);
        }
    };

    const handleMonthChange = (offset: number) => {
        setCalendarDate(prev => {
            const newDate = new Date(prev);
            newDate.setDate(1);
            newDate.setMonth(newDate.getMonth() + offset);
            return newDate;
        });
    };

    const getTabClassName = (tabName: string) => `px-4 py-2 text-sm font-medium rounded-t-md transition-colors focus:outline-none ${activeTab === tabName ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-700/50 hover:text-gray-200'}`;
    const dayNumberToString = (num: number) => ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][num];
    const timeSlotToKey = (slotId: string): string => {
        for (const block of Object.values(TIME_SLOTS)) {
            const found = block.find(s => s.id === slotId);
            if (found) return found.key;
        }
        return slotId;
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="admin-panel-title">
            <div className="bg-gray-800 rounded-lg shadow-xl p-6 max-w-2xl w-full text-gray-200 max-h-[80vh] flex flex-col relative" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-600">
                    <h2 id="admin-panel-title" className="text-2xl font-bold">Admin Panel</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-700 transition-colors -m-2" aria-label="Close admin panel"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path></svg></button>
                </div>

                {!isAuthenticated ? (
                    <div className="p-4"><h3 className="text-lg font-semibold mb-4 text-center">Authentication Required</h3><form onSubmit={handlePasswordSubmit} className="space-y-4"><div><label htmlFor="password-input" className="sr-only">Password</label><input id="password-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter password" autoFocus className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-amber-500 focus:border-amber-500 text-gray-200"/></div>{authError && <p className="text-red-400 text-sm text-center">{authError}</p>}<button type="submit" className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50" disabled={!password}>Unlock</button></form></div>
                ) : (
                    <>
                        <div className="flex flex-wrap border-b border-gray-600 -mt-4 -mx-6 px-6">
                            <button onClick={() => setActiveTab('visitors')} className={getTabClassName('visitors')}>Visitors</button>
                            <button onClick={() => setActiveTab('feedbacks')} className={getTabClassName('feedbacks')}>Feedbacks</button>
                            <button onClick={() => setActiveTab('approvals')} className={getTabClassName('approvals')}>Approvals</button>
                            <button onClick={() => setActiveTab('payments')} className={getTabClassName('payments')}>{t('adminTabPayments')}</button>
                            <button onClick={() => setActiveTab('bookedSeats')} className={getTabClassName('bookedSeats')}>{t('adminTabBookedSeats')}</button>
                            <button onClick={() => setActiveTab('chats')} className={getTabClassName('chats')}>{t('adminChatTab')}</button>
                            <button onClick={() => setActiveTab('calendars')} className={getTabClassName('calendars')}>{t('adminTabCalendars')}</button>
                            <button onClick={() => setActiveTab('settings')} className={getTabClassName('settings')}>Settings</button>
                        </div>

                        <div className="overflow-y-auto custom-scrollbar flex-grow -mx-6 px-6 pt-4">
                            {activeTab === 'visitors' && (
                                <div>
                                    {visitorsLoading ? <p>Loading visitors...</p> : visitorsError ? <p className="text-red-400">{visitorsError}</p> :
                                    <div className="space-y-2">
                                        {Object.entries(visitors).sort(([, a], [, b]) => b.count - a.count).map(([country, data]) => (
                                            <details key={country} className="bg-gray-700/50 rounded-lg"><summary className="p-2 cursor-pointer font-semibold">{country} ({data.count})</summary><div className="p-2 border-t border-gray-600 text-sm">{data.cities.join(', ')}</div></details>
                                        ))}
                                    </div>}
                                </div>
                            )}

                            {activeTab === 'feedbacks' && (
                                <div>
                                    {feedbacksLoading ? <p>Loading feedback...</p> : feedbacksError ? <p className="text-red-400">{feedbacksError}</p> :
                                    <div className="space-y-2">
                                        {feedbacks.map((fb, i) => <div key={i} className="bg-gray-700/50 p-3 rounded-lg text-sm whitespace-pre-wrap">{fb.message}</div>)}
                                    </div>}
                                </div>
                            )}

                             {activeTab === 'approvals' && (
                                <div>
                                    {approvalsLoading ? <p>Loading approvals...</p> : approvalsError ? <p className="text-red-400">{approvalsError}</p> :
                                    <div className="space-y-4">
                                        {approvals.length === 0 ? <p className="text-gray-400 text-center py-4">No pending approvals.</p> : approvals.map(approval => (
                                            <details key={approval.id} className="bg-gray-700/50 rounded-lg overflow-hidden"><summary className="p-3 cursor-pointer flex justify-between items-center"><span className="font-semibold">{approval.name} <span className="text-xs font-normal text-gray-400 ml-2">({approval.type})</span></span><span className="text-xs text-amber-400">View Details</span></summary>
                                            <div className="p-3 border-t border-gray-600 text-sm space-y-2">
                                                {approval.data.accountName && <p><strong className="text-gray-400">Account:</strong> {approval.data.accountName}</p>}
                                                {Object.entries(approval.data.fullDetails || approval.data).map(([key, value]) => <p key={key}><strong className="text-gray-400 capitalize">{key.replace(/([A-Z])/g, ' $1')}:</strong> {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : (Array.isArray(value) ? value.join(', ') : String(value))}</p>)}
                                                <div className="flex gap-2 pt-2">
                                                    <button onClick={() => handleApproveClick(approval)} disabled={processingId === approval.id} className="w-full bg-green-600 text-white font-bold py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-green-800">Approve</button>
                                                    <button onClick={() => handleReject(approval.id)} disabled={processingId === approval.id} className="w-full bg-red-600 text-white font-bold py-2 px-4 rounded-md hover:bg-red-700 disabled:bg-red-800">Reject</button>
                                                </div>
                                            </div></details>
                                        ))}
                                    </div>}
                                </div>
                            )}
                            
                             {activeTab === 'payments' && (
                                <div>
                                    {paymentsLoading ? <p>Loading payments...</p> : paymentsError ? <p className="text-red-400">{paymentsError}</p> :
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-gray-700"><tr className="text-gray-300">
                                            <th className="p-2">Name</th><th className="p-2">Status</th><th className="p-2">Next Payment</th><th className="p-2">Action</th>
                                        </tr></thead>
                                        <tbody>{payments.map(p => (
                                            <tr key={p.id} className="border-b border-gray-700">
                                                <td className="p-2">{p.name}</td>
                                                <td className={`p-2 font-semibold ${p.paid_state === 'PAID' ? 'text-green-400' : 'text-red-400'}`}>{p.paid_state}</td>
                                                <td className="p-2">{p.next_paid ? new Date(p.next_paid).toLocaleDateString() : 'N/A'}</td>
                                                <td className="p-2">{p.paid_state !== 'PAID' && <button onClick={() => handleMarkAsPaid(p.id)} disabled={processingId === p.id} className="bg-blue-600 text-white font-semibold py-1 px-2 rounded-md hover:bg-blue-700 text-xs">{t('markAsPaid')}</button>}</td>
                                            </tr>))}
                                        </tbody>
                                    </table>}
                                </div>
                            )}

                             {activeTab === 'bookedSeats' && (
                                <div>
                                    {bookedSeatsLoading ? <p>Loading...</p> : bookedSeatsError ? <p className="text-red-400">{bookedSeatsError}</p> :
                                    <div className="space-y-2">
                                        {Object.entries(bookedSeats).map(([timeSlot, days]) => (
                                            <div key={timeSlot} className="bg-gray-700/50 p-2 rounded-lg text-sm">
                                                <p className="font-semibold">{t(timeSlotToKey(timeSlot))}</p>
                                                <p className="text-xs text-gray-400">{days.map(dayNumberToString).join(', ')}</p>
                                            </div>
                                        ))}
                                    </div>}
                                </div>
                            )}

                             {activeTab === 'chats' && (
                                <div className="flex h-full -mx-6">
                                    <div className="w-1/3 border-r border-gray-600 overflow-y-auto custom-scrollbar">
                                        {chatsLoading ? <p className="p-2">Loading...</p> : chatsError ? <p className="p-2 text-red-400">{chatsError}</p> :
                                        chatSessions.map(session => (
                                            <button key={session.session_id} onClick={() => setSelectedSessionId(session.session_id)} className={`w-full text-left p-2 text-sm ${selectedSessionId === session.session_id ? 'bg-amber-600/50' : 'hover:bg-gray-700/50'}`}>
                                                <p className="font-semibold truncate">{session.session_id}</p>
                                                <p className="text-xs text-gray-400">{new Date(session.created_at).toLocaleString()}</p>
                                            </button>
                                        ))}
                                    </div>
                                    <div className="w-2/3 flex flex-col pl-2">
                                        <div className="flex-grow overflow-y-auto custom-scrollbar space-y-3 p-2">
                                            {selectedSessionId ? chatMessages.map(msg => (
                                                <div key={msg.id} className={`p-2 rounded-lg max-w-[80%] ${msg.sender_name === 'Admin' ? 'bg-gray-600 self-end ml-auto' : 'bg-blue-800/80 self-start mr-auto'}`}>
                                                    <p className="text-xs font-bold text-gray-300">{msg.sender_name}</p>
                                                    <p className="text-sm">{msg.message}</p>
                                                </div>
                                            )) : <p className="text-center text-gray-400">Select a session to view messages.</p>}
                                            <div ref={chatMessagesEndRef} />
                                        </div>
                                        {selectedSessionId && <form onSubmit={handleSendAdminMessage} className="flex gap-2 p-2 border-t border-gray-600"><input type="text" value={adminMessage} onChange={(e) => setAdminMessage(e.target.value)} placeholder="Type a message..." className="flex-grow bg-gray-600 rounded-full px-3 py-1 text-sm focus:outline-none" /><button type="submit" className="bg-amber-500 rounded-full p-2 text-white">Send</button></form>}
                                    </div>
                                </div>
                            )}

                             {activeTab === 'calendars' && (
                                <div className="space-y-4">
                                    <select onChange={(e) => setSelectedStudent(approvedStudents.find(s => s.name === e.target.value) || null)} className="w-full bg-gray-700 p-2 rounded-md">
                                        <option>Select a student</option>
                                        {approvedStudents.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                                    </select>
                                    {selectedStudent && (
                                        <div>
                                            <div className="flex justify-between items-center mb-2">
                                                <button onClick={() => handleMonthChange(-1)}>&lt;</button>
                                                <span>{calendarDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
                                                <button onClick={() => handleMonthChange(1)}>&gt;</button>
                                            </div>
                                            {calendarLoading ? <p>Loading attendance...</p> : 
                                                <AttendanceCalendar
                                                    year={calendarDate.getFullYear()} month={calendarDate.getMonth()}
                                                    scheduledDays={selectedStudent.selected_days.split(',').map(dayStringToNumber)}
                                                    attendanceData={studentAttendance}
                                                    isEditable={true} onDayClick={handleCalendarDayClick} t={t}
                                                />
                                            }
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'settings' && (
                                <div className="space-y-4">
                                    <div className="bg-gray-700/50 p-3 rounded-lg flex justify-between items-center">
                                        <label htmlFor="test-mode-toggle" className="font-semibold">Enable Test Mode</label>
                                        <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                                            <input type="checkbox" name="toggle" id="test-mode-toggle" checked={isTestMode} onChange={(e) => { const checked = e.target.checked; setIsTestMode(checked); (window as any).maqraatIsTestMode = checked; }} className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"/>
                                            <label htmlFor="test-mode-toggle" className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-500 cursor-pointer"></label>
                                        </div>
                                    </div>
                                    <style>{`.toggle-checkbox:checked { right: 0; border-color: #48bb78; } .toggle-checkbox:checked + .toggle-label { background-color: #48bb78; }`}</style>
                                    <p className="text-xs text-gray-400">When enabled, all Discord notifications will be sent to a test channel.</p>
                                </div>
                            )}
                        </div>
                    </>
                )}

                {approvalForLink && (
                    <div className="absolute inset-0 bg-black/80 flex items-center justify-center" onClick={handleCancelApproval}>
                        <div className="bg-gray-800 border border-gray-600 rounded-lg p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
                            <h3 className="text-lg font-bold mb-4">Approve: {approvalForLink.name}</h3>
                            <p className="text-sm text-gray-400 mb-4">Enter the Zoom meeting link for this student.</p>
                            <input type="url" value={zoomLinkInput} onChange={e => setZoomLinkInput(e.target.value)} placeholder="https://zoom.us/..." autoFocus className="w-full bg-gray-700 p-2 rounded-md mb-4"/>
                            <div className="flex gap-2">
                                <button onClick={handleConfirmApproval} disabled={!zoomLinkInput.trim() || processingId === approvalForLink.id} className="w-full bg-green-600 text-white font-bold py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50">Confirm Approval</button>
                                <button onClick={handleCancelApproval} className="w-full bg-gray-600 text-white font-bold py-2 px-4 rounded-md hover:bg-gray-700">Cancel</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminPanel;
