

import React from 'react';
import { Page } from '../types';

interface CoursesPageProps {
    navigateTo: (page: Page) => void;
    t: (key: string) => string;
    onImageClick: (src: string) => void;
}

const CourseCard: React.FC<{ imgSrc: string, title: string, onImageClick: (src: string) => void }> = ({ imgSrc, title, onImageClick }) => (
    <div className="bg-slate-50 rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow dark:bg-slate-700">
        <div className="cursor-pointer" onClick={() => onImageClick(imgSrc)}>
            <img 
                src={imgSrc} 
                alt={title} 
                className="w-full h-48 object-cover" 
                onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.onerror = null; 
                    target.src = '/img/Taj2.jpg';
                }}
            />
        </div>
        <div className="p-6">
            <h3 className="font-bold text-xl text-slate-800 dark:text-slate-100">{title}</h3>
        </div>
    </div>
);

const CoursesPage: React.FC<CoursesPageProps> = ({ navigateTo, t, onImageClick }) => {
    return (
        <div>
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100">{t('coursesTitle')}</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <CourseCard imgSrc="/img/Taj.jpg" title={t('course3Text')} onImageClick={onImageClick} />
                <CourseCard imgSrc="/img/Taj2.jpg" title={t('course4Text')} onImageClick={onImageClick} />
            </div>
            <div className="mt-12 text-center">
                <button onClick={() => navigateTo('home')} className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors dark:text-slate-400 dark:hover:text-indigo-400">{t('backToHome')}</button>
            </div>
        </div>
    );
};

export default CoursesPage;