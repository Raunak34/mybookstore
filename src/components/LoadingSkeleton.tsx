import React from 'react';

export const BookSkeletonList: React.FC = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
      {Array.from({ length: 4 }).map((_, idx) => (
        <div
          key={idx}
          className="bg-zinc-900/40 backdrop-blur-sm border border-zinc-800/60 rounded-2xl p-4 flex flex-col h-[420px] animate-pulse"
        >
          {/* Cover image skeleton */}
          <div className="w-full h-52 bg-zinc-800/80 rounded-xl mb-4 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-dashed border-zinc-700 animate-spin"></div>
          </div>
          {/* Title skeleton */}
          <div className="h-6 bg-zinc-800 rounded-md w-3/4 mb-2"></div>
          {/* Author skeleton */}
          <div className="h-4 bg-zinc-800 rounded-md w-1/2 mb-4"></div>
          {/* Rating skeleton */}
          <div className="flex gap-1 mb-6">
            {Array.from({ length: 5 }).map((_, s) => (
              <div key={s} className="w-4 h-4 bg-zinc-800 rounded-full"></div>
            ))}
          </div>
          {/* Price & action skeleton */}
          <div className="mt-auto flex items-center justify-between">
            <div className="h-6 bg-zinc-800 rounded-md w-1/4"></div>
            <div className="h-10 bg-zinc-800 rounded-lg w-1/3"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

export const StatsSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-pulse">
      {Array.from({ length: 4 }).map((_, idx) => (
        <div key={idx} className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 h-32">
          <div className="h-4 bg-zinc-800 rounded w-1/2 mb-4"></div>
          <div className="h-8 bg-zinc-800 rounded w-3/4"></div>
        </div>
      ))}
    </div>
  );
};
