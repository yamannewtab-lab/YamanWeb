import React, { useEffect } from 'react';
import { FaqItem } from '../types';

interface FaqProps {
    faqs: FaqItem[];
    onClose: () => void;
}

const Faq: React.FC<FaqProps> = ({ faqs, onClose }) => {
    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => {
            window.removeEventListener('keydown', handleEsc);
        };
    }, [onClose]);

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 z-50 page-transition"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="faq-title"
        >
            <div 
                className="bg-gray-800 rounded-xl shadow-2xl p-6 max-w-2xl w-full text-gray-200 max-h-[85vh] flex flex-col border border-gray-600"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-700">
                    <h2 id="faq-title" className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                        Frequently Asked Questions
                    </h2>
                    <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition-colors" aria-label="Close FAQ">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>

                <div className="overflow-y-auto custom-scrollbar pr-2 space-y-3">
                    {faqs.map((faq, index) => (
                        <details key={index} className="bg-gray-900/70 rounded-lg group">
                            <summary className="p-4 list-none cursor-pointer flex justify-between items-center font-semibold text-gray-200 group-hover:text-amber-400 transition-colors">
                                {faq.q}
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transform transition-transform duration-300 group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </summary>
                            <div className="p-4 border-t border-gray-700 text-gray-400 leading-relaxed">
                                <p>{faq.a}</p>
                            </div>
                        </details>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Faq;
