// WARNING: Storing API credentials on the frontend is a major security risk.
// These values can be easily extracted by anyone inspecting your site's code.
// For a production application, this logic MUST be moved to a secure backend environment
// like a serverless function (e.g., Supabase Edge Function).
const ZOOM_ACCOUNT_ID = 'pOeiXIppRFST1XKaU3essQ';
const ZOOM_CLIENT_ID = 'S045NIgbS22BpuZkRfQeQ';
const ZOOM_CLIENT_SECRET = 'HLstXnBT4kRGkKaNmnZkVDIAQfJUSF00';

// A CORS proxy is REQUIRED to allow the browser to make requests to the Zoom API.
// This is because of the browser's Same-Origin Policy security feature.
const CORS_PROXY = 'https://thingproxy.freeboard.io/fetch/';

const getZoomAccessToken = async (): Promise<string> => {
    const authUrl = `${CORS_PROXY}https://zoom.us/oauth/token`;
    const credentials = btoa(`${ZOOM_CLIENT_ID}:${ZOOM_CLIENT_SECRET}`);

    const response = await fetch(authUrl, {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            'grant_type': 'account_credentials',
            'account_id': ZOOM_ACCOUNT_ID,
        })
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.error("Zoom Auth Error:", errorData);
        throw new Error('Failed to authenticate with Zoom API.');
    }

    const data = await response.json();
    return data.access_token;
};


const dayStringToZoomNumber = (day: string): number => {
    const map: { [key: string]: number } = {
        'Sunday': 1, 'Monday': 2, 'Tuesday': 3, 'Wednesday': 4,
        'Thursday': 5, 'Friday': 6, 'Saturday': 7
    };
    return map[day] ?? 0;
};

// Creates a single recurring meeting for all selected days
export const createRecurringZoomMeeting = async (studentName: string, selectedDays: string[], startTime: { hour: number, minute: number }): Promise<any> => {
    const accessToken = await getZoomAccessToken();

    // Find the next occurrence to set as the start_time
    const now = new Date();
    let firstMeetingDate: Date | null = null;
    const sortedSelectedDayNumbers = selectedDays.map(dayStringToZoomNumber).filter(d => d > 0).sort();
    
    for (let i = 0; i < 7; i++) {
        const checkDate = new Date();
        checkDate.setDate(now.getDate() + i);
        const dayOfWeek = checkDate.getDay() + 1; // getDay is 0=Sun, so +1 for Zoom format
        
        if (sortedSelectedDayNumbers.includes(dayOfWeek)) {
             firstMeetingDate = new Date(checkDate);
             firstMeetingDate.setHours(startTime.hour, startTime.minute, 0, 0);
             if (firstMeetingDate.getTime() < now.getTime()) {
                 firstMeetingDate = null;
                 continue;
             }
             break;
        }
    }
    
    if (!firstMeetingDate) {
        // If all sessions this week are past, find the first one starting from next week
        for (let i = 7; i < 14; i++) {
            const checkDate = new Date();
            checkDate.setDate(now.getDate() + i);
            const dayOfWeek = checkDate.getDay() + 1;
            if (sortedSelectedDayNumbers.includes(dayOfWeek)) {
                firstMeetingDate = new Date(checkDate);
                firstMeetingDate.setHours(startTime.hour, startTime.minute, 0, 0);
                break;
            }
        }
    }

    if (!firstMeetingDate) {
        throw new Error("Could not calculate a valid start time for the meeting.");
    }
    
    // The start_time for Zoom API must be in UTC. We assume the input time is Jakarta time (GMT+7)
    // and convert it to a UTC ISO string.
    const jakartaOffset = 7 * 60; // in minutes
    const localOffset = firstMeetingDate.getTimezoneOffset(); // in minutes
    const utcTime = firstMeetingDate.getTime() + (localOffset * 60000) - (jakartaOffset * 60000);
    const utcDate = new Date(utcTime);

    const meetingPayload = {
        topic: `Maqra'at Al-Huda Session with ${studentName}`,
        type: 8, // Recurring meeting with fixed time
        start_time: utcDate.toISOString().slice(0, 19) + 'Z',
        duration: 20,
        timezone: 'UTC', // We provide start_time in UTC
        recurrence: {
            type: 2, // Weekly
            repeat_interval: 1,
            weekly_days: sortedSelectedDayNumbers.join(',')
        },
        settings: {
            join_before_host: true,
            waiting_room: false,
            auto_recording: 'none'
        }
    };
    
    const zoomApiUrl = `${CORS_PROXY}https://api.zoom.us/v2/users/me/meetings`;

    const response = await fetch(zoomApiUrl, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(meetingPayload)
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.error("Zoom API Meeting Creation Error:", errorData);
        throw new Error(`Zoom Meeting Creation Error: ${errorData.message || response.statusText}`);
    }

    return await response.json();
};
