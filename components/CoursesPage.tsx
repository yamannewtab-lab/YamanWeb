import React from 'react';
import { Page } from '../types';

interface CoursesPageProps {
    navigateTo: (page: Page) => void;
    t: (key: string) => string;
    onImageClick: (src: string) => void;
}

const CourseCard: React.FC<{ imgSrc: string, title: string, onImageClick: (src: string) => void }> = ({ imgSrc, title, onImageClick }) => (
    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow">
        <div className="cursor-pointer" onClick={() => onImageClick(imgSrc)}>
            <img 
                src={imgSrc} 
                alt={title} 
                className="w-full h-48 object-cover" 
                onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.onerror = null; 
                    target.src = 'https://placehold.co/400x200/a5b4fc/4f46e5?text=Course+Image';
                }}
            />
        </div>
        <div className="p-6">
            <h3 className="font-bold text-xl text-slate-800 dark:text-slate-200">{title}</h3>
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
                <CourseCard imgSrc="/photo_2025-08-14_10-27-48.jpg" title={t('course1Text')} onImageClick={onImageClick} />
                <CourseCard imgSrc="/photo_2025-08-14_10-28-01.jpg" title={t('course2Text')} onImageClick={onImageClick} />
            </div>
            <div className="mt-12 text-center">
                <button onClick={() => navigateTo('home')} className="text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">{t('backToHome')}</button>
            </div>
        </div>
    );
};

export default CoursesPage;