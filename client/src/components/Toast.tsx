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
        <div className="fixed bottom-20 md:bottom-8 right-6 z-50 flex items-center gap-2.5 backdrop-blur-2xl bg-[#07080B]/90 border border-cyan-400/50 text-white px-5 py-3 rounded-2xl shadow-[0_15px_35px_rgba(0,0,0,0.6)] animate-in slide-in-from-bottom-5 duration-200">
            {type === 'success' ? (
                <FaCheckCircle className="text-cyan-400 text-sm flex-shrink-0" />
            ) : (
                <FaInfoCircle className="text-cyan-400 text-sm flex-shrink-0" />
            )}
            <span className="text-xs sm:text-sm font-medium tracking-tight">{message}</span>
        </div>
    );
};

export default Toast;
