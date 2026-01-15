import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    leftIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, leftIcon, className = '', ...props }, ref) => {
        return (
            <div className="w-full">
                {label && (
                    <label className="block text-sm font-medium text-text-dark mb-1">
                        {label}
                    </label>
                )}
                <div className="relative">
                    {leftIcon && (
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-light">
                            {leftIcon}
                        </div>
                    )}
                    <input
                        ref={ref}
                        className={`
              w-full rounded-lg border bg-white px-4 py-2 text-text-dark transition-colors
              placeholder:text-text-light focus:outline-none focus:ring-2
              ${error
                                ? 'border-error focus:border-error focus:ring-error/20'
                                : 'border-border focus:border-purple focus:ring-purple/20'}
              ${leftIcon ? 'pl-10' : ''}
              ${className}
            `}
                        {...props}
                    />
                </div>
                {error && (
                    <p className="mt-1 text-sm text-error">{error}</p>
                )}
            </div>
        );
    }
);
Input.displayName = 'Input';
