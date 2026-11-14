import React, { useEffect } from 'react';
import { FaCheckCircle, FaInfoCircle } from 'react-icons/fa';

interface ToastProps {
    message: string | null;
    onClose: () => void;
    type?: 'success' | 'info';
}

const Toast: React.FC<ToastProps> = ({ message, onClose, type = 'success' }) => {
    useEffect(() => {
        if (!message) return;
        const timer = setTimeout(() => {
            onClose();
        }, 3000);
        return () => clearTimeout(timer);
    }, [message, onClose]);

    if (!message) return null;

    return (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-cinecue-surface border border-cinecue-amber/50 text-white px-4 py-3 rounded-xl shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-5 duration-200">
            {type === 'success' ? (
                <FaCheckCircle className="text-cinecue-amber text-sm flex-shrink-0" />
            ) : (
                <FaInfoCircle className="text-cinecue-amber text-sm flex-shrink-0" />
            )}
            <span className="text-xs sm:text-sm font-medium">{message}</span>
        </div>
    );
};

export default Toast;
