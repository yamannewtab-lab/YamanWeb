
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
        <div className="bg-stone-50 p-6 rounded-xl flex flex-col text-left transition-all duration-300 ease-in-out hover:-translate-y-2 hover:shadow-2xl dark:bg-gray-900/80 border border-transparent hover:border-amber-500/30">
            <div className="bg-stone-100 dark:bg-gray-800/60 p-3 rounded-lg self-start mb-4">
                {icon}
            </div>
            <div className="flex-grow">
                <h3 className="text-xl font-bold text-stone-800 dark:text-gray-100">{title}</h3>
                <p className="text-stone-600 mt-2 mb-4 dark:text-gray-400">{description}</p>
            </div>
            <button 
                onClick={onButtonClick} 
                className={`text-white font-bold py-2 px-5 rounded-lg w-full mt-auto shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300 ease-in-out ${buttonClassName}`}
            >
                {buttonText}
            </button>
        </div>
    );
};

export default ActionCard;