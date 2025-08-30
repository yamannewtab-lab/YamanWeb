import React from 'react';
import Confetti from './Confetti';

interface WelcomeViewProps {
    studentName: string;
    programName: string;
    t: (key: string) => string;
    onContinue: () => void;
}

const WelcomeView: React.FC<WelcomeViewProps> = ({ studentName, programName, t, onContinue }) => {
    return (
        <div className="relative text-center py-16 page-transition">
            <Confetti />
            <div className="inline-block bg-green-900/50 p-4 rounded-full">
                <svg className="w-16 h-16 text-green-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </div>
            <h2 className="mt-6 text-3xl font-bold text-gray-100">
                {t('welcomeModalTitle').replace('{name}', studentName)}
            </h2>
            <p className="mt-2 text-gray-400 max-w-md mx-auto">
                {t('welcomeModalText').replace('{program}', programName)}
            </p>

            <div className="mt-10">
                 <button 
                    onClick={onContinue} 
                    className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300"
                >
                    {t('welcomeModalButton')}
                </button>
            </div>
        </div>
    );
};

export default WelcomeView;