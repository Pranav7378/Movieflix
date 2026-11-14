import React from 'react';

const SkeletonLoader: React.FC = () => {
    return (
        <div className="flex gap-4 px-4 md:px-8 mb-8">
            {[...Array(6)].map((_, index) => (
                <div key={index} className="flex-shrink-0 w-48 lg:w-56">
                    <div className="w-full h-72 bg-netflix-gray-medium animate-pulse rounded-md" />
                </div>
            ))}
        </div>
    );
};

export default SkeletonLoader;
