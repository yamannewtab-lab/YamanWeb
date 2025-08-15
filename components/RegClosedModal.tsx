

import React from 'react';

interface RegClosedModalProps {
    t: (key: string) => string;
    onClose: () => void;
}

const RegClosedModal: React.FC<RegClosedModalProps> = ({ t, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl p-8 max-w-sm w-full text-center dark:bg-slate-800">
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{t('regClosedTitle')}</h3>
                <p className="mt-4 text-slate-600 dark:text-slate-400">{t('regClosedText')}</p>
                <button onClick={onClose} className="mt-6 w-full bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-all">{t('regClosedButton')}</button>
            </div>
        </div>
    );
};

export default RegClosedModal;