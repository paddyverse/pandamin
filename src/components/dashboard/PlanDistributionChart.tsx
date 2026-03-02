'use client';

import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PlanDataPoint {
    planName: string;
    count: number;
    color: string;
}

interface PlanDistributionChartProps {
    data: PlanDataPoint[];
}

const CustomTooltip = ({
    active,
    payload,
}: {
    active?: boolean;
    payload?: Array<{ name: string; value: number; payload: PlanDataPoint }>;
}) => {
    if (active && payload && payload.length) {
        const item = payload[0];
        return (
            <div className="bg-white border border-slate-200 rounded-lg shadow-lg px-3 py-2 text-sm">
                <p className="font-medium text-slate-800">{item.name}</p>
                <p className="text-slate-600">
                    <span className="font-semibold text-slate-900">{item.value}</span> accounts
                </p>
            </div>
        );
    }
    return null;
};

const CustomLegend = ({ data }: { data: PlanDataPoint[] }) => (
    <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 mt-4">
        {data.map((entry) => (
            <div key={entry.planName} className="flex items-center gap-1.5">
                <span
                    className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: entry.color }}
                />
                <span className="text-xs text-slate-600">{entry.planName}</span>
                <span className="text-xs font-semibold text-slate-800">({entry.count})</span>
            </div>
        ))}
    </div>
);

export function PlanDistributionChart({ data }: PlanDistributionChartProps) {
    const total = data.reduce((sum, d) => sum + d.count, 0);

    return (
        <Card className="border-0 shadow-sm bg-white">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-slate-700">
                    SaaS Plan Distribution
                </CardTitle>
            </CardHeader>
            <CardContent>
                {data.length === 0 ? (
                    <div className="h-56 flex items-center justify-center text-slate-400 text-sm">
                        No plan data available
                    </div>
                ) : (
                    <>
                        <div className="relative">
                            <ResponsiveContainer width="100%" height={220}>
                                <PieChart>
                                    <Pie
                                        data={data}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={65}
                                        outerRadius={95}
                                        paddingAngle={3}
                                        dataKey="count"
                                        nameKey="planName"
                                        strokeWidth={2}
                                        stroke="#fff"
                                    >
                                        {data.map((entry) => (
                                            <Cell key={entry.planName} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                </PieChart>
                            </ResponsiveContainer>
                            {/* Center total label */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-2xl font-bold text-slate-800">{total}</span>
                                <span className="text-xs text-slate-400">accounts</span>
                            </div>
                        </div>
                        <CustomLegend data={data} />
                    </>
                )}
            </CardContent>
        </Card>
    );
}
