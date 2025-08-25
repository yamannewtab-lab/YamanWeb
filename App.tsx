

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Page, IjazahApplication, SubmissionType } from './types';
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
import ThanksPage from './components/ThanksPage';
import ImageModal from './components/ImageModal';
import AboutPage from './components/AboutPage';
import TajwidQuizPage from './components/TajwidQuizPage';
import TeachersPage from './components/TeachersPage';
import AdminPanel from './components/AdminPanel';
import FeedbackPage from './components/FeedbackPage';
import FeedbackThanksPage from './components/FeedbackThanksPage';
import AiChatWidget from './components/AiChatWidget';
import ChatWidget from './components/ChatWidget';
import JoinClassPage from './components/JoinClassPage';

const App: React.FC = () => {
    const [currentPage, setCurrentPage] = useState<Page>('home');
    const [currentLanguageIndex, setCurrentLanguageIndex] = useState(2);
    const [ijazahApplication, setIjazahApplication] = useState<IjazahApplication>({
        path: '',
        daysPerWeek: 0,
        memorization: undefined,
        fullDetails: {}
    });
    const [imageModalSrc, setImageModalSrc] = useState<string | null>(null);
    const [registerAgainTarget, setRegisterAgainTarget] = useState<Page>('ijazah');
    const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
    const [isAiChatOpen, setIsAiChatOpen] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [chatUserName, setChatUserName] = useState<string>('');
    const [unreadCount, setUnreadCount] = useState(0);
    const [lastSubmissionType, setLastSubmissionType] = useState<SubmissionType>(null);
    const [lastSubmittedName, setLastSubmittedName] = useState<string>('');
    const [universalPasscode] = useState(() => Math.floor(10000 + Math.random() * 90000).toString());
    const mainContentRef = useRef<HTMLElement>(null);
    
    const currentLanguage = LANGUAGES[currentLanguageIndex];
    
    useEffect(() => {
        window.history.scrollRestoration = 'manual';
    }, []);

    useEffect(() => {
        const currentCount = parseInt(localStorage.getItem('unread_messages_count') || '0', 10);
        setUnreadCount(currentCount);

        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'unread_messages_count') {
                setUnreadCount(parseInt(e.newValue || '0', 10));
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    useEffect(() => {
        // Handle language and text direction
        document.documentElement.lang = currentLanguage;
        document.documentElement.dir = currentLanguage === 'ar' ? 'rtl' : 'ltr';
    }, [currentLanguage]);

    useEffect(() => {
        window.scrollTo(0, 0);
        if (mainContentRef.current) {
            mainContentRef.current.scrollTop = 0;
        }
    }, [currentPage]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.ctrlKey && event.key === 'k') {
                event.preventDefault();
                setIsAdminPanelOpen(prev => !prev);
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

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
    };
    
    const handleLanguageToggle = () => {
        setCurrentLanguageIndex((prevIndex) => (prevIndex + 1) % LANGUAGES.length);
    };

    const handleOpenChat = (name: string) => {
        localStorage.setItem('unread_messages_count', '0');
        setUnreadCount(0);
        setChatUserName(name);
        setIsChatOpen(true);
    };

    const renderPage = () => {
        switch (currentPage) {
            case 'home':
                return <HomePage navigateTo={navigateTo} t={t} />;
            case 'register':
                return <RegisterPage navigateTo={navigateTo} t={t} setLastSubmissionType={setLastSubmissionType} setLastSubmittedName={setLastSubmittedName} universalPasscode={universalPasscode} />;
            case 'courses':
                return <CoursesPage navigateTo={navigateTo} t={t} onImageClick={setImageModalSrc} />;
            case 'ijazah':
                return <IjazahPage navigateTo={navigateTo} t={t} setIjazahApplication={setIjazahApplication} />;
            case 'ijazahPreview':
                return <IjazahPreviewPage navigateTo={navigateTo} t={t} onImageClick={setImageModalSrc} />;
            case 'quiz':
                return <QuizPage navigateTo={navigateTo} t={t} ijazahApplication={ijazahApplication} setIjazahApplication={setIjazahApplication} setLastSubmissionType={setLastSubmissionType} setLastSubmittedName={setLastSubmittedName} universalPasscode={universalPasscode} />;
            case 'tasmiQuiz':
                return <TasmiQuizPage navigateTo={navigateTo} t={t} />;
            case 'tajwidImprovement':
                return <TajwidQuizPage navigateTo={navigateTo} t={t} setLastSubmissionType={setLastSubmissionType} setLastSubmittedName={setLastSubmittedName} universalPasscode={universalPasscode} />;
            case 'tasmiInfo':
                return <TasmiInfoPage navigateTo={navigateTo} t={t} />;
            case 'thanks':
                return <ThanksPage navigateTo={navigateTo} t={t} registerAgainTarget={registerAgainTarget} ijazahApplication={ijazahApplication} lastSubmissionType={lastSubmissionType} lastSubmittedName={lastSubmittedName} universalPasscode={universalPasscode} />;
            case 'about':
                return <AboutPage navigateTo={navigateTo} t={t} />;
            case 'teachers':
                return <TeachersPage navigateTo={navigateTo} t={t} />;
            case 'feedback':
                return <FeedbackPage navigateTo={navigateTo} t={t} />;
            case 'feedbackThanks':
                return <FeedbackThanksPage navigateTo={navigateTo} t={t} />;
            case 'joinClass':
                return <JoinClassPage navigateTo={navigateTo} t={t} onOpenChat={handleOpenChat} unreadCount={unreadCount} />;
            default:
                return <HomePage navigateTo={navigateTo} t={t} />;
        }
    };

    const formPages: Page[] = ['register', 'quiz', 'tasmiQuiz', 'tajwidImprovement', 'feedback'];
    const showAiChat = formPages.includes(currentPage);

    return (
        <>
            {/* Main Application Content */}
            <div id="app-main-content">
                <div className="flex items-center justify-center min-h-screen p-4">
                    <div className="w-full max-w-4xl bg-gradient-to-b from-gray-900 to-slate-800 rounded-2xl shadow-lg overflow-hidden flex flex-col">
                        <Header
                            t={t}
                            onLanguageToggle={handleLanguageToggle}
                            onNavigateHome={() => navigateTo('home')}
                            isHomePage={currentPage === 'home'}
                        />
                        <main ref={mainContentRef} className={`overflow-y-auto ${currentPage === 'home' ? '' : 'p-6 sm:p-8 md:p-12'}`}>
                            <div key={currentPage}>
                                {renderPage()}
                            </div>
                        </main>
                        <Footer t={t} onOpenAdminPanel={() => setIsAdminPanelOpen(true)} />
                    </div>
                </div>
            </div>
            
            {/* Overlays */}
            <div id="app-overlays">
                {imageModalSrc && <ImageModal src={imageModalSrc} onClose={() => setImageModalSrc(null)} />}
                {isAdminPanelOpen && <AdminPanel onClose={() => setIsAdminPanelOpen(false)} t={t} />}
                {showAiChat && <AiChatWidget isOpen={isAiChatOpen} setIsOpen={setIsAiChatOpen} t={t} />}
                <ChatWidget isOpen={isChatOpen} setIsOpen={setIsChatOpen} t={t} userNameProp={chatUserName} />
            </div>
        </>
    );
};

export default App;