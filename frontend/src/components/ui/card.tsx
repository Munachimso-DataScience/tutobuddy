import React from 'react';

function cn(...classes: Array<string | undefined | false | null>) {
    return classes.filter(Boolean).join(' ');
}

export function Card({
    children,
    className
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div className={cn('rounded-3xl border border-primary/10 bg-surface/90 p-6 shadow-sm dark:bg-surface-2/90 dark:border-primary/20', className)}>
            {children}
        </div>
    );
}
