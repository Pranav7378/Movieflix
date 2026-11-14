import React from 'react';

const SkeletonLoader: React.FC = () => {
    return (
        <div className="mb-12 px-4 sm:px-6 lg:px-8">
            <div className="w-48 h-6 backdrop-blur-md bg-white/[0.05] rounded-xl animate-pulse mb-4" />
            <div 
                className="flex gap-4 sm:gap-5 overflow-x-hidden py-2"
                style={{ scrollbarWidth: 'none' }}
            >
                {[...Array(6)].map((_, index) => (
                    <div key={index} className="flex-shrink-0 w-44 sm:w-48 md:w-52">
                        <div className="aspect-[2/3] w-full backdrop-blur-md bg-white/[0.04] border border-white/10 rounded-2xl animate-pulse" />
                        <div className="mt-2.5 space-y-1.5">
                            <div className="w-3/4 h-3.5 backdrop-blur-md bg-white/[0.05] rounded-md animate-pulse" />
                            <div className="w-1/2 h-3 backdrop-blur-md bg-white/[0.03] rounded-md animate-pulse" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SkeletonLoader;
