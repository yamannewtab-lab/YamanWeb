import React from 'react';

interface RegClosedModalProps {
    t: (key: string) => string;
    onClose: () => void;
}

const RegClosedModal: React.FC<RegClosedModalProps> = ({ t, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl p-8 max-w-sm w-full text-center dark:bg-gray-800">
                <h3 className="text-xl font-bold text-stone-800 dark:text-gray-100">{t('regClosedTitle')}</h3>
                <p className="mt-4 text-stone-600 dark:text-gray-400">{t('regClosedText')}</p>
                <button onClick={onClose} className="mt-6 w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300">{t('regClosedButton')}</button>
            </div>
        </div>
    );
};

export default RegClosedModal;