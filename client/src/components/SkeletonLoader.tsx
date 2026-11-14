import React from 'react';

const SkeletonLoader: React.FC = () => {
    return (
        <div className="mb-12 px-4 sm:px-6 lg:px-8">
            <div className="w-48 h-6 bg-cinecue-surface rounded animate-pulse mb-4" />
            <div 
                className="flex gap-4 sm:gap-5 overflow-x-hidden py-2"
                style={{ scrollbarWidth: 'none' }}
            >
                {[...Array(6)].map((_, index) => (
                    <div key={index} className="flex-shrink-0 w-44 sm:w-48 md:w-52">
                        <div className="aspect-[2/3] w-full bg-cinecue-surface border border-cinecue-border/40 rounded-xl animate-pulse" />
                        <div className="mt-2.5 space-y-1.5">
                            <div className="w-3/4 h-3.5 bg-cinecue-surface rounded animate-pulse" />
                            <div className="w-1/2 h-3 bg-cinecue-surface rounded animate-pulse" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SkeletonLoader;
