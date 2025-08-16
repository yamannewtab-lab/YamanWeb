import React, { useState, useEffect, useCallback } from 'react';
import { Page, IjazahApplication } from './types';
import { LANGUAGE_DATA, LANGUAGES } from './constants';
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
import AboutPage from './components/AboutPage';
import TajwidQuizPage from './components/TajwidQuizPage';
import TeachersPage from './components/TeachersPage';

const App: React.FC = () => {
    const [currentPage, setCurrentPage] = useState<Page>('home');
    const [currentLanguageIndex, setCurrentLanguageIndex] = useState(0);
    const [ijazahApplication, setIjazahApplication] = useState<IjazahApplication>({
        path: '',
        daysPerWeek: 7,
        memorization: undefined,
        fullDetails: {}
    });
    const [imageModalSrc, setImageModalSrc] = useState<string | null>(null);
    const [registerAgainTarget, setRegisterAgainTarget] = useState<Page>('ijazah');
    
    const currentLanguage = LANGUAGES[currentLanguageIndex];

    useEffect(() => {
        // Handle language and text direction
        document.documentElement.lang = currentLanguage;
        document.documentElement.dir = currentLanguage === 'ar' ? 'rtl' : 'ltr';
    }, [currentLanguage]);

    const t = useCallback((key: string): string => {
        return LANGUAGE_DATA[currentLanguage][key] || key;
    }, [currentLanguage]);

    const navigateTo = (page: Page) => {
        if (page === 'tajwidImprovement') {
            setRegisterAgainTarget('tajwidImprovement');
        } else if (page === 'ijazah') {
            setRegisterAgainTarget('ijazah');
        }
        setCurrentPage(page);
        window.scrollTo(0, 0);
    };
    
    const handleLanguageToggle = () => {
        setCurrentLanguageIndex((prevIndex) => (prevIndex + 1) % LANGUAGES.length);
    };

    const renderPage = () => {
        switch (currentPage) {
            case 'home':
                return <HomePage navigateTo={navigateTo} t={t} />;
            case 'register':
                return <RegisterPage navigateTo={navigateTo} t={t} />;
            case 'courses':
                return <CoursesPage navigateTo={navigateTo} t={t} onImageClick={setImageModalSrc} />;
            case 'ijazah':
                return <IjazahPage navigateTo={navigateTo} t={t} setIjazahApplication={setIjazahApplication} />;
            case 'ijazahPreview':
                return <IjazahPreviewPage navigateTo={navigateTo} t={t} onImageClick={setImageModalSrc} />;
            case 'quiz':
                return <QuizPage navigateTo={navigateTo} t={t} ijazahApplication={ijazahApplication} setIjazahApplication={setIjazahApplication} />;
            case 'tasmiQuiz':
                return <TasmiQuizPage navigateTo={navigateTo} t={t} />;
            case 'tajwidImprovement':
                return <TajwidQuizPage navigateTo={navigateTo} t={t} />;
            case 'tasmiInfo':
                return <TasmiInfoPage navigateTo={navigateTo} t={t} />;
            case 'payment':
                return <PaymentPage navigateTo={navigateTo} t={t} ijazahApplication={ijazahApplication} />;
            case 'thanks':
                return <ThanksPage navigateTo={navigateTo} t={t} registerAgainTarget={registerAgainTarget} />;
            case 'about':
                return <AboutPage navigateTo={navigateTo} t={t} />;
            case 'teachers':
                return <TeachersPage navigateTo={navigateTo} t={t} />;
            default:
                return <HomePage navigateTo={navigateTo} t={t} />;
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen p-4">
            <div className="w-full max-w-4xl bg-white rounded-2xl shadow-lg overflow-hidden transition-colors duration-300 flex flex-col dark:bg-slate-800">
                <Header
                    t={t}
                    onLanguageToggle={handleLanguageToggle}
                    onNavigateHome={() => navigateTo('home')}
                    isHomePage={currentPage === 'home'}
                />
                <main className="p-6 sm:p-8 md:p-12 overflow-y-auto">
                    <div key={currentPage} className="page-transition">
                        {renderPage()}
                    </div>
                </main>
                <Footer t={t} />
            </div>
            {imageModalSrc && <ImageModal src={imageModalSrc} onClose={() => setImageModalSrc(null)} />}
        </div>
    );
};

export default App;