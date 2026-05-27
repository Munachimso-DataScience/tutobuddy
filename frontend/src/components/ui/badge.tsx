import React from 'react';

function cn(...classes: Array<string | undefined | false | null>) {
    return classes.filter(Boolean).join(' ');
}

export function Badge({
    children,
    variant = 'default',
    className
}: {
    children: React.ReactNode;
    variant?: 'default' | 'secondary' | 'outline' | 'destructive';
    className?: string;
}) {
    const variantClasses = {
        default: 'bg-secondary text-white',
        secondary: 'bg-secondary/10 text-secondary',
        outline: 'border border-primary/15 text-foreground/70 dark:text-cream/70 bg-transparent',
        destructive: 'bg-red-500 text-white'
    }[variant];

    return (
        <span className={cn('inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold', variantClasses, className)}>
            {children}
        </span>
    );
}
