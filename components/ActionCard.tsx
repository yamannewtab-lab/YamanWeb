
import React from 'react';

interface ActionCardProps {
    title: string;
    description: string;
    buttonText: string;
    onButtonClick: () => void;
    buttonClassName: string;
    icon: React.ReactNode;
}

const ActionCard: React.FC<ActionCardProps> = ({ title, description, buttonText, onButtonClick, buttonClassName, icon }) => {
    return (
        <div className="bg-slate-50 p-6 rounded-xl flex flex-col text-left transition-all duration-300 ease-in-out hover:-translate-y-2 hover:shadow-2xl dark:bg-slate-700/80 border border-transparent hover:border-sky-500/30">
            <div className="bg-slate-100 dark:bg-slate-800/60 p-3 rounded-lg self-start mb-4">
                {icon}
            </div>
            <div className="flex-grow">
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{title}</h3>
                <p className="text-slate-600 mt-2 mb-4 dark:text-slate-400">{description}</p>
            </div>
            <button onClick={onButtonClick} className={`text-white font-bold py-2 px-5 rounded-lg transition-all w-full mt-auto ${buttonClassName}`}>
                {buttonText}
            </button>
        </div>
    );
};

export default ActionCard;
