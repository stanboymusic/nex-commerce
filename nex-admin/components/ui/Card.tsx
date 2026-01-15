import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    title?: string;
    description?: string;
    footer?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
    children,
    className = '',
    title,
    description,
    footer
}) => {
    return (
        <div className={`bg-white rounded-xl border border-border shadow-sm overflow-hidden ${className}`}>
            {(title || description) && (
                <div className="px-6 py-4 border-b border-border">
                    {title && <h3 className="text-lg font-bold text-oxford">{title}</h3>}
                    {description && <p className="text-sm text-text-medium mt-1">{description}</p>}
                </div>
            )}
            <div className="p-6">
                {children}
            </div>
            {footer && (
                <div className="px-6 py-4 bg-gray-50 border-t border-border">
                    {footer}
                </div>
            )}
        </div>
    );
};
