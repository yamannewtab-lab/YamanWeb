import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { TIME_SLOTS } from '../constants';

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


interface AdminPanelProps {
    onClose: () => void;
    t: (key: string) => string;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onClose, t }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [authError, setAuthError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'visitors' | 'feedbacks' | 'approvals' | 'settings'>('visitors');

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

    const [isTestMode, setIsTestMode] = useState<boolean>((window as any).maqraatIsTestMode || false);

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
                    // Basic validation to ensure fields exist before parsing
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
        const { error } = await supabase.from('approvals').update({ status: 'rejected' }).eq('id', approvalId);
        if (error) {
            alert(`Failed to reject: ${error.message}`);
        } else {
            setApprovals(current => current.filter(a => a.id !== approvalId));
        }
        setProcessingId(null);
    };

    const handleApprove = async (approval: ProcessedApproval) => {
        setProcessingId(approval.id);
        try {
            // 1. Check for conflicts
            for (const slot of approval.slots) {
                const { data, error } = await supabase.from('booking')
                    .select('id').eq('time_slot', slot.time_slot).eq('day_number', slot.day_number).eq('is_booked', true).limit(1);
                if (error) throw new Error(`DB check failed: ${error.message}`);
                if (data && data.length > 0) {
                    throw new Error(`Slot conflict found for ${t('day' + dayNumberToString(slot.day_number))} at ${t(timeSlotToKey(slot.time_slot))}.`);
                }
            }

            // 2. If no conflicts, insert into booking table
            const newBookings = approval.slots.map(slot => ({ ...slot, is_booked: true }));
            const { error: insertError } = await supabase.from('booking').insert(newBookings);
            if (insertError) throw new Error(`Failed to book slot: ${insertError.message}`);

            // 3. Update approval status
            const { error: updateError } = await supabase.from('approvals').update({ status: 'approved' }).eq('id', approval.id);
            if (updateError) throw new Error(`Failed to update approval: ${updateError.message}`);
            
            alert('Application approved and slot booked successfully!');
            setApprovals(current => current.filter(a => a.id !== approval.id));

        } catch (error: any) {
            alert(`Approval failed: ${error.message}`);
            if (error.message.includes('conflict')) fetchApprovals();
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
            <div className="bg-gray-800 rounded-lg shadow-xl p-6 max-w-2xl w-full text-gray-200 max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-600">
                    <h2 id="admin-panel-title" className="text-2xl font-bold">Admin Panel</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-700 transition-colors -m-2" aria-label="Close admin panel"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path></svg></button>
                </div>

                {!isAuthenticated ? (
                    <div className="p-4"><h3 className="text-lg font-semibold mb-4 text-center">Authentication Required</h3><form onSubmit={handlePasswordSubmit} className="space-y-4"><div><label htmlFor="password-input" className="sr-only">Password</label><input id="password-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter password" autoFocus className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-amber-500 focus:border-amber-500 text-gray-200"/></div>{authError && <p className="text-red-400 text-sm text-center">{authError}</p>}<button type="submit" className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50" disabled={!password}>Unlock</button></form></div>
                ) : (
                    <>
                        <div className="flex border-b border-gray-600 -mt-4 -mx-6 px-6">
                            <button onClick={() => setActiveTab('visitors')} className={getTabClassName('visitors')}>Visitors</button>
                            <button onClick={() => setActiveTab('feedbacks')} className={getTabClassName('feedbacks')}>Feedbacks</button>
                            <button onClick={() => setActiveTab('approvals')} className={getTabClassName('approvals')}>Approvals</button>
                            <button onClick={() => setActiveTab('settings')} className={getTabClassName('settings')}>Settings</button>
                        </div>
                        <div className="overflow-y-auto custom-scrollbar pr-2 mt-4 flex-grow">
                            {activeTab === 'visitors' && (<div>{visitorsLoading ? <p>Loading visitors...</p> : visitorsError ? <p className="text-red-400">{visitorsError}</p> : <ul className="space-y-2">{Object.entries(visitors).sort((a,b) => b[1].count - a[1].count).map(([country, data]) => (<li key={country} className="bg-gray-700 rounded-md"><details><summary className="p-3 cursor-pointer flex justify-between items-center font-semibold list-none"><span>{country}</span><span className="text-sm bg-gray-600 px-2 py-0.5 rounded-full">{data.count}</span></summary><div className="p-3 border-t border-gray-600">{data.cities.length > 0 ? <ul className="list-disc list-inside pl-2 space-y-1 text-gray-300">{data.cities.sort().map((city, index) => city && <li key={index}>{city}</li>)}</ul> : <p className="text-gray-400 italic">No city data.</p>}</div></details></li>))}</ul>}</div>)}
                            {activeTab === 'feedbacks' && (<div>{feedbacksLoading ? <p>Loading feedbacks...</p> : feedbacksError ? <p className="text-red-400">{feedbacksError}</p> : <ul className="space-y-3">{feedbacks.map((fb, index) => (<li key={index} className="bg-gray-700 p-4 rounded-md shadow"><p className="text-gray-300 whitespace-pre-wrap">{fb.message}</p></li>))}</ul>}</div>)}
                            {activeTab === 'approvals' && (<div>{approvalsLoading ? <p>Loading approvals...</p> : approvalsError ? <p className="text-red-400">{approvalsError}</p> : approvals.length === 0 ? <p>No pending approvals.</p> : <ul className="space-y-3">{approvals.map(approval => (<li key={approval.id} className="bg-gray-700/80 p-4 rounded-lg"><div className="flex justify-between items-start"><div><h4 className="font-bold text-lg">{approval.name}</h4><p className="text-sm text-amber-400">{approval.type} Application</p></div><div className="flex gap-2">{<button onClick={() => handleApprove(approval)} disabled={processingId===approval.id} className="bg-green-600 text-white px-3 py-1 rounded-md text-sm font-semibold hover:bg-green-500 disabled:bg-gray-500">Approve</button>}<button onClick={() => handleReject(approval.id)} disabled={processingId===approval.id} className="bg-red-600 text-white px-3 py-1 rounded-md text-sm font-semibold hover:bg-red-500 disabled:bg-gray-500">Reject</button></div></div><div className="mt-3 border-t border-gray-600 pt-3"><p className="font-semibold text-gray-300 text-sm mb-1">Requested Slots:</p><ul className="list-disc list-inside pl-2 space-y-1 text-sm">{approval.slots?.map((slot, i) => (<li key={i}>{t('day' + dayNumberToString(slot.day_number))} @ {t(timeSlotToKey(slot.time_slot))}</li>))}</ul></div><details className="mt-3"><summary className="cursor-pointer text-sm text-gray-400 hover:text-white">View Full Details</summary><pre className="mt-2 p-2 bg-gray-900 rounded-md text-xs overflow-x-auto custom-scrollbar"><code>{JSON.stringify(approval.data, null, 2)}</code></pre></details></li>))}</ul>}</div>)}
                            {activeTab === 'settings' && (<div className="space-y-4"><div><h3 className="text-lg font-bold mb-2">Application Settings</h3><div className="bg-gray-700 p-4 rounded-lg flex items-center justify-between"><div><label htmlFor="test-mode-toggle" className="font-semibold text-gray-200">Test Mode</label><p className="text-sm text-gray-400">Route all notifications to a test webhook.</p></div><label htmlFor="test-mode-toggle" className="flex items-center cursor-pointer"><div className="relative"><input type="checkbox" id="test-mode-toggle" className="sr-only" checked={isTestMode} onChange={() => {const newMode=!isTestMode; setIsTestMode(newMode); (window as any).maqraatIsTestMode=newMode;}}/><div className={`block w-14 h-8 rounded-full transition ${isTestMode ? 'bg-amber-500' : 'bg-gray-600'}`}></div><div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${isTestMode ? 'translate-x-6' : 'translate-x-0'}`}></div></div></label></div></div></div>)}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default AdminPanel;