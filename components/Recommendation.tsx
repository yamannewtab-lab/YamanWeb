import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

interface RecommendationProps {
    onOpenAdminPanel: () => void;
}

const Recommendation: React.FC<RecommendationProps> = ({ onOpenAdminPanel }) => {
    const [viewers, setViewers] = useState<number | null>(null);

    const fetchVisitorCount = async () => {
        const { count, error } = await supabase
            .from('visitors')
            .select('*', { count: 'exact', head: true });

        if (error) {
            console.error("Error fetching visitor count:", error.message);
            setViewers(null); 
        } else {
            setViewers(count);
        }
    };
    
    useEffect(() => {
        const getVisitorInfo = async () => {
          try {
            const res = await fetch("https://ipapi.co/json/");
            if (!res.ok) throw new Error('Failed to fetch IP info');
            const data = await res.json();
            return {
              ip_address: data.ip,
              country: data.country_name,
              city: data.city,
              region: data.region,
              isp: data.org
            };
          } catch (e: any) {
            console.error("Could not get visitor info:", e.message);
            return null;
          }
        }

        const logVisitorAndFetchCount = async () => {
            const visitorKey = 'visitor_logged_session';
            const hasLogged = sessionStorage.getItem(visitorKey);

            if (!hasLogged) {
                const visitor = await getVisitorInfo();
                if (visitor) {
                  // Use upsert to prevent "duplicate key" errors for returning visitors.
                  // This will insert a new record or update the existing one based on the ip_address.
                  const { error } = await supabase.from("visitors").upsert([visitor], { onConflict: 'ip_address' });
                  if (error) {
                    console.error("Error logging visitor:", error.message);
                  } else {
                    sessionStorage.setItem(visitorKey, 'true');
                  }
                }
            }
            fetchVisitorCount();
        };
        
        logVisitorAndFetchCount();

        const interval = setInterval(fetchVisitorCount, 10000); 

        return () => clearInterval(interval);
    }, []);

    if (viewers === null || viewers <= 0) {
        return null;
    }

    return (
        <div className="flex items-center justify-center gap-3 mt-4 text-sm">
            <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            <button onClick={onOpenAdminPanel} className="font-semibold text-gray-200 hover:text-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-opacity-50 rounded transition-colors">
                Visitors
            </button>
            <span className="flex items-center gap-1.5 text-gray-400">
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