import React from 'react';
import { Page } from '../types';
import ActionCard from './ActionCard';

interface HomePageProps {
    navigateTo: (page: Page) => void;
    t: (key: string) => string;
}

const HomePage: React.FC<HomePageProps> = ({ navigateTo, t }) => {
    return (
        <div>
            <div className="text-center mb-10">
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-800 dark:text-slate-100">{t('homePageTitle')}</h2>
                <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">{t('homePageSubtitle')}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-center">
                <ActionCard
                    title={t('ijazahSectionTitle')}
                    description={t('ijazahSectionDesc')}
                    buttonText={t('ijazahButtonText')}
                    onButtonClick={() => navigateTo('ijazah')}
                    buttonClassName="bg-sky-500 hover:bg-sky-600"
                />
                <ActionCard
                    title={t('tasmiSectionTitle')}
                    description={t('tasmiSectionDesc')}
                    buttonText={t('tasmiButtonText')}
                    onButtonClick={() => navigateTo('tasmiQuiz')}
                    buttonClassName="bg-green-500 hover:bg-green-600"
                />
                <ActionCard
                    title={t('tajwidSectionTitle')}
                    description={t('tajwidSectionDesc')}
                    buttonText={t('tajwidButtonText')}
                    onButtonClick={() => navigateTo('tajwidImprovement')}
                    buttonClassName="bg-rose-500 hover:bg-rose-600"
                />
                <ActionCard
                    title={t('coursesSectionTitle')}
                    description={t('coursesSectionDesc')}
                    buttonText={t('previousCoursesBtnHomepage')}
                    onButtonClick={() => navigateTo('courses')}
                    buttonClassName="bg-indigo-600 hover:bg-indigo-700"
                />
                 <ActionCard
                    title={t('ijazahPreviewCardTitle')}
                    description={t('ijazahPreviewDesc')}
                    buttonText={t('ijazahPreviewButtonText')}
                    onButtonClick={() => navigateTo('ijazahPreview')}
                    buttonClassName="bg-purple-600 hover:bg-purple-700"
                />
                <ActionCard
                    title={t('aboutUsSectionTitle')}
                    description={t('aboutUsSectionDesc')}
                    buttonText={t('aboutUsButtonText')}
                    onButtonClick={() => navigateTo('about')}
                    buttonClassName="bg-orange-500 hover:bg-orange-600"
                />
            </div>
        </div>
    );
};

export default HomePage;