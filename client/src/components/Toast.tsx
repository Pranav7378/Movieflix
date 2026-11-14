import React, { useEffect, useState, useRef } from 'react';
import { 
    FaCheckCircle, 
    FaExclamationCircle, 
    FaBookmark, 
    FaTimes,
    FaStar
} from 'react-icons/fa';

export type ToastType = 'success' | 'error' | 'info' | 'watchlist' | 'watched';

export interface ToastData {
    message: string;
    description?: string;
    type?: ToastType;
}

interface ToastProps {
    message: string | ToastData | null;
    onClose: () => void;
    type?: ToastType;
    duration?: number;
}

const Toast: React.FC<ToastProps> = ({ 
    message, 
    onClose, 
    type: propType,
    duration = 3500 
}) => {
    const [isExiting, setIsExiting] = useState(false);
    const [progress, setProgress] = useState(100);
    const [isPaused, setIsPaused] = useState(false);
    const startTimeRef = useRef<number>(Date.now());
    const remainingTimeRef = useRef<number>(duration);

    // Extract title, description and determine dynamic type
    let title = '';
    let description: string | undefined = undefined;
    let resolvedType: ToastType = propType || 'success';

    if (typeof message === 'string') {
        title = message;
        const lower = message.toLowerCase();
        if (lower.includes('removed') || lower.includes('fail') || lower.includes('error')) {
            resolvedType = 'error';
        } else if (lower.includes('watchlist') || lower.includes('list')) {
            resolvedType = 'watchlist';
        } else if (lower.includes('watched') || lower.includes('diary')) {
            resolvedType = 'watched';
        } else if (lower.includes('rated')) {
            resolvedType = 'info';
        } else {
            resolvedType = 'success';
        }
    } else if (message) {
        title = message.message;
        description = message.description;
        resolvedType = message.type || propType || 'success';
    }

    const handleDismiss = () => {
        setIsExiting(true);
        setTimeout(() => {
            onClose();
            setIsExiting(false);
        }, 220);
    };

    // Auto-dismiss with progress countdown
    useEffect(() => {
        if (!message) return;
        setIsExiting(false);
        setProgress(100);
        remainingTimeRef.current = duration;
        startTimeRef.current = Date.now();

        const step = 25; // update every 25ms
        const interval = setInterval(() => {
            if (!isPaused) {
                remainingTimeRef.current -= step;
                const newProgress = Math.max(0, (remainingTimeRef.current / duration) * 100);
                setProgress(newProgress);

                if (remainingTimeRef.current <= 0) {
                    clearInterval(interval);
                    handleDismiss();
                }
            }
        }, step);

        return () => clearInterval(interval);
    }, [message, isPaused, duration]);

    if (!message) return null;

    // Type-specific styling tokens
    const typeConfigs = {
        success: {
            border: 'border-emerald-500/40 hover:border-emerald-400',
            glow: 'shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_25px_rgba(16,185,129,0.3)]',
            iconBg: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-glow-emerald',
            progressBar: 'bg-gradient-to-r from-emerald-400 to-cyan-400',
            icon: <FaCheckCircle className="text-sm animate-pulse" />
        },
        error: {
            border: 'border-rose-500/40 hover:border-rose-400',
            glow: 'shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_25px_rgba(244,63,94,0.3)]',
            iconBg: 'bg-rose-500/20 text-rose-400 border border-rose-500/30 shadow-glow-rose',
            progressBar: 'bg-gradient-to-r from-rose-400 to-amber-400',
            icon: <FaExclamationCircle className="text-sm" />
        },
        watchlist: {
            border: 'border-cyan-500/40 hover:border-cyan-400',
            glow: 'shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_25px_rgba(6,182,212,0.3)]',
            iconBg: 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow-glow-cyan',
            progressBar: 'bg-gradient-to-r from-cyan-400 to-violet-500',
            icon: <FaBookmark className="text-sm" />
        },
        watched: {
            border: 'border-emerald-500/40 hover:border-emerald-400',
            glow: 'shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_25px_rgba(16,185,129,0.3)]',
            iconBg: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-glow-emerald',
            progressBar: 'bg-gradient-to-r from-emerald-400 to-teal-400',
            icon: <FaCheckCircle className="text-sm" />
        },
        info: {
            border: 'border-amber-500/40 hover:border-amber-400',
            glow: 'shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_25px_rgba(245,158,11,0.3)]',
            iconBg: 'bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-glow-amber',
            progressBar: 'bg-gradient-to-r from-amber-400 to-yellow-300',
            icon: <FaStar className="text-sm" />
        }
    };

    const config = typeConfigs[resolvedType] || typeConfigs.success;

    return (
        <div 
            role="alert"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            className={`fixed bottom-24 md:bottom-8 right-4 sm:right-8 z-50 max-w-sm sm:max-w-md w-full transition-all duration-300 select-none ${
                isExiting ? 'animate-toast-out' : 'animate-toast-in'
            }`}
        >
            <div className={`relative backdrop-blur-2xl bg-[#090D15]/95 rounded-2xl border ${config.border} ${config.glow} p-4 overflow-hidden flex items-start gap-3.5`}>
                {/* Glow Ambient Backlight behind toast */}
                <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-cyan-500/10 via-violet-500/10 to-transparent blur-md pointer-events-none -z-10" />

                {/* Status Icon Badge */}
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${config.iconBg}`}>
                    {config.icon}
                </div>

                {/* Message Content */}
                <div className="flex-1 pr-2">
                    <h4 className="text-sm font-semibold text-white tracking-tight leading-snug">
                        {title}
                    </h4>
                    {description && (
                        <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                            {description}
                        </p>
                    )}
                </div>

                {/* Manual Close Button */}
                <button
                    onClick={handleDismiss}
                    aria-label="Close notification"
                    className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0"
                >
                    <FaTimes className="text-xs" />
                </button>

                {/* Shrinking Progress Timer Bar */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/[0.06]">
                    <div 
                        className={`h-full ${config.progressBar} transition-all ease-linear`}
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>
        </div>
    );
};

export default Toast;
