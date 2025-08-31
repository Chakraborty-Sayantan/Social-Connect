"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

interface ChartData {
    day: string;
    count: number;
}

export function UsersChart({ data }: { data: ChartData[] }) {
    const formattedData = data.map(item => ({
        day: format(new Date(item.day), 'MMM d'),
        signups: item.count
    }));

    return (
        <ResponsiveContainer width="100%" height={300}>
            <LineChart data={formattedData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="signups" stroke="#8884d8" activeDot={{ r: 8 }} />
            </LineChart>
        </ResponsiveContainer>
    );
}