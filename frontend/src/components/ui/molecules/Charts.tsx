import {
    BarChart as ReBarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart as ReLineChart,
    Line,
    PieChart as RePieChart,
    Pie,
    Cell,
    Legend
} from 'recharts';
import { forwardRef } from 'react';

// ============================================
// CONFIGURACIÓN DE COLORES LUXURY
// ============================================
const LUXURY_COLORS = [
    'var(--chart-1)',
    'var(--chart-2)',
    'var(--chart-3)',
    'var(--chart-4)',
    'var(--chart-5)',
    'var(--chart-6)',
    'var(--chart-7)',
    'var(--chart-8)',
    'var(--chart-9)',
    'var(--chart-10)',
];

// ============================================
// COMPONENTES DE GRÁFICOS
// ============================================

interface BaseChartProps {
    data: any[];
    height?: number | string;
    className?: string;
}

/**
 * BarChart Component
 */
export const BarChart = forwardRef<HTMLDivElement, BaseChartProps & { dataKey: string; categories: string[] }>(
    ({ data, dataKey, categories, height = 300, className = "" }, ref) => {
        return (
            <div ref={ref} className={`w-full ${className}`} style={{ height }}>
                <ResponsiveContainer width="100%" height="100%">
                    <ReBarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                        <XAxis
                            dataKey={dataKey}
                            stroke="var(--foreground-muted)"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            stroke="var(--foreground-muted)"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `$${value}`}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'var(--card)',
                                borderColor: 'var(--border)',
                                borderRadius: 'var(--radius)',
                                color: 'var(--foreground)'
                            }}
                            itemStyle={{ color: 'var(--primary)' }}
                        />
                        {categories.map((category, index) => (
                            <Bar
                                key={category}
                                dataKey={category}
                                fill={LUXURY_COLORS[index % LUXURY_COLORS.length]}
                                radius={[4, 4, 0, 0]}
                            />
                        ))}
                    </ReBarChart>
                </ResponsiveContainer>
            </div>
        );
    }
);

BarChart.displayName = 'BarChart';

/**
 * LineChart Component
 */
export const LineChart = forwardRef<HTMLDivElement, BaseChartProps & { dataKey: string; categories: string[] }>(
    ({ data, dataKey, categories, height = 300, className = "" }, ref) => {
        return (
            <div ref={ref} className={`w-full ${className}`} style={{ height }}>
                <ResponsiveContainer width="100%" height="100%">
                    <ReLineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                        <XAxis
                            dataKey={dataKey}
                            stroke="var(--foreground-muted)"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            stroke="var(--foreground-muted)"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'var(--card)',
                                borderColor: 'var(--border)',
                                borderRadius: 'var(--radius)',
                                color: 'var(--foreground)'
                            }}
                        />
                        <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                        {categories.map((category, index) => (
                            <Line
                                key={category}
                                type="monotone"
                                dataKey={category}
                                stroke={LUXURY_COLORS[index % LUXURY_COLORS.length]}
                                strokeWidth={2}
                                dot={{ fill: LUXURY_COLORS[index % LUXURY_COLORS.length], r: 4 }}
                                activeDot={{ r: 6, strokeWidth: 0 }}
                            />
                        ))}
                    </ReLineChart>
                </ResponsiveContainer>
            </div>
        );
    }
);

LineChart.displayName = 'LineChart';

/**
 * DonutChart Component
 */
export const DonutChart = forwardRef<HTMLDivElement, BaseChartProps & { nameKey: string; valueKey: string }>(
    ({ data, nameKey, valueKey, height = 300, className = "" }, ref) => {
        return (
            <div ref={ref} className={`w-full ${className}`} style={{ height }}>
                <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey={valueKey}
                            nameKey={nameKey}
                        >
                            {data.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={LUXURY_COLORS[index % LUXURY_COLORS.length]} stroke="transparent" />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'var(--card)',
                                borderColor: 'var(--border)',
                                borderRadius: 'var(--radius)',
                                color: 'var(--foreground)'
                            }}
                        />
                        <Legend verticalAlign="bottom" height={36} />
                    </RePieChart>
                </ResponsiveContainer>
            </div>
        );
    }
);

DonutChart.displayName = 'DonutChart';
