
import React from 'react';

interface ActionCardProps {
    title: string;
    description: string;
    buttonText: string;
    onButtonClick: () => void;
    buttonClassName: string;
}

const ActionCard: React.FC<ActionCardProps> = ({ title, description, buttonText, onButtonClick, buttonClassName }) => {
    return (
        <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-lg flex flex-col items-center justify-between transition-transform duration-200 ease-in-out hover:-translate-y-1 hover:shadow-lg dark:hover:shadow-2xl">
            <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">{title}</h3>
                <p className="text-slate-600 dark:text-slate-400 mt-2 mb-4">{description}</p>
            </div>
            <button onClick={onButtonClick} className={`text-white font-bold py-2 px-5 rounded-lg transition-all w-full ${buttonClassName}`}>
                {buttonText}
            </button>
        </div>
    );
};

export default ActionCard;
