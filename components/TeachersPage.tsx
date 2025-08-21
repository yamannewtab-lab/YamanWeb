import React from 'react';
import { Page } from '../types';

interface TeachersPageProps {
    navigateTo: (page: Page) => void;
    t: (key: string) => string;
}

const TeachersPage: React.FC<TeachersPageProps> = ({ navigateTo, t }) => {
    return (
        <div>
            <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-stone-800 dark:text-gray-100">{t('teachersPageTitle')}</h2>
            </div>

            <div className="max-w-2xl mx-auto">
                <div className="bg-stone-50 dark:bg-gray-700 rounded-lg shadow-lg overflow-hidden">
                    <div className="md:flex">
                        <div className="md:flex-shrink-0">
                            {/* Canvas for picture */}
                            <div className="h-48 w-full object-cover md:w-48 bg-stone-200 dark:bg-gray-600 flex items-center justify-center">
                                <span className="text-stone-500 dark:text-gray-400 text-sm">Image coming soon</span>
                            </div>
                        </div>
                        <div className="p-8">
                            <div className="uppercase tracking-wide text-sm text-amber-500 dark:text-amber-400 font-semibold">{t('headerSubtitle')}</div>
                            <h3 className="mt-1 text-lg leading-tight font-medium text-black dark:text-white">{t('teacherYamanName')}</h3>
                            <p className="mt-2 text-stone-500 dark:text-gray-400">{t('teacherYamanBio')}</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="mt-12 text-center">
                <button onClick={() => navigateTo('home')} className="text-sm font-semibold text-stone-600 hover:text-amber-600 transition-colors dark:text-gray-400 dark:hover:text-amber-400">{t('backToHome')}</button>
            </div>
        </div>
    );
};

export default TeachersPage;