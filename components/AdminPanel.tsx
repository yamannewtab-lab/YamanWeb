import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

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
    created_at: string;
}

interface AdminPanelProps {
    onClose: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onClose }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [authError, setAuthError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'visitors' | 'feedbacks'>('visitors');

    // Visitor states
    const [visitors, setVisitors] = useState<GroupedVisitors>({});
    const [visitorsLoading, setVisitorsLoading] = useState(true);
    const [visitorsError, setVisitorsError] = useState<string | null>(null);

    // Feedback states
    const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
    const [feedbacksLoading, setFeedbacksLoading] = useState(true);
    const [feedbacksError, setFeedbacksError] = useState<string | null>(null);

    useEffect(() => {
        if (!isAuthenticated) return;

        const fetchVisitors = async () => {
            setVisitorsLoading(true);
            setVisitorsError(null);
            const { data, error } = await supabase
                .from('visitors')
                .select('country, city');

            if (error) {
                console.error("Error fetching visitors:", error.message);
                setVisitorsError("Failed to fetch visitor data.");
                setVisitorsLoading(false);
                return;
            }

            if (data) {
                const grouped = data.reduce((acc: GroupedVisitors, visitor: Visitor) => {
                    const country = visitor.country || "Unknown";
                    if (!acc[country]) {
                        acc[country] = { cities: [], count: 0 };
                    }
                    if (visitor.city) {
                        acc[country].cities.push(visitor.city);
                    }
                    acc[country].count += 1;
                    return acc;
                }, {});
                
                Object.keys(grouped).forEach(country => {
                    grouped[country].cities = [...new Set(grouped[country].cities)];
                });

                setVisitors(grouped);
            }
            setVisitorsLoading(false);
        };

        const fetchFeedbacks = async () => {
            setFeedbacksLoading(true);
            setFeedbacksError(null);
            const { data, error } = await supabase
                .from('feedbacks')
                .select('message, created_at')
                .order('created_at', { ascending: false });

            if (error) {
                console.error("Error fetching feedbacks:", error.message);
                setFeedbacksError("Failed to fetch feedback data.");
            } else if (data) {
                setFeedbacks(data as Feedback[]);
            }
            setFeedbacksLoading(false);
        };

        fetchVisitors();
        fetchFeedbacks();
    }, [isAuthenticated]);
    
    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => {
            window.removeEventListener('keydown', handleEsc);
        };
    }, [onClose]);

    const handlePasswordSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === 'yaman321') {
            setIsAuthenticated(true);
            setAuthError(null);
        } else {
            setAuthError('Incorrect password. Please try again.');
            setPassword('');
        }
    };
    
    const getTabClassName = (tabName: 'visitors' | 'feedbacks') => {
        return `px-4 py-2 text-sm font-medium rounded-t-md transition-colors focus:outline-none ${
            activeTab === tabName
                ? 'bg-stone-700 text-white'
                : 'text-stone-400 hover:bg-stone-700/50 hover:text-stone-200'
        }`;
    };

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-panel-title"
        >
            <div 
                className="bg-stone-800 rounded-lg shadow-xl p-6 max-w-2xl w-full text-stone-200 max-h-[80vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-4 pb-4 border-b border-stone-600">
                    <h2 id="admin-panel-title" className="text-2xl font-bold">Admin Panel</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-stone-700 transition-colors" aria-label="Close admin panel">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>

                {!isAuthenticated ? (
                    <div className="p-4">
                        <h3 className="text-lg font-semibold mb-4 text-center">Authentication Required</h3>
                        <form onSubmit={handlePasswordSubmit} className="space-y-4">
                            <div>
                                <label htmlFor="password-input" className="block text-sm font-medium text-stone-300 sr-only">Password</label>
                                <input
                                    id="password-input"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter password"
                                    autoFocus
                                    className="mt-1 block w-full px-3 py-2 bg-stone-700 border border-stone-600 rounded-md shadow-sm placeholder-stone-400 focus:outline-none focus:ring-amber-500 focus:border-amber-500 text-stone-200"
                                />
                            </div>
                            {authError && <p className="text-red-400 text-sm text-center">{authError}</p>}
                            <button 
                                type="submit" 
                                className="w-full bg-amber-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-amber-700 transition-all disabled:bg-amber-800 disabled:cursor-not-allowed"
                                disabled={!password}
                            >
                                Unlock
                            </button>
                        </form>
                    </div>
                ) : (
                    <>
                        <div className="flex border-b border-stone-600 -mt-4 -mx-6 px-6">
                            <button onClick={() => setActiveTab('visitors')} className={getTabClassName('visitors')}>Visitors</button>
                            <button onClick={() => setActiveTab('feedbacks')} className={getTabClassName('feedbacks')}>Feedbacks</button>
                        </div>
                        <div className="overflow-y-auto custom-scrollbar pr-2 mt-4 flex-grow">
                            {activeTab === 'visitors' && (
                                <div>
                                    {visitorsLoading && <p>Loading visitors...</p>}
                                    {visitorsError && <p className="text-red-400">{visitorsError}</p>}
                                    {!visitorsLoading && !visitorsError && Object.keys(visitors).length === 0 && <p>No visitor data available.</p>}
                                    
                                    {!visitorsLoading && !visitorsError && (
                                        <ul className="space-y-2">
                                            {Object.entries(visitors).sort((a,b) => b[1].count - a[1].count).map(([country, data]) => (
                                                <li key={country} className="bg-stone-700 rounded-md">
                                                    <details>
                                                        <summary className="p-3 cursor-pointer flex justify-between items-center font-semibold list-none">
                                                            <span>{country}</span>
                                                            <span className="text-sm bg-stone-600 px-2 py-0.5 rounded-full">{data.count}</span>
                                                        </summary>
                                                        <div className="p-3 border-t border-stone-600">
                                                            {data.cities.length > 0 ? (
                                                                <ul className="list-disc list-inside pl-2 space-y-1 text-stone-300">
                                                                    {data.cities.sort().map((city, index) => city && <li key={index}>{city}</li>)}
                                                                </ul>
                                                            ) : (
                                                                <p className="text-stone-400 italic">No city data available for this country.</p>
                                                            )}
                                                        </div>
                                                    </details>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            )}
                             {activeTab === 'feedbacks' && (
                                <div>
                                    {feedbacksLoading && <p>Loading feedbacks...</p>}
                                    {feedbacksError && <p className="text-red-400">{feedbacksError}</p>}
                                    {!feedbacksLoading && !feedbacksError && feedbacks.length === 0 && <p>No feedback available.</p>}

                                    {!feedbacksLoading && !feedbacksError && (
                                        <ul className="space-y-3">
                                            {feedbacks.map((feedback, index) => (
                                                <li key={index} className="bg-stone-700 p-4 rounded-md shadow">
                                                    <p className="text-stone-300 whitespace-pre-wrap">{feedback.message}</p>
                                                    <p className="text-xs text-stone-500 mt-2 text-right">{new Date(feedback.created_at).toLocaleString()}</p>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default AdminPanel;