import React, { useEffect } from 'react';

interface ImageModalProps {
    src: string;
    onClose: () => void;
}

const ImageModal: React.FC<ImageModalProps> = ({ src, onClose }) => {
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
        <div onClick={onClose} className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 z-50">
            <div className="relative" onClick={(e) => e.stopPropagation()}>
                <button onClick={onClose} className="absolute -top-4 -right-4 bg-gray-700 rounded-full p-2 text-gray-200 hover:bg-gray-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
                <img src={src} alt="Enlarged course image" className="max-w-full max-h-[80vh] rounded-lg" />
            </div>
        </div>
    );
};

export default ImageModal;