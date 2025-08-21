import { IjazahApplication } from './types';
import { PATH_TRANSLATION_KEYS } from './constants';

const WEBHOOK_URLS = {
    IJAZAH_HAFS: 'https://discord.com/api/webhooks/1407931017729146941/c7MgVod-fi3_kTB9ofFXj8to9tZLGkY1cZ77rDmebPG-WGpBvR96Wcz2hDAFy3vZV8J4',
    IJAZAH_TEN_QIRAAT: 'https://discord.com/api/webhooks/1407929481943060521/ptt6k-9KH-ZoNsxdj6x1N0rUbIprbTYYiOwTl59gE9k6nFL93ZhYOlBJlljLXDXAKw5t',
    IJAZAH_DIFFERENT_QIRAAH: 'https://discord.com/api/webhooks/1407931861325582346/hbuNqi4OaSwQD3FtiqSCOhvkkNFf5SxyajAllRN07trmUJpowtQ3zK_fRI0MAJWbKXcU',
    TASMI: 'https://discord.com/api/webhooks/1407932037901586443/C6eyEdHaNSXffiV6OLREm-gVqQ59nO6nWHRslfCJauc0Tpumbjg6zGVQNtG5y093vR8k',
    TAJWID: 'https://discord.com/api/webhooks/1407932319620137031/gYkAY-HsdOymfN5UH5Xg0szhESYwwtb-iOTs3G61dcVNKOaz90MfaZ20-kG1lxdcJpal',
    // Fallback for general course registration, using the Ten Qiraat one as it was the original default
    COURSE_REGISTRATION: 'https://discord.com/api/webhooks/1407929481943060521/ptt6k-9KH-ZoNsxdj6x1N0rUbIprbTYYiOwTl59gE9k6nFL93ZhYOlBJlljLXDXAKw5t',
};


// Define interfaces for the request types for better type safety
interface TasmiRequest {
    name: string;
    phone: string;
    sessions: number;
    portion: string;
    time: string;
    language: string;
    journey: string;
}

interface TajwidRequest {
    name: string;
    age: string;
    time: string;
    tajwidLevel: string;
    subscriptionText: string;
    priceText: string;
}

interface CourseRegistration {
    name: string;
    source: string;
    about: string;
    phone: string;
}

const getIjazahWebhookUrl = (path: string): string => {
    switch (path) {
        case "Hafs 'an 'Asim":
            return WEBHOOK_URLS.IJAZAH_HAFS;
        case "The Ten Recitations":
            return WEBHOOK_URLS.IJAZAH_TEN_QIRAAT;
        case "Different Qira'ah":
            return WEBHOOK_URLS.IJAZAH_DIFFERENT_QIRAAH;
        default:
            // Fallback to a default if path is somehow unknown
            return WEBHOOK_URLS.IJAZAH_TEN_QIRAAT;
    }
};


/**
 * Sends the Ijazah application data to a Discord channel via a webhook.
 * @param application - The Ijazah application object.
 * @param priceString - The formatted price string.
 * @param t - The translation function.
 */
export async function sendIjazahApplicationToDiscord(
    application: IjazahApplication,
    priceString: string,
    t: (key: string) => string
) {
    const { path, daysPerWeek, fullDetails, memorization } = application;
    const webhookUrl = getIjazahWebhookUrl(path);

    const fields = [
        { name: t('summaryPath'), value: t(PATH_TRANSLATION_KEYS[path] || path), inline: true },
        { name: t('summaryCommitment'), value: t('daysPerWeek').replace('{count}', String(daysPerWeek)), inline: true },
        { name: t('summaryPrice'), value: `${priceString} / ${t('monthlyText')}`, inline: true },
        { name: t('summaryMemorization'), value: memorization === 'with' ? t('summaryWithMemorization') : t('summaryWithoutMemorization'), inline: true },
        { name: t('summaryTime'), value: fullDetails.preferredTime || 'N/A', inline: true },
        { name: t('summaryLanguage'), value: fullDetails.language || 'N/A', inline: true },
        { name: t('quizNameLabel'), value: fullDetails.name || 'N/A', inline: true },
        { name: t('quizAgeLabel'), value: fullDetails.age || 'N/A', inline: true },
        { name: t('quizFromLabel'), value: fullDetails.from || 'N/A', inline: true },
        { name: t('quizSheikhLabel'), value: fullDetails.sheikh ? t(fullDetails.sheikh) : 'N/A', inline: true },
    ];
    
    // Add Qira'ah field only if it exists
    if (fullDetails.qiraah) {
        fields.splice(1, 0, { name: t('summaryQiraah'), value: fullDetails.qiraah, inline: true });
    }

    const embed = {
        title: "New Ijazah Application",
        color: 38399, // Teal
        fields,
        description: `**${t('quizJourneyLabel')}**\n${fullDetails.journey || 'Not provided.'}`,
        footer: {
            text: "Submitted via Maqra'at Al-Huda App"
        },
        timestamp: new Date().toISOString()
    };
    
    const payload = {
        username: "Maqra'at Al-Huda Bot",
        avatar_url: "https://i.imgur.com/uFPNd22.png",
        embeds: [embed]
    };

    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            const errorBody = await response.text();
            console.error('Failed to send message to Discord:', response.status, response.statusText, errorBody);
        }
    } catch (error) {
        console.error('Error sending message to Discord:', error);
    }
}

