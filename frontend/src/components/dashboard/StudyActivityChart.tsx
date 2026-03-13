'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface StudyActivityChartProps {
    logs?: any[];
}

export default function StudyActivityChart({ logs = [] }: StudyActivityChartProps) {
    // Process logs into daily activity
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date().getDay();
    
    // Create last 7 days array
    const chartData = Array.from({ length: 7 }).map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        const dayLabel = days[d.getDay()];
        
        // Count logs for this specific date
        const count = logs.filter(log => {
            const logDate = new Date(log.timestamp);
            return logDate.toDateString() === d.toDateString();
        }).length;

        return { day: dayLabel, count: count || 0.1 }; // 0.1 for minimal visual presence
    });

    return (
        <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis
                        dataKey="day"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#9ca3af', fontSize: 12 }}
                        dy={10}
                    />
                    <YAxis hide />
                    <Tooltip
                        cursor={{ fill: 'transparent' }}
                        contentStyle={{
                            borderRadius: '12px',
                            border: 'none',
                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                            fontSize: '12px',
                            fontWeight: 'bold'
                        }}
                    />
                    <Bar
                        dataKey="count"
                        radius={[6, 6, 0, 0]}
                    >
                        {chartData.map((entry, index) => (
                            <Cell 
                                key={`cell-${index}`} 
                                fill={index === 6 ? '#2563eb' : '#93c5fd'} 
                            />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
