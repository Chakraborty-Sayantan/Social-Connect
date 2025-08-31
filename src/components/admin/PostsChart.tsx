"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

interface ChartData {
    day: string;
    count: number;
}

export function PostsChart({ data }: { data: ChartData[] }) {
     const formattedData = data.map(item => ({
        day: format(new Date(item.day), 'MMM d'),
        posts: item.count
    }));

    return (
        <ResponsiveContainer width="100%" height={300}>
            <LineChart data={formattedData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="posts" stroke="#82ca9d" />
            </LineChart>
        </ResponsiveContainer>
    );
}