

import React from 'react';
import { Page } from '../types';

interface CoursesPageProps {
    navigateTo: (page: Page) => void;
    t: (key: string) => string;
    onImageClick: (src: string) => void;
}

const CoursesPage: React.FC<CoursesPageProps> = ({ navigateTo, t, onImageClick }) => {
    const courseImage1 = 'https://i.imgur.com/4yrMbit.png';
    const courseImage2 = 'https://i.imgur.com/UBR4vk7.png';

    return (
        <div>
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-stone-800 dark:text-gray-100">{t('coursesTitle')}</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-stone-50 rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow dark:bg-gray-800 flex flex-col">
                    <div className="bg-stone-100 dark:bg-gray-900">
                        <img 
                            src={courseImage1} 
                            alt={t('course3Text')} 
                            className="w-full h-64 object-contain cursor-pointer"
                            onClick={() => onImageClick(courseImage1)}
                        />
                    </div>
                    <div className="p-6 flex-grow">
                        <h3 className="font-bold text-xl text-stone-800 dark:text-gray-100">{t('course3Text')}</h3>
                    </div>
                </div>

                <div className="bg-stone-50 rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow dark:bg-gray-800 flex flex-col">
                    <div className="bg-stone-100 dark:bg-gray-900">
                        <img 
                            src={courseImage2} 
                            alt={t('course4Text')} 
                            className="w-full h-64 object-contain cursor-pointer"
                            onClick={() => onImageClick(courseImage2)}
                        />
                    </div>
                    <div className="p-6 flex-grow">
                        <h3 className="font-bold text-xl text-stone-800 dark:text-gray-100">{t('course4Text')}</h3>
                    </div>
                </div>
            </div>

            <div className="mt-12 text-center">
                <button onClick={() => navigateTo('home')} className="text-sm font-semibold text-stone-600 hover:text-amber-600 transition-colors dark:text-gray-400 dark:hover:text-amber-400">{t('backToHome')}</button>
            </div>
        </div>
    );
};

export default CoursesPage;