export type Page = 'home' | 'register' | 'courses' | 'ijazah' | 'quiz' | 'tasmiQuiz' | 'tasmiInfo' | 'payment' | 'thanks' | 'ijazahPreview' | 'about' | 'tajwidImprovement' | 'teachers' | 'feedback' | 'feedbackThanks';

export type Language = 'en' | 'ar' | 'id';

export interface IjazahApplication {
    path: string;
    daysPerWeek: number;
    memorization?: 'with' | 'without';
    fullDetails: {
        name?: string;
        age?: string;
        from?: string;
        sheikh?: string;
        journey?: string;
        preferredTime?: string;
        language?: string;
        qiraah?: string;
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