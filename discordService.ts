import { IjazahApplication } from './types';
import { PATH_TRANSLATION_KEYS } from './constants';
import { supabase } from './supabaseClient';

const TEST_WEBHOOK_URL = 'https://discord.com/api/webhooks/1408380291806138459/YpjqWWyp8TnsjFHFuHf_w6wZJHRMYaGEgoQ3HxNHQspv4Q2rJiI1c_VYXmOtjcw4T4hp';

const WEBHOOK_URLS = {
    IJAZAH_HAFS: 'https://discord.com/api/webhooks/1407931017729146941/c7MgVod-fi3_kTB9ofFXj8to9tZLGkY1cZ77rDmebPG-WGpBvR96Wcz2hDAFy3vZV8J4',
    IJAZAH_TEN_QIRAAT: 'https://discord.com/api/webhooks/1407929481943060521/ptt6k-9KH-ZoNsxdj6x1N0rUbIprbTYYiOwTl59gE9k6nFL93ZhYOlBJlljLXDXAKw5t',
    IJAZAH_DIFFERENT_QIRAAH: 'https://discord.com/api/webhooks/1407931861325582346/hbuNqi4OaSwQD3FtiqSCOhvkkNFf5SxyajAllRN07trmUJpowtQ3zK_fRI0MAJWbKXcU',
    TASMI: 'https://discord.com/api/webhooks/1407932037901586443/C6eyEdHaNSXffiV6OLREm-gVqQ59nO6nWHRslfCJauc0Tpumbjg6zGVQNtG5y093vR8k',
    TAJWID: 'https://discord.com/api/webhooks/1407932319620137031/gYkAY-HsdOymfN5UH5Xg0szhESYwwtb-iOTs3G61dcVNKOaz90MfaZ20-kG1lxdcJpal',
    COURSE_REGISTRATION: 'https://discord.com/api/webhooks/1407929481943060521/ptt6k-9KH-ZoNsxdj6x1N0rUbIprbTYYiOwTl59gE9k6nFL93ZhYOlBJlljLXDXAKw5t',
    AI_QUESTIONS: 'https://discord.com/api/webhooks/1408380025983602688/9wlOyBOt0RYed0ftJVXjRhNelhcIjECYzKSOnIaa0JyxnSrCQYQ-W3geQrKcivpjsqfL',
    FORGOT_PASSCODE: 'https://discord.com/api/webhooks/1409207667360010421/IY9TSrUhUniyhuLRVRtDDneMw-e_ozf8LKG7y7GelYlgM1A-96VK9mfA-srFSBMz8FtB',
    TEACHER_NOTIFICATION: 'https://discord.com/api/webhooks/1409537105243279442/3X_LGP8m9cPv3Z5Yp5uPkoFlNRjKIdQxkt_m7odxFfn3UFqtnB3D4QfoKhXqDp5nCPHm',
    CHAT_MESSAGES: 'https://discord.com/api/webhooks/1409537105243279442/3X_LGP8m9cPv3Z5Yp5uPkoFlNRjKIdQxkt_m7odxFfn3UFqtnB3D4QfoKhXqDp5nCPHm', // Reusing teacher webhook, can be changed.
    IHYA_COURSE: 'https://discord.com/api/webhooks/1409889821228269598/jIjBKhpXvnxl0giXWyt8OPNGlm4D8k1iUY7iUelfNHqJ7pIoklaqBN3HJZ3CTAlndEFd',
};

type WebhookType = keyof typeof WEBHOOK_URLS;

export const isTestModeEnabled = (): boolean => {
    // Read directly from a global variable. This resets on every page refresh.
    return (window as any).maqraatIsTestMode === true;
};

const getWebhookUrl = (type: WebhookType): string => {
    if (isTestModeEnabled()) {
        return TEST_WEBHOOK_URL;
    }
    return WEBHOOK_URLS[type];
};

async function logRegistrationAsFeedback(message: string) {
    const { error } = await supabase
        .from('feedbacks')
        .insert([{ message: `[AUTO-LOG] ${message}` }]);

    if (error) {
        console.error("Error logging registration to feedback table:", error.message);
    }
}

// Define interfaces for the request types for better type safety
interface TasmiRequest {
    name: string;
    age: string;
    whatsapp: string;
    sessions: number;
    portion: string;
    language: string;
    journey: string;
}