/**
 * Sends the Tasmi' request data to Discord.
 */
export async function sendTasmiRequestToDiscord(request: TasmiRequest, t: (key: string) => string) {
    const embed = {
        title: "New Opened Tasmi' Request",
        color: 5763719, // Green
        fields: [
            { name: t('quizNameLabel'), value: request.name, inline: true },
            { name: t('phoneLabel'), value: request.phone || 'N/A', inline: true },
            { name: t('tasmiWeeklyLabel'), value: String(request.sessions), inline: true },
            { name: t('tasmiPortionLabel'), value: request.portion, inline: true },
            { name: t('tasmiTimeLabel'), value: request.time, inline: true },
            { name: t('quizLanguageLabel'), value: request.language, inline: true },
        ],
        description: `**${t('quizJourneyLabel')}**\n${request.journey}`,
        footer: { text: "Submitted via Maqra'at Al-Huda App" },
        timestamp: new Date().toISOString()
    };
    
    const payload = {
        username: "Maqra'at Al-Huda Bot",
        avatar_url: "https://i.imgur.com/uFPNd22.png",
        embeds: [embed]
    };

    try {
        const response = await fetch(WEBHOOK_URLS.TASMI, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            const errorBody = await response.text();
            console.error('Failed to send message to Discord:', response.status, response.statusText, errorBody);
        }
    } catch (error) {
        console.error('Error sending message to Discord:', error);
    }
}

/**
 * Sends the Tajwid Improvement request data to Discord.
 */
export async function sendTajwidRequestToDiscord(request: TajwidRequest, t: (key: string) => string) {
    const embed = {
        title: "New Tajwid Improvement Request",
        color: 15252002, // Rose
        fields: [
            { name: t('quizNameLabel'), value: request.name, inline: true },
            { name: t('quizAgeLabel'), value: request.age, inline: true },
            { name: t('quizTimeLabel'), value: request.time, inline: true },
            { name: t('tajwidLevelLabel'), value: request.tajwidLevel, inline: true },
            { name: "Subscription Plan", value: `${request.subscriptionText} (${request.priceText})`, inline: false },
        ],
        footer: { text: "Submitted via Maqra'at Al-Huda App" },
        timestamp: new Date().toISOString()
    };

    const payload = {
        username: "Maqra'at Al-Huda Bot",
        avatar_url: "https://i.imgur.com/uFPNd22.png",
        embeds: [embed]
    };

    try {
        const response = await fetch(WEBHOOK_URLS.TAJWID, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            const errorBody = await response.text();
            console.error('Failed to send message to Discord:', response.status, response.statusText, errorBody);
        }
    } catch (error) {
        console.error('Error sending message to Discord:', error);
    }
}

/**
 * Sends the general course registration data to Discord.
 */
export async function sendCourseRegistrationToDiscord(request: CourseRegistration, t: (key: string) => string) {
     const embed = {
        title: "New Course Registration",
        color: 4886754, // Indigo
        fields: [
            { name: t('nameLabel'), value: request.name, inline: true },
            { name: t('phoneLabel'), value: request.phone, inline: true },
            { name: t('sourceLabel'), value: request.source, inline: false },
            { name: t('aboutLabel'), value: request.about, inline: false },
        ],
        footer: { text: "Submitted via Maqra'at Al-Huda App" },
        timestamp: new Date().toISOString()
    };
    
    const payload = {
        username: "Maqra'at Al-Huda Bot",
        avatar_url: "https://i.imgur.com/uFPNd22.png",
        embeds: [embed]
    };

    try {
        const response = await fetch(WEBHOOK_URLS.COURSE_REGISTRATION, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            const errorBody = await response.text();
            console.error('Failed to send message to Discord:', response.status, response.statusText, errorBody);
        }
    } catch (error) {
        console.error('Error sending message to Discord:', error);
    }
}
