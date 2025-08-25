import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { TIME_SLOTS, MAIN_TIME_BLOCKS, PATH_TRANSLATION_KEYS } from '../constants';

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

interface AdminPanelProps {
    onClose: () => void;
    t: (key: string) => string;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onClose, t }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [authError, setAuthError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'visitors' | 'feedbacks' | 'approvals' | 'payments' | 'settings' | 'bookedSeats'>('visitors');

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
        }
    }, [isAuthenticated, activeTab]);
    
    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

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
            if (zoomLinkInput && zoomLinkInput.trim() !== '') {
                 // 1. Book the requested slots in the 'booking' table.
                if (approvalForLink.slots && approvalForLink.slots.length > 0) {
                    const bookingsToInsert = approvalForLink.slots.map(slot => ({
                        time_slot: slot.time_slot,
                        day_number: slot.day_number,
                        is_booked: true
                    }));

                    const { error: bookingError } = await supabase
                        .from('booking')
                        .insert(bookingsToInsert);

                    if (bookingError) {
                        throw new Error(`Failed to book the required slots: ${bookingError.message}`);
                    }
                }
                
                // Fetch passcode
                const { data: passcodeData, error: passcodeFetchError } = await supabase
                    .from('passcodes')
                    .select('code')
                    .eq('name', approvalForLink.name)
                    .limit(1)
                    .single();

                if (passcodeFetchError || !passcodeData) {
                    throw new Error(`Could not fetch passcode for ${approvalForLink.name}. Error: ${passcodeFetchError?.message}`);
                }

                // Insert into links table
                const { error: linkInsertError } = await supabase
                    .from('links')
                    .insert([{
                        name: approvalForLink.name,
                        passcode: passcodeData.code,
                        zoom_link: zoomLinkInput.trim()
                    }]);
                
                if (linkInsertError) {
                    throw new Error(`Failed to store Zoom link: ${linkInsertError.message}`);
                }

                // Update the student's record in 'passcodes' to mark as approved.
                const { error: passcodeUpdateError } = await supabase
                    .from('passcodes')
                    .update({ 
                        date_approved: new Date().toISOString(),
                        paid_state: 'unpaid',
                    })
                    .eq('name', approvalForLink.name);

                if (passcodeUpdateError) {
                    console.error(`CRITICAL: Failed to update passcode for ${approvalForLink.name}.`, passcodeUpdateError.message);
                    throw new Error(`Could not update passcode status: ${passcodeUpdateError.message}. Please check manually.`);
                }

                // Update the approval request status to 'approved'.
                const { error: updateError } = await supabase.from('approvals').update({ status: 'approved' }).eq('id', approvalForLink.id);
                if (updateError) throw new Error(`Failed to update approval status: ${updateError.message}`);
                
                alert('Application approved, slots booked, and Zoom link stored successfully!');
                setApprovals(current => current.filter(a => a.id !== approvalForLink.id));
                handleCancelApproval();
            } else {
                alert('Please provide a valid Zoom link.');
            }
        } catch (error: any) {
            alert(`Approval failed: ${error.message}`);
            fetchApprovals();
        } finally {
            setProcessingId(null);
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
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-700 transition-colors -m-2" aria-label="Close admin panel"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path></svg></button>
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
                            <button onClick={() => setActiveTab('settings')} className={getTabClassName('settings')}>Settings</button>
                        </div>
                        <div className="overflow-y-auto custom-scrollbar pr-2 mt-4 flex-grow">
                            {activeTab === 'visitors' && (<div>{visitorsLoading ? <p>Loading visitors...</p> : visitorsError ? <p className="text-red-400">{visitorsError}</p> : <ul className="space-y-2">{Object.entries(visitors).sort((a,b) => b[1].count - a[1].count).map(([country, data]) => (<li key={country} className="bg-gray-700 rounded-md"><details><summary className="p-3 cursor-pointer flex justify-between items-center font-semibold list-none"><span>{country}</span><span className="text-sm bg-gray-600 px-2 py-0.5 rounded-full">{data.count}</span></summary><div className="p-3 border-t border-gray-600">{data.cities.length > 0 ? <ul className="list-disc list-inside pl-2 space-y-1 text-gray-300">{data.cities.sort().map((city, index) => city && <li key={index}>{city}</li>)}</ul> : <p className="text-gray-400 italic">No city data.</p>}</div></details></li>))}</ul>}</div>)}
                            {activeTab === 'feedbacks' && (<div>{feedbacksLoading ? <p>Loading feedbacks...</p> : feedbacksError ? <p className="text-red-400">{feedbacksError}</p> : <ul className="space-y-3">{feedbacks.map((fb, index) => (<li key={index} className="bg-gray-700 p-4 rounded-md shadow"><p className="text-gray-300 whitespace-pre-wrap">{fb.message}</p></li>))}</ul>}</div>)}
                            {activeTab === 'approvals' && (<div>{approvalsLoading ? <p>Loading approvals...</p> : approvalsError ? <p className="text-red-400">{approvalsError}</p> : approvals.length === 0 ? <p>No pending approvals.</p> : <ul className="space-y-3">{approvals.map(approval => {
                                const selectedDays = approval.data?.fullDetails?.selectedDays || approval.data?.selectedDays;
                                return (
                                <li key={approval.id} className="bg-gray-700/80 p-4 rounded-lg">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="font-bold text-lg">{approval.name}</h4>
                                            <p className="text-sm text-amber-400">{approval.type} Application</p>
                                        </div>
                                        <div className="flex gap-2">{<button onClick={() => handleApproveClick(approval)} disabled={processingId===approval.id} className="bg-green-600 text-white px-3 py-1 rounded-md text-sm font-semibold hover:bg-green-500 disabled:bg-gray-500">Approve</button>}<button onClick={() => handleReject(approval.id)} disabled={processingId===approval.id} className="bg-red-600 text-white px-3 py-1 rounded-md text-sm font-semibold hover:bg-red-500 disabled:bg-gray-500">Reject</button></div>
                                    </div>
                                    <div className="mt-3 border-t border-gray-600 pt-3">
                                        {selectedDays && Array.isArray(selectedDays) && selectedDays.length > 0 && (
                                            <div className="mb-3">
                                                <p className="font-semibold text-gray-300 text-sm mb-1">selected_weekly:</p>
                                                <p className="text-sm text-gray-200">{selectedDays.map((day:string) => t(`day${day}`)).join(' - ')}</p>
                                            </div>
                                        )}
                                        <p className="font-semibold text-gray-300 text-sm mb-1">Requested Slots:</p>
                                        <ul className="list-disc list-inside pl-2 space-y-1 text-sm">{approval.slots?.map((slot, i) => (<li key={i}>{t('day' + dayNumberToString(slot.day_number))} @ {t(timeSlotToKey(slot.time_slot))}</li>))}</ul>
                                    </div>
                                    <details className="mt-3"><summary className="cursor-pointer text-sm text-gray-400 hover:text-white">View Full Details</summary><pre className="mt-2 p-2 bg-gray-900 rounded-md text-xs overflow-x-auto custom-scrollbar"><code>{JSON.stringify(approval.data, null, 2)}</code></pre></details>
                                </li>
                                )
                            })}</ul>}</div>)}
                             {activeTab === 'payments' && (
                                <div>
                                    {paymentsLoading ? <p>Loading payments...</p> :
                                    paymentsError ? <p className="text-red-400">{paymentsError}</p> :
                                    payments.length === 0 ? <p>No approved students found.</p> :
                                    <ul className="space-y-3">
                                        {payments.map(payment => (
                                            <li key={payment.id} className="bg-gray-700/80 p-4 rounded-lg">
                                                <div className="flex justify-between items-center">
                                                    <h4 className="font-bold text-lg">{payment.name}</h4>
                                                    {payment.paid_state === 'PAID' ? (
                                                        <span className="text-sm bg-green-600 px-3 py-1 rounded-full font-semibold">{t('statusPaid')}</span>
                                                    ) : (
                                                        <button 
                                                            onClick={() => handleMarkAsPaid(payment.id)} 
                                                            disabled={processingId === payment.id}
                                                            className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm font-semibold hover:bg-blue-500 disabled:bg-gray-500"
                                                        >
                                                            {t('markAsPaid')}
                                                        </button>
                                                    )}
                                                </div>
                                                <div className="mt-3 border-t border-gray-600 pt-3 text-sm text-gray-400">
                                                    {payment.paid_state === 'PAID' && payment.last_paid && payment.next_paid ? (
                                                        <div>
                                                            <p>{t('paidOn').replace('{date}', new Date(payment.last_paid).toLocaleDateString())}</p>
                                                            <p className="font-semibold text-gray-200">{t('nextPaymentDue').replace('{date}', new Date(payment.next_paid).toLocaleDateString())}</p>
                                                        </div>
                                                    ) : (
                                                        <p className="font-semibold text-red-400">{t('statusUnpaid')}</p>
                                                    )}
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                    }
                                </div>
                            )}
                            {activeTab === 'bookedSeats' && (
                                <div>
                                    {bookedSeatsLoading ? <p>Loading booked seats...</p> :
                                    bookedSeatsError ? <p className="text-red-400">{bookedSeatsError}</p> :
                                    Object.keys(bookedSeats).length === 0 ? <p>No seats are currently booked.</p> :
                                    (
                                        <div className="space-y-6">
                                            {MAIN_TIME_BLOCKS.map(block => {
                                                const blockBookings = block.slots.filter(slot => bookedSeats[slot.id] && bookedSeats[slot.id].length > 0);
                                                if (blockBookings.length === 0) return null;

                                                return (
                                                    <div key={block.id}>
                                                        <h3 className="text-xl font-bold text-gray-100 mb-3 border-b border-gray-600 pb-2">{t(block.key)}</h3>
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                                            {blockBookings.map(slot => (
                                                                <div key={slot.id} className="bg-gray-700 p-4 rounded-lg">
                                                                    <p className="font-semibold text-amber-400">{t(slot.key)}</p>
                                                                    <ul className="mt-2 space-y-1 text-sm text-gray-300">
                                                                        {bookedSeats[slot.id].map(dayNum => (
                                                                            <li key={dayNum} className="flex items-center gap-2">
                                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                                                </svg>
                                                                                {t('day' + dayNumberToString(dayNum))}
                                                                            </li>
                                                                        ))}
                                                                    </ul>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )
                                    }
                                </div>
                            )}
                            {activeTab === 'settings' && (
                                <div className="space-y-4">
                                    <div>
                                        <h3 className="text-lg font-bold mb-2">Application Settings</h3>
                                        <div className="bg-gray-700 p-4 rounded-lg flex items-center justify-between">
                                            <div>
                                                <label htmlFor="test-mode-toggle" className="font-semibold text-gray-200">Test Mode</label>
                                                <p className="text-sm text-gray-400">Route all notifications to a test webhook.</p>
                                            </div>
                                            <label htmlFor="test-mode-toggle" className="flex items-center cursor-pointer">
                                                <div className="relative">
                                                    <input type="checkbox" id="test-mode-toggle" className="sr-only" checked={isTestMode} onChange={() => {
                                                        const newMode = !isTestMode;
                                                        setIsTestMode(newMode);
                                                        (window as any).maqraatIsTestMode = newMode;
                                                    }} />
                                                    <div className={`block w-14 h-8 rounded-full transition ${isTestMode ? 'bg-amber-500' : 'bg-gray-600'}`}></div>
                                                    <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${isTestMode ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                                </div>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}

                {approvalForLink && (
                    <div className="absolute inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-10 rounded-lg">
                        <div className="bg-gray-700 p-6 rounded-lg shadow-xl w-full max-w-md">
                            <h3 className="text-lg font-bold mb-4">Enter Zoom Link for {approvalForLink.name}</h3>
                            <input
                                type="url"
                                value={zoomLinkInput}
                                onChange={(e) => setZoomLinkInput(e.target.value)}
                                placeholder="https://zoom.us/j/..."
                                autoFocus
                                className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-amber-500 focus:border-amber-500 text-gray-200"
                            />
                            <div className="mt-6 flex justify-end gap-4">
                                <button
                                    onClick={handleCancelApproval}
                                    className="px-4 py-2 bg-gray-600 text-gray-200 font-semibold rounded-md hover:bg-gray-500"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirmApproval}
                                    disabled={processingId === approvalForLink.id || !zoomLinkInput.trim()}
                                    className="px-4 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-500 disabled:bg-gray-500"
                                >
                                    {processingId === approvalForLink.id ? 'Processing...' : 'Confirm & Approve'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminPanel;