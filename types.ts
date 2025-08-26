export type Page = 'home' | 'register' | 'courses' | 'ijazah' | 'quiz' | 'tasmiQuiz' | 'tasmiInfo' | 'thanks' | 'ijazahPreview' | 'about' | 'tajwidImprovement' | 'teachers' | 'feedback' | 'feedbackThanks' | 'joinClass' | 'ihyaCourse' | 'ihyaRegister' | 'ihyaJoin';

export type Language = 'en' | 'ar' | 'id';

export type SubmissionType = 'paid' | 'free' | null;

export interface IjazahApplication {
    path: string;
    daysPerWeek: number;
    memorization?: 'with' | 'without';
    fullDetails: {
        name?: string;
        age?: string;
        whatsapp?: string;
        from?: string;
        sheikh?: string;
        journey?: string;
        preferredTime?: string;
        language?: string;
        qiraah?: string;
        selectedDays?: string[];
        paymentPreference?: string;
        paymentMethod?: string;
        agreedToTerms?: boolean;
    };
}

export interface TranslationSet {
    [key: string]: string;
}

export interface LanguageData {
    en: TranslationSet;
    ar: TranslationSet;
    id: TranslationSet;
}

export interface IjazahPrices {
    [path: string]: {
        [days: number]: number;
    };
}

export type FaqItem = {
    q: string;
    a: string;
};