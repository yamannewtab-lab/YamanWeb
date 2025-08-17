import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const Recommendation: React.FC = () => {
    const [viewers, setViewers] = useState<number | null>(null);

    const fetchVisitorCount = async () => {
        // We will get the total row count from a 'views' table to determine the number of visitors.
        const { count, error } = await supabase
            .from('views')
            .select('*', { count: 'exact', head: true });

        if (error) {
            console.error("Error fetching visitor count:", error.message);
            // If the table doesn't exist or another error occurs,
            // we'll hide the component instead of showing an error or fake data.
            setViewers(null); 
        } else {
            setViewers(count);
        }
    };
    
    useEffect(() => {
        // This function will run once when the component is first loaded.
        const logAndFetch = async () => {
            // First, log a new view by inserting a row with the current timestamp.
            // This assumes user_id is nullable for anonymous views.
            await supabase.from('views').insert([{ started_at: new Date().toISOString() }]);
            
            // After attempting to log the view, fetch the latest count.
            fetchVisitorCount();
        };

        logAndFetch();

        // To make it "live", we'll poll for new counts every 10 seconds.
        const interval = setInterval(fetchVisitorCount, 10000); 

        // Cleanup interval on component unmount.
        return () => clearInterval(interval);
    }, []);

    // Don't render anything if we don't have a valid count.
    if (viewers === null || viewers <= 0) {
        return null;
    }

    return (
        <div className="flex items-center justify-center gap-3 mt-4 text-sm">
            <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">Visitors</span>
            <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path fillRule="evenodd" d="M.458 10C3.732 4.943 7.523 3 10 3s6.268 1.943 9.542 7c-3.274 5.057-7.03 7-9.542 7S3.732 15.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">{viewers.toLocaleString()}</span>
            </span>
        </div>
    );
};

export default Recommendation;