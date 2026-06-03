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
        <div className={cn('rounded-3xl border border-primary/10 bg-[#10161d] text-white p-6 shadow-sm dark:border-primary/20 [&_.text-muted-foreground]:text-white/70 [&_.text-foreground]:text-white [&_.text-foreground\\/70]:text-white/70 [&_.text-gray-500]:text-white/70 [&_.text-gray-900]:text-white [&_.bg-muted]:bg-white/10 [&_.bg-background]:bg-[#1a2332] [&_.border-border]:border-white/10', className)}>
            {children}
        </div>
    );
}
