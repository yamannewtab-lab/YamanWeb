import React from 'react';
import { Page } from '../types';

interface IhyaCoursePageProps {
    navigateTo: (page: Page) => void;
    t: (key: string) => string;
}

const DetailItem: React.FC<{ icon: React.ReactNode; text: string; subText?: string }> = ({ icon, text, subText }) => (
    <li className="flex items-start gap-4">
        <div className="flex-shrink-0 bg-gray-700/50 p-2 rounded-full mt-1">{icon}</div>
        <div>
            <span className="text-gray-300">{text}</span>
            {subText && <p className="text-xs text-gray-500">{subText}</p>}
        </div>
    </li>
);

const IhyaCoursePage: React.FC<IhyaCoursePageProps> = ({ navigateTo, t }) => {
    return (
        <div className="page-transition">
            <div className="text-center mb-10">
                <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-sky-400 to-blue-500 bg-clip-text text-transparent">{t('ihyaCourseTitle')}</h2>
                <p className="mt-2 text-gray-500">{t('headerSubtitle')}</p>
            </div>

            <div className="max-w-3xl mx-auto bg-gray-800/50 p-6 sm:p-8 rounded-2xl shadow-lg border border-gray-700/50">
                <p className="text-lg text-gray-300 leading-relaxed text-center italic border-b border-gray-700 pb-6 mb-6">
                    "{t('ihyaCourseIntro')}"
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Course Details */}
                    <div>
                        <h3 className="text-xl font-bold text-gray-100 mb-4">{t('ihyaCourseDetailsTitle')}</h3>
                        <ul className="space-y-4">
                            <DetailItem icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} text={t('ihyaCourseLessonDuration')} />
                            <DetailItem icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>} text={t('ihyaCourseStartDate')} />
                            <DetailItem icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>} text={t('ihyaCourseEndDate')} />
                            <DetailItem 
                                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>} 
                                text={t('ihyaCourseTime')} 
                                subText={t('ihyaCourseTimeSub')} 
                            />
                        </ul>
                    </div>
                    
                    {/* Requirements */}
                    <div>
                        <h3 className="text-xl font-bold text-gray-100 mb-4">{t('ihyaCourseRequirementsTitle')}</h3>
                        <ul className="space-y-4">
                            <DetailItem icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10-5-10M6.088 21L11 11.007 6.088 1z" /></svg>} text={t('ihyaCourseReq1')} />
                        </ul>
                    </div>
                </div>

                {/* Information Section */}
                <div className="mt-8 border-t border-gray-700 pt-6">
                    <h3 className="text-xl font-bold text-gray-100 mb-4 text-center">{t('ihyaCourseInfoTitle')}</h3>
                    <div className="text-lg text-gray-300 leading-relaxed text-center">
                        <p>{t('ihyaCourseInfoContentStart')}</p>
                        <p className="font-serif text-xl my-2" dir="rtl">{t('ihyaCourseInfoContentArabic')}</p>
                        <p>{t('ihyaCourseInfoContentEnd')}</p>
                    </div>
                </div>

                <div className="mt-8 border-t border-gray-700 pt-6 text-center">
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <button 
                            onClick={() => navigateTo('ihyaRegister')}
                            className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-sky-500 to-blue-600 text-white font-bold text-base rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-blue-800"
                        >
                            {t('ihyaJoinButton')}
                        </button>
                        <a 
                            href="https://chat.whatsapp.com/BfQyVaqRdBADCbJ6s8wYOx?mode=ems_copy_c"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full sm:w-auto text-center px-8 py-3 bg-gray-700/80 backdrop-blur-sm text-gray-200 font-bold text-base rounded-lg shadow-md hover:shadow-lg hover:bg-gray-600 transform hover:scale-105 transition-all duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-gray-600 border border-gray-600"
                        >
                            {t('ihyaJoinWhatsappButton')}
                        </a>
                    </div>
                </div>
            </div>

            <div className="mt-12 text-center">
                <button onClick={() => navigateTo('home')} className="text-sm font-semibold text-gray-400 hover:text-amber-400 transition-colors">{t('backToHome')}</button>
            </div>
        </div>
    );
};

export default IhyaCoursePage;