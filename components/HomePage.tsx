import React, { useRef } from 'react';
import { Page } from '../types';
import ActionCard from './ActionCard';

interface HomePageProps {
    navigateTo: (page: Page) => void;
    t: (key: string) => string;
}

const IconBookOpen = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
);

const IconMicrophone = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
    </svg>
);

const IconSparkles = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
);

const IconCollection = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
);

const IconBadgeCheck = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
    </svg>
);

const IconInformationCircle = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const IconUsers = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21v-1a6 6 0 00-1.78-4.125a6 6 0 00-6.44-1.746" />
    </svg>
);

const IconChatAlt2 = () => (
     <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a2 2 0 01-2-2V7a2 2 0 012-2h4l4-4v4z" />
    </svg>
);


const HomePage: React.FC<HomePageProps> = ({ navigateTo, t }) => {
    const sectionsRef = useRef<HTMLDivElement>(null);

    const handleScrollToSections = () => {
        if (!sectionsRef.current) return;

        const targetElement = sectionsRef.current;
        const headerOffset = 0; 
        const elementPosition = targetElement.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        const startPosition = window.pageYOffset;
        const distance = offsetPosition - startPosition;
        const duration = 1000; // Duration in milliseconds
        let startTime: number | null = null;

        const easeInOutCubic = (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

        const animation = (currentTime: number) => {
            if (startTime === null) startTime = currentTime;
            const timeElapsed = currentTime - startTime;
            const progress = Math.min(timeElapsed / duration, 1);
            const easedProgress = easeInOutCubic(progress);
            
            window.scrollTo(0, startPosition + distance * easedProgress);

            if (timeElapsed < duration) {
                requestAnimationFrame(animation);
            }
        };

        requestAnimationFrame(animation);
    };

    return (
        <div>
            <div 
                className="relative h-[65vh] min-h-[500px] flex items-center justify-center text-center bg-cover bg-center" 
                style={{ backgroundImage: "url('https://i.imgur.com/K9c7R6l.jpeg')" }}
            >
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-slate-900/40"></div>
                <div className="relative z-10 px-4 py-8 sm:py-16">
                    <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white drop-shadow-lg">{t('heroTitle')}</h1>
                    <p className="mt-4 max-w-3xl mx-auto text-lg text-slate-200 drop-shadow-md">
                        {t('heroSubtitle')}
                    </p>
                    <button 
                        onClick={handleScrollToSections}
                        className="mt-8 px-8 py-4 bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-bold text-lg rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-sky-300 dark:focus:ring-sky-800"
                    >
                        {t('heroButton')}
                    </button>
                </div>
                 <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
                    <button onClick={handleScrollToSections} className="animate-bounce p-2 group" aria-label="Scroll down">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white opacity-70 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                </div>
            </div>
            
            <div ref={sectionsRef} className="p-6 sm:p-8 md:p-12" id="journey-sections">
                 <div className="text-center mb-10">
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-800 dark:text-slate-100">{t('homePageTitle')}</h2>
                    <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">{t('homePageSubtitle')}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <ActionCard
                        title={t('ijazahSectionTitle')}
                        description={t('ijazahSectionDesc')}
                        buttonText={t('ijazahButtonText')}
                        onButtonClick={() => navigateTo('ijazah')}
                        buttonClassName="bg-sky-500 hover:bg-sky-600"
                        icon={<IconBookOpen />}
                    />
                    <ActionCard
                        title={t('tasmiSectionTitle')}
                        description={t('tasmiSectionDesc')}
                        buttonText={t('tasmiButtonText')}
                        onButtonClick={() => navigateTo('tasmiQuiz')}
                        buttonClassName="bg-green-500 hover:bg-green-600"
                        icon={<IconMicrophone />}
                    />
                    <ActionCard
                        title={t('tajwidSectionTitle')}
                        description={t('tajwidSectionDesc')}
                        buttonText={t('tajwidButtonText')}
                        onButtonClick={() => navigateTo('tajwidImprovement')}
                        buttonClassName="bg-rose-500 hover:bg-rose-600"
                        icon={<IconSparkles />}
                    />
                    <ActionCard
                        title={t('coursesSectionTitle')}
                        description={t('coursesSectionDesc')}
                        buttonText={t('previousCoursesBtnHomepage')}
                        onButtonClick={() => navigateTo('courses')}
                        buttonClassName="bg-indigo-600 hover:bg-indigo-700"
                        icon={<IconCollection />}
                    />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
                     <ActionCard
                        title={t('ijazahPreviewCardTitle')}
                        description={t('ijazahPreviewDesc')}
                        buttonText={t('ijazahPreviewButtonText')}
                        onButtonClick={() => navigateTo('ijazahPreview')}
                        buttonClassName="bg-purple-600 hover:bg-purple-700"
                        icon={<IconBadgeCheck />}
                    />
                    <ActionCard
                        title={t('aboutUsSectionTitle')}
                        description={t('aboutUsSectionDesc')}
                        buttonText={t('aboutUsButtonText')}
                        onButtonClick={() => navigateTo('about')}
                        buttonClassName="bg-orange-500 hover:bg-orange-600"
                        icon={<IconInformationCircle />}
                    />
                     <ActionCard
                        title={t('teachersSectionTitle')}
                        description={t('teachersSectionDesc')}
                        buttonText={t('teachersButtonText')}
                        onButtonClick={() => navigateTo('teachers')}
                        buttonClassName="bg-cyan-500 hover:bg-cyan-600"
                        icon={<IconUsers />}
                    />
                    <ActionCard
                        title={t('feedbackSectionTitle')}
                        description={t('feedbackSectionDesc')}
                        buttonText={t('feedbackButtonText')}
                        onButtonClick={() => navigateTo('feedback')}
                        buttonClassName="bg-pink-500 hover:bg-pink-600"
                        icon={<IconChatAlt2 />}
                    />
                </div>
            </div>
        </div>
    );
};

export default HomePage;