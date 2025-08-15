import React, { useState, useEffect, useCallback } from 'react';
import { Page, IjazahApplication } from './types';
import { LANGUAGE_DATA, LANGUAGES, LOCK_CHECK } from './constants';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './components/HomePage';
import RegisterPage from './components/RegisterPage';
import CoursesPage from './components/CoursesPage';
import IjazahPage from './components/IjazahPage';
import IjazahPreviewPage from './components/IjazahPreviewPage';
import QuizPage from './components/QuizPage';
import TasmiQuizPage from './components/TasmiQuizPage';
import TasmiInfoPage from './components/TasmiInfoPage';
import PaymentPage from './components/PaymentPage';
import ThanksPage from './components/ThanksPage';
import ImageModal from './components/ImageModal';
import RegClosedModal from './components/RegClosedModal';

const App: React.FC = () => {
    const [currentPage, setCurrentPage] = useState<Page>('home');
    const [currentLanguageIndex, setCurrentLanguageIndex] = useState(0);
    const [ijazahApplication, setIjazahApplication] = useState<IjazahApplication>({
        path: '',
        daysPerWeek: 7,
        fullDetails: {}
    });
    const [isRegClosedModalOpen, setRegClosedModalOpen] = useState(false);
    const [imageModalSrc, setImageModalSrc] = useState<string | null>(null);
    const [isDarkMode, setIsDarkMode] = useState(() => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            return savedTheme === 'dark';
        }
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    });

    const currentLanguage = LANGUAGES[currentLanguageIndex];

    useEffect(() => {
        // Handle language and text direction
        document.documentElement.lang = currentLanguage;
        document.documentElement.dir = currentLanguage === 'ar' ? 'rtl' : 'ltr';
    }, [currentLanguage]);

    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [isDarkMode]);

    const t = useCallback((key: string): string => {
        return LANGUAGE_DATA[currentLanguage][key] || key;
    }, [currentLanguage]);

    const navigateTo = (page: Page) => {
        setCurrentPage(page);
        window.scrollTo(0, 0);
    };
    
    const handleLanguageToggle = () => {
        setCurrentLanguageIndex((prevIndex) => (prevIndex + 1) % LANGUAGES.length);
    };

    const handleRegisterClick = () => {
        if (LOCK_CHECK) {
            navigateTo('register');
        } else {
            setRegClosedModalOpen(true);
        }
    };
    
    const handleToggleDarkMode = () => {
        setIsDarkMode(prev => !prev);
    };

    const renderPage = () => {
        switch (currentPage) {
            case 'home':
                return <HomePage navigateTo={navigateTo} t={t} onRegisterClick={handleRegisterClick} />;
            case 'register':
                return <RegisterPage navigateTo={navigateTo} t={t} />;
            case 'courses':
                return <CoursesPage navigateTo={navigateTo} t={t} onImageClick={setImageModalSrc} />;
            case 'ijazah':
                return <IjazahPage navigateTo={navigateTo} t={t} setIjazahApplication={setIjazahApplication} />;
            case 'ijazahPreview':
                return <IjazahPreviewPage navigateTo={navigateTo} t={t} />;
            case 'quiz':
                return <QuizPage navigateTo={navigateTo} t={t} ijazahApplication={ijazahApplication} setIjazahApplication={setIjazahApplication} />;
            case 'tasmiQuiz':
                return <TasmiQuizPage navigateTo={navigateTo} t={t} />;
            case 'tasmiInfo':
                return <TasmiInfoPage navigateTo={navigateTo} t={t} />;
            case 'payment':
                return <PaymentPage navigateTo={navigateTo} t={t} ijazahApplication={ijazahApplication} />;
            case 'thanks':
                return <ThanksPage navigateTo={navigateTo} t={t} />;
            default:
                return <HomePage navigateTo={navigateTo} t={t} onRegisterClick={handleRegisterClick} />;
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen p-4">
            <div className="w-full max-w-4xl bg-white dark:bg-slate-800 rounded-2xl shadow-lg overflow-hidden transition-colors duration-300 flex flex-col">
                <Header
                    t={t}
                    onLanguageToggle={handleLanguageToggle}
                    onNavigateHome={() => navigateTo('home')}
                    onRegisterClick={handleRegisterClick}
                    isHomePage={currentPage === 'home'}
                    lockCheck={LOCK_CHECK}
                    isDarkMode={isDarkMode}
                    onToggleDarkMode={handleToggleDarkMode}
                />
                <main className="p-6 sm:p-8 md:p-12 overflow-y-auto">
                    <div key={currentPage} className="page-transition">
                        {renderPage()}
                    </div>
                </main>
                <Footer t={t} />
            </div>
            {imageModalSrc && <ImageModal src={imageModalSrc} onClose={() => setImageModalSrc(null)} />}
            {isRegClosedModalOpen && <RegClosedModal t={t} onClose={() => setRegClosedModalOpen(false)} />}
        </div>
    );
};

export default App;