import React, { useState } from 'react';

interface BrandLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ className = '', size = 'md' }) => {
  const [hasError, setHasError] = useState(false);

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-20 h-20'
  };

  const currentSize = sizeClasses[size] || sizeClasses.md;

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 rounded-xl overflow-hidden ${currentSize} ${className}`}
      aria-label="INTEGRITAS360 Brand Emblem"
    >
      <img
        src={hasError ? '/brand-icon.svg' : '/logo.png'}
        alt="Integritas360 Logo"
        className="w-full h-full object-cover rounded-xl shadow-md ring-1 ring-amber-500/30 hover:ring-amber-400/60 transition-all drop-shadow-md"
        onError={() => setHasError(true)}
      />
    </div>
  );
};
