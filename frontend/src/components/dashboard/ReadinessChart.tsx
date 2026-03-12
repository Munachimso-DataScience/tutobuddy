'use client';

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Label } from 'recharts';

interface ReadinessChartProps {
    percentage: number;
}

export default function ReadinessChart({ percentage }: ReadinessChartProps) {
    const data = [
        { name: 'Readiness', value: percentage },
        { name: 'Remaining', value: 100 - percentage },
    ];

    const COLORS = ['#2563eb', '#e5e7eb']; // blue-600, gray-200

    return (
        <div className="h-48 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="100%"
                        startAngle={180}
                        endAngle={0}
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={0}
                        dataKey="value"
                        stroke="none"
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                        <Label
                            value={`${percentage}%`}
                            position="centerBottom"
                            className="text-2xl font-bold fill-gray-900 dark:fill-white"
                            dy={-20}
                        />
                    </Pie>
                </PieChart>
            </ResponsiveContainer>
            <div className="absolute bottom-0 left-0 right-0 text-center">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-tighter">Exam Readiness</p>
            </div>
        </div>
    );
}
