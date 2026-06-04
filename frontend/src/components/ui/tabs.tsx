'use client';

import React, { createContext, useContext, useMemo, useState } from 'react';

function cn(...classes: Array<string | undefined | false | null>) {
    return classes.filter(Boolean).join(' ');
}

type TabsContextValue = {
    value: string;
    setValue: (value: string) => void;
};

const TabsContext = createContext<TabsContextValue | null>(null);

export function Tabs({
    defaultValue,
    className,
    children
}: {
    defaultValue: string;
    className?: string;
    children: React.ReactNode;
}) {
    const [value, setValue] = useState(defaultValue);
    const contextValue = useMemo(() => ({ value, setValue }), [value]);

    return (
        <TabsContext.Provider value={contextValue}>
            <div className={className}>{children}</div>
        </TabsContext.Provider>
    );
}

export function TabsList({
    className,
    children
}: {
    className?: string;
    children: React.ReactNode;
}) {
    return <div className={cn('flex flex-wrap gap-2 rounded-2xl bg-background/60 p-2', className)}>{children}</div>;
}

export function TabsTrigger({
    value,
    className,
    children
}: {
    value: string;
    className?: string;
    children: React.ReactNode;
}) {
    const context = useContext(TabsContext);
    if (!context) {
        throw new Error('TabsTrigger must be used within Tabs');
    }

    const active = context.value === value;
    return (
        <button
            type="button"
            onClick={() => context.setValue(value)}
            className={cn(
                'relative overflow-hidden rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200',
                active
                    ? "bg-secondary/10 text-secondary shadow-sm ring-1 ring-secondary/15 after:pointer-events-none after:absolute after:inset-x-4 after:bottom-1 after:h-0.5 after:rounded-full after:bg-secondary after:content-['']"
                    : 'bg-transparent text-foreground/70 hover:bg-secondary/10 hover:text-foreground hover:shadow-sm hover:ring-1 hover:ring-secondary/10 dark:text-cream/70',
                className
            )}
        >
            {children}
        </button>
    );
}

export function TabsContent({
    value,
    className,
    children
}: {
    value: string;
    className?: string;
    children: React.ReactNode;
}) {
    const context = useContext(TabsContext);
    if (!context) {
        throw new Error('TabsContent must be used within Tabs');
    }

    if (context.value !== value) {
        return null;
    }

    return <div className={cn('mt-6', className)}>{children}</div>;
}
