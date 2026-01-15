import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
    leftIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
    children,
    className = '',
    variant = 'primary',
    size = 'md',
    isLoading = false,
    leftIcon,
    disabled,
    ...props
}) => {
    const baseStyles = "inline-flex items-center justify-center font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

    const variants = {
        primary: "bg-purple text-white hover:bg-purple/90 focus:ring-purple",
        secondary: "bg-oxford text-white hover:bg-oxford/90 focus:ring-oxford",
        danger: "bg-error text-white hover:bg-red-600 focus:ring-error",
        ghost: "text-text-medium hover:bg-gray-100 hover:text-text-dark",
        outline: "border border-border text-text-medium hover:bg-gray-50",
    };

    const sizes = {
        sm: "px-3 py-1.5 text-sm",
        md: "px-4 py-2 text-base",
        lg: "px-6 py-3 text-lg",
    };

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : leftIcon ? (
                <span className="mr-2">{leftIcon}</span>
            ) : null}
            {children}
        </button>
    );
};