interface TajwidRequest {
    name: string;
    age: string;
    whatsapp: string;
    time: string; // Time text
    tajwidLevel: string;
    additionalNotes?: string;
    daysPerWeek: number;
    selectedDays: string[];
    priceText: string; // Monthly price string
    paymentPreference?: string;
    paymentMethod?: string;
    agreedToTerms?: boolean;
}

interface CourseRegistration {
    name: string;
    age: string;
    whatsapp: string;
    source: string;
    about: string;
}

interface IhyaRegistration {
    name: string;
    age: string;
    whatsapp: string;
}

interface ForgotPasscodeRequest {
    name: string;
    whatsapp: string;
}

interface TeacherNotificationRequest {
    name: string;
    program: string;
    time: string;
}

interface ChatMessageRequest {
    name: string;
    message: string;
}


const getIjazahWebhookType = (path: string): WebhookType => {
    switch (path) {
        case "Hafs 'an 'Asim":
            return 'IJAZAH_HAFS';
        case "The Ten Recitations":
            return 'IJAZAH_TEN_QIRAAT';
        case "Different Qira'ah":
            return 'IJAZAH_DIFFERENT_QIRAAH';
        default:
            return 'IJAZAH_TEN_QIRAAT';
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
    const webhookUrl = getWebhookUrl(getIjazahWebhookType(path));

    // Log a summary to the feedback table
    const feedbackMessage = `New Ijazah Application: ${t(PATH_TRANSLATION_KEYS[path] || path)} for ${t('daysPerWeek').replace('{count}', String(daysPerWeek))}. Contact: ${fullDetails.whatsapp}`;
    await logRegistrationAsFeedback(feedbackMessage);

    const fields = [
        { name: t('quizNameLabel'), value: fullDetails.name || 'N/A', inline: true },
        { name: t('quizAgeLabel'), value: fullDetails.age || 'N/A', inline: true },
        { name: t('whatsappLabel'), value: fullDetails.whatsapp || 'N/A', inline: true },
        { name: t('summaryPath'), value: t(PATH_TRANSLATION_KEYS[path] || path), inline: true },
        { name: t('summaryCommitment'), value: t('daysPerWeek').replace('{count}', String(daysPerWeek)), inline: true },
        { name: t('summaryPrice'), value: `${priceString} / ${t('monthlyText')}`, inline: true },
        { name: t('summaryMemorization'), value: memorization === 'with' ? t('summaryWithMemorization') : t('summaryWithoutMemorization'), inline: true },
        { name: t('summaryTime'), value: fullDetails.preferredTime || 'N/A', inline: true },
        { name: t('summaryLanguage'), value: fullDetails.language || 'N/A', inline: true },
        { name: t('quizFromLabel'), value: fullDetails.from || 'N/A', inline: true },
        { name: t('quizSheikhLabel'), value: fullDetails.sheikh ? t(fullDetails.sheikh) : 'N/A', inline: true },
        { name: 'Status', value: 'Pending Approval', inline: true },
    ];
    
    if (fullDetails.qiraah) {
        fields.splice(4, 0, { name: t('summaryQiraah'), value: fullDetails.qiraah, inline: true });
    }

    if (fullDetails.selectedDays && fullDetails.selectedDays.length > 0) {
        fields.push({ name: t('summaryPreferredDays'), value: fullDetails.selectedDays.map(day => t(`day${day}`)).join(', '), inline: false });
    }

    // Add payment fields
    fields.push({ name: '---', value: '**Payment Information**', inline: false });
    if (fullDetails.paymentPreference) {
        fields.push({ name: 'Payment Preference', value: fullDetails.paymentPreference === 'start' ? t('paymentPrefOptionStart') : t('paymentPrefOptionEnd'), inline: true });
    }
    if (fullDetails.paymentMethod) {
        fields.push({ name: 'Payment Method', value: fullDetails.paymentMethod, inline: true });
    }
    fields.push({ name: 'Agreed to Terms', value: fullDetails.agreedToTerms ? t('yes') : t('no'), inline: true });

    const embed: any = {
        title: isTestModeEnabled() ? "[TEST] New Ijazah Approval Request" : "New Ijazah Approval Request",
        color: 16753920, // Amber
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
    // Log a summary to the feedback table
    const feedbackMessage = `New Tasmi' Request: ${request.sessions} sessions/week. Contact: ${request.whatsapp}`;
    await logRegistrationAsFeedback(feedbackMessage);

    const embed = {
        title: isTestModeEnabled() ? "[TEST] New Tasmi' Approval Request" : "New Tasmi' Approval Request",
        color: 5763719, // Green
        fields: [
            { name: t('quizNameLabel'), value: request.name, inline: true },
            { name: t('quizAgeLabel'), value: request.age || 'N/A', inline: true },
            { name: t('whatsappLabel'), value: request.whatsapp || 'N/A', inline: true },
            { name: t('tasmiWeeklyLabel'), value: String(request.sessions), inline: true },
            { name: t('tasmiPortionLabel'), value: request.portion, inline: true },
            { name: t('quizLanguageLabel'), value: request.language, inline: true },
            { name: 'Status', value: 'Pending Approval', inline: true },
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
        const response = await fetch(getWebhookUrl('TASMI'), {
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
    // Log a summary to the feedback table
    const feedbackMessage = `New Tajwid Improvement Request: ${request.daysPerWeek} days/week. Contact: ${request.whatsapp}`;
    await logRegistrationAsFeedback(feedbackMessage);
    
    const fields = [
        { name: t('quizNameLabel'), value: request.name, inline: true },
        { name: t('quizAgeLabel'), value: request.age, inline: true },
        { name: t('whatsappLabel'), value: request.whatsapp || 'N/A', inline: true },
        { name: t('summaryCommitment'), value: t('daysPerWeek').replace('{count}', String(request.daysPerWeek)), inline: true },
        { name: t('summaryTime'), value: request.time, inline: true },
        { name: t('tajwidLevelLabel'), value: request.tajwidLevel, inline: true },
        { name: t('summaryPrice'), value: `${request.priceText} / ${t('monthlyText')}`, inline: true },
        { name: 'Status', value: 'Pending Approval', inline: true },
    ];
    
    if (request.selectedDays && request.selectedDays.length > 0) {
        fields.push({ name: t('summaryPreferredDays'), value: request.selectedDays.map(day => t(`day${day}`)).join(', '), inline: false });
    }

    // Add payment fields
    fields.push({ name: '---', value: '**Payment Information**', inline: false });
    if (request.paymentPreference) {
        fields.push({ name: 'Payment Preference', value: request.paymentPreference === 'start' ? t('paymentPrefOptionStart') : t('paymentPrefOptionEnd'), inline: true });
    }
    if (request.paymentMethod) {
        fields.push({ name: 'Payment Method', value: request.paymentMethod, inline: true });
    }
    fields.push({ name: 'Agreed to Terms', value: request.agreedToTerms ? t('yes') : t('no'), inline: true });


    const embed: any = {
        title: isTestModeEnabled() ? "[TEST] New Tajwid Improvement Request" : "New Tajwid Improvement Request",
        color: 15252002, // Rose
        fields,
        footer: { text: "Submitted via Maqra'at Al-Huda App" },
        timestamp: new Date().toISOString()
    };

    if (request.additionalNotes) {
        embed.description = `**${t('infoLabel')}**\n${request.additionalNotes}`;
    }

    const payload = {
        username: "Maqra'at Al-Huda Bot",
        avatar_url: "https://i.imgur.com/uFPNd22.png",
        embeds: [embed]
    };

    try {
        const response = await fetch(getWebhookUrl('TAJWID'), {
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
     // Log a summary to the feedback table
    const feedbackMessage = `New Course Registration. Contact: ${request.whatsapp}`;
    await logRegistrationAsFeedback(feedbackMessage);
    
     const embed = {
        title: isTestModeEnabled() ? "[TEST] New Course Registration" : "New Course Registration",
        color: 16753920, // Amber
        fields: [
            { name: t('nameLabel'), value: request.name, inline: true },
            { name: t('quizAgeLabel'), value: request.age, inline: true },
            { name: t('whatsappLabel'), value: request.whatsapp, inline: true },
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
        const response = await fetch(getWebhookUrl('COURSE_REGISTRATION'), {
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
 * Sends the Ihya Ulumuddin registration data to Discord.
 */
export async function sendIhyaRegistrationToDiscord(request: IhyaRegistration, t: (key: string) => string) {
    const feedbackMessage = `New Ihya Ulumuddin Registration for ${request.name}.`;
    await logRegistrationAsFeedback(feedbackMessage);

    const embed = {
        title: isTestModeEnabled() ? "[TEST] New Ihya Ulumuddin Registration" : "New Ihya Ulumuddin Registration",
        color: 3447003, // Blue
        fields: [
            { name: t('nameLabel'), value: request.name, inline: true },
            { name: t('quizAgeLabel'), value: request.age, inline: true },
            { name: t('whatsappLabel'), value: request.whatsapp, inline: true },
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
        const response = await fetch(getWebhookUrl('IHYA_COURSE'), {
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
 * Sends a user's question to the AI to a Discord channel for logging.
 * @param question - The user's question.
 */
export async function sendAiQuestionToDiscord(question: string) {
    const embed = {
        title: isTestModeEnabled() ? "[TEST] New AI Assistant Question" : "New AI Assistant Question",
        color: 8359053, // Purple
        description: question,
        footer: {
            text: "Submitted via Maqra'at Al-Huda App"
        },
        timestamp: new Date().toISOString()
    };
    
    const payload = {
        username: "AI Question Logger",
        avatar_url: "https://i.imgur.com/uFPNd22.png",
        embeds: [embed]
    };

    try {
        const response = await fetch(getWebhookUrl('AI_QUESTIONS'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            const errorBody = await response.text();
            console.error('Failed to send AI question to Discord:', response.status, response.statusText, errorBody);
        }
    } catch (error) {
        console.error('Error sending AI question to Discord:', error);
    }
}

/**
 * Sends a "Forgot Passcode" request to Discord.
 */
export async function sendForgotPasscodeToDiscord(request: ForgotPasscodeRequest) {
    const embed = {
        title: isTestModeEnabled() ? "[TEST] User Forgot Passcode" : "User Forgot Passcode",
        color: 15158332, // Red
        fields: [
            { name: "Name", value: request.name, inline: true },
            { name: "WhatsApp", value: request.whatsapp, inline: true },
        ],
        description: "A user has requested assistance with their passcode.",
        footer: { text: "Submitted via Maqra'at Al-Huda App" },
        timestamp: new Date().toISOString()
    };
    
    const payload = {
        username: "Maqra'at Al-Huda Bot",
        avatar_url: "https://i.imgur.com/uFPNd22.png",
        embeds: [embed]
    };

    try {
        const response = await fetch(getWebhookUrl('FORGOT_PASSCODE'), {
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
 * Sends a notification to the teacher that a student is ready.
 */
export async function sendTeacherNotification(request: TeacherNotificationRequest) {
    const embed = {
        title: isTestModeEnabled() ? "[TEST] Student is Ready for Class" : "Student is Ready for Class",
        color: 3447003, // Blue
        fields: [
            { name: "Student Name", value: request.name, inline: true },
            { name: "Program", value: request.program, inline: true },
            { name: "Scheduled Time", value: request.time, inline: false },
        ],
        description: `**${request.name}** has clicked the 'Notify Teacher' button and is waiting to start the session.`,
        footer: { text: "Notification from Maqra'at Al-Huda App" },
        timestamp: new Date().toISOString()
    };
    
    const payload = {
        username: "Class Notifier Bot",
        avatar_url: "https://i.imgur.com/uFPNd22.png",
        content: `🔔 Student **${request.name}** is ready for their session!`,
        embeds: [embed]
    };

    try {
        const response = await fetch(getWebhookUrl('TEACHER_NOTIFICATION'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            const errorBody = await response.text();
            console.error('Failed to send teacher notification to Discord:', response.status, response.statusText, errorBody);
        }
    } catch (error) {
        console.error('Error sending teacher notification to Discord:', error);
    }
}

/**
 * Sends a chat message to Discord.
 */
export async function sendChatMessageToDiscord(request: ChatMessageRequest) {
    const embed = {
        title: isTestModeEnabled() ? `[TEST] New Chat Message` : `New Chat Message`,
        color: 3447003, // Blue
        fields: [
            { name: "From", value: request.name, inline: false },
            { name: "Message", value: request.message, inline: false },
        ],
        footer: { text: "Sent via Maqra'at Al-Huda Live Chat" },
        timestamp: new Date().toISOString()
    };
    
    const payload = {
        username: "Live Chat Bot",
        avatar_url: "https://i.imgur.com/uFPNd22.png",
        content: `💬 New message from **${request.name}**`,
        embeds: [embed]
    };

    try {
        const response = await fetch(getWebhookUrl('CHAT_MESSAGES'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            const errorBody = await response.text();
            console.error('Failed to send chat message to Discord:', response.status, response.statusText, errorBody);
        }
    } catch (error) {
        console.error('Error sending chat message to Discord:', error);
    }
}