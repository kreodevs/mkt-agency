import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    Cell,
    PieChart,
    Pie,
    Legend,
    LineChart,
    Line,
    RadarChart,
    Radar,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    ScatterChart,
    Scatter,
    ZAxis,
    RadialBarChart,
    RadialBar
} from 'recharts';
import { cn } from '@/lib/utils';
import { forwardRef, useState, useEffect, useRef } from 'react';

/**
 * Custom hook to detect container height and prevent ResponsiveContainer collapse
 */
const useChartHeight = (providedHeight: number | string | undefined, defaultHeight: number = 400) => {
    const [height, setHeight] = useState<number | string>(providedHeight || defaultHeight);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // If the user provided a fixed height, we don't need to detect anything
        if (providedHeight) return;

        const measure = () => {
            if (containerRef.current) {
                const parent = containerRef.current.parentElement;
                if (parent) {
                    const parentHeight = parent.clientHeight;
                    // If parent has a height (even if flex/fixed), use it, otherwise fallback
                    if (parentHeight > 0) {
                        setHeight(parentHeight);
                    }
                }
            }
        };

        measure();
        window.addEventListener('resize', measure);
        return () => window.removeEventListener('resize', measure);
    }, [providedHeight]);

    return { height, containerRef };
};

// ============================================
// CONFIGURACIÓN DE COLORES LUXURY
// ============================================
const CHART_COLORS = [
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

interface BaseChartProps {
    data: any[];
    height?: number | string;
    className?: string;
    title?: string;
    subtitle?: string;
}

/**
 * Custom Tooltip with Luxury Styling
 */
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-[var(--card)] border border-[var(--border)] p-[var(--spacing-md)] rounded-[var(--radius-lg)] shadow-xl animate-in fade-in zoom-in duration-200">
                <p className="text-[10px] font-black text-[var(--foreground-subtle)] uppercase tracking-widest mb-[var(--spacing-sm)]">{label}</p>
                <div className="space-y-1.5">
                    {payload.map((entry: any, index: number) => (
                        <div key={index} className="flex items-center gap-[var(--spacing-md)]">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                            <span className="text-sm font-bold text-[var(--foreground)]">{entry.name}:</span>
                            <span className="text-sm font-mono text-[var(--primary)] font-black">{entry.value.toLocaleString()}</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
    return null;
};

/**
 * AreaChartModern - Gráfico de área con degradados premium.
 */
export const AreaChartModern = forwardRef<HTMLDivElement, BaseChartProps & { categories: string[], dataKey: string }>(
    ({ data, categories, dataKey, height: propsHeight, title, subtitle, className }, ref) => {
        const { height, containerRef } = useChartHeight(propsHeight);

        return (
            <div ref={ref} className={cn("bg-[var(--card)] border border-[var(--border)] p-[var(--spacing-lg)] rounded-[var(--radius-2xl)] shadow-sm", className)}>
                {(title || subtitle) && (
                    <div className="mb-0">
                        {title && <h3 className="text-lg font-black text-[var(--foreground)] tracking-tight">{title}</h3>}
                        {subtitle && <p className="text-xs text-[var(--foreground-muted)] font-medium">{subtitle}</p>}
                    </div>
                )}
                <div ref={containerRef} className="w-full mt-[var(--spacing-md)]" style={{ height }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <defs>
                                {categories.map((cat, i) => (
                                    <linearGradient key={cat} id={`grad-${cat}`} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={CHART_COLORS[i % CHART_COLORS.length]} stopOpacity={0.3} />
                                        <stop offset="95%" stopColor={CHART_COLORS[i % CHART_COLORS.length]} stopOpacity={0} />
                                    </linearGradient>
                                ))}
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                            <XAxis
                                dataKey={dataKey}
                                stroke="var(--foreground-subtle)"
                                fontSize={10}
                                fontWeight="black"
                                tickLine={false}
                                axisLine={false}
                                dy={10}
                            />
                            <YAxis
                                stroke="var(--foreground-subtle)"
                                fontSize={10}
                                fontWeight="black"
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(val) => val.toLocaleString()}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--border)', strokeWidth: 1 }} />
                            <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: '20px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em' }} />
                            {categories.map((cat, i) => (
                                <Area
                                    key={cat}
                                    type="monotone"
                                    dataKey={cat}
                                    stroke={CHART_COLORS[i % CHART_COLORS.length]}
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill={`url(#grad-${cat})`}
                                    animationDuration={1500}
                                />
                            ))}
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        );
    }
);

/**
 * BarChartModern - Gráfico de barras minimalista.
 */
export const BarChartModern = forwardRef<HTMLDivElement, BaseChartProps & { categories: string[], dataKey: string }>(
    ({ data, categories, dataKey, height: propsHeight, title, subtitle, className }, ref) => {
        const { height, containerRef } = useChartHeight(propsHeight);

        return (
            <div ref={ref} className={cn("bg-[var(--card)] border border-[var(--border)] p-[var(--spacing-lg)] rounded-[var(--radius-2xl)] shadow-sm", className)}>
                {(title || subtitle) && (
                    <div className="mb-0">
                        {title && <h3 className="text-lg font-black text-[var(--foreground)] tracking-tight">{title}</h3>}
                        {subtitle && <p className="text-xs text-[var(--foreground-muted)] font-medium">{subtitle}</p>}
                    </div>
                )}
                <div ref={containerRef} className="w-full mt-[var(--spacing-md)]" style={{ height }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                            <XAxis
                                dataKey={dataKey}
                                stroke="var(--foreground-subtle)"
                                fontSize={10}
                                fontWeight="black"
                                tickLine={false}
                                axisLine={false}
                                dy={10}
                            />
                            <YAxis
                                stroke="var(--foreground-subtle)"
                                fontSize={10}
                                fontWeight="black"
                                tickLine={false}
                                axisLine={false}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--secondary)', opacity: 0.4 }} />
                            {categories.map((cat, i) => (
                                <Bar
                                    key={cat}
                                    dataKey={cat}
                                    fill={CHART_COLORS[i % CHART_COLORS.length]}
                                    radius={[4, 4, 0, 0]}
                                    animationDuration={1000}
                                />
                            ))}
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        );
    }
);

/**
 * DonutChartModern - Gráfico circular con centro informativo.
 */
export const DonutChartModern = forwardRef<HTMLDivElement, BaseChartProps & { valueKey: string, nameKey: string, centerLabel?: string, centerValue?: string }>(
    ({ data, valueKey, nameKey, height: propsHeight, title, subtitle, centerLabel, centerValue, className }, ref) => {
        const { height, containerRef } = useChartHeight(propsHeight);

        return (
            <div ref={ref} className={cn("relative bg-[var(--card)] border border-[var(--border)] p-[var(--spacing-lg)] rounded-[var(--radius-2xl)] shadow-sm", className)}>
                {(title || subtitle) && (
                    <div className="mb-0">
                        {title && <h3 className="text-lg font-black text-[var(--foreground)] tracking-tight">{title}</h3>}
                        {subtitle && <p className="text-xs text-[var(--foreground-muted)] font-medium">{subtitle}</p>}
                    </div>
                )}
                <div ref={containerRef} className="w-full mt-[var(--spacing-md)]" style={{ height }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius="70%"
                                outerRadius="90%"
                                paddingAngle={5}
                                dataKey={valueKey}
                                nameKey={nameKey}
                                animationDuration={1500}
                            >
                                {data.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} stroke="transparent" />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: 'bold' }} />
                        </PieChart>
                    </ResponsiveContainer>
                    {(centerLabel || centerValue) && (
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none mt-[var(--spacing-md)]">
                            {centerValue && <span className="text-2xl font-black text-[var(--foreground)] leading-none">{centerValue}</span>}
                            {centerLabel && <span className="text-[10px] font-black text-[var(--foreground-subtle)] uppercase tracking-widest mt-[var(--spacing-xs)]">{centerLabel}</span>}
                        </div>
                    )}
                </div>
            </div>
        );
    }
);

/**
 * LineChartModern - Gráfico de líneas moderno.
 */
export const LineChartModern = forwardRef<HTMLDivElement, BaseChartProps & { categories: string[], dataKey: string }>(
    ({ data, categories, dataKey, height: propsHeight, title, subtitle, className }, ref) => {
        const { height, containerRef } = useChartHeight(propsHeight);

        return (
            <div ref={ref} className={cn("bg-[var(--card)] border border-[var(--border)] p-[var(--spacing-lg)] rounded-[var(--radius-2xl)] shadow-sm", className)}>
                {(title || subtitle) && (
                    <div className="mb-0">
                        {title && <h3 className="text-lg font-black text-[var(--foreground)] tracking-tight">{title}</h3>}
                        {subtitle && <p className="text-xs text-[var(--foreground-muted)] font-medium">{subtitle}</p>}
                    </div>
                )}
                <div ref={containerRef} className="w-full mt-[var(--spacing-md)]" style={{ height }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                            <XAxis
                                dataKey={dataKey}
                                stroke="var(--foreground-subtle)"
                                fontSize={10}
                                fontWeight="black"
                                tickLine={false}
                                axisLine={false}
                                dy={10}
                            />
                            <YAxis
                                stroke="var(--foreground-subtle)"
                                fontSize={10}
                                fontWeight="black"
                                tickLine={false}
                                axisLine={false}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--border)', strokeWidth: 1 }} />
                            <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: '20px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em' }} />
                            {categories.map((cat, i) => (
                                <Line
                                    key={cat}
                                    type="monotone"
                                    dataKey={cat}
                                    stroke={CHART_COLORS[i % CHART_COLORS.length]}
                                    strokeWidth={3}
                                    dot={{ strokeWidth: 2, r: 4, fill: 'var(--card)' }}
                                    activeDot={{ r: 6, strokeWidth: 0, fill: CHART_COLORS[i % CHART_COLORS.length] }}
                                    animationDuration={1500}
                                />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        );
    }
);

/**
 * PieChartModern - Gráfico de pastel tradicional (sin centro vacío).
 */
export const PieChartModern = forwardRef<HTMLDivElement, BaseChartProps & { valueKey: string, nameKey: string }>(
    ({ data, valueKey, nameKey, height: propsHeight, title, subtitle, className }, ref) => {
        const { height, containerRef } = useChartHeight(propsHeight);

        return (
            <div ref={ref} className={cn("relative bg-[var(--card)] border border-[var(--border)] p-[var(--spacing-lg)] rounded-[var(--radius-2xl)] shadow-sm", className)}>
                {(title || subtitle) && (
                    <div className="mb-0">
                        {title && <h3 className="text-lg font-black text-[var(--foreground)] tracking-tight">{title}</h3>}
                        {subtitle && <p className="text-xs text-[var(--foreground-muted)] font-medium">{subtitle}</p>}
                    </div>
                )}
                <div ref={containerRef} className="w-full mt-[var(--spacing-md)]" style={{ height }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                outerRadius="90%"
                                dataKey={valueKey}
                                nameKey={nameKey}
                                animationDuration={1500}
                                label={({ cx = 0, cy = 0, midAngle = 0, innerRadius = 0, outerRadius = 0, value }) => {
                                    const RADIAN = Math.PI / 180;
                                    const radius = Number(innerRadius) + (Number(outerRadius) - Number(innerRadius)) * 0.5;
                                    const x = Number(cx) + radius * Math.cos(-midAngle * RADIAN);
                                    const y = Number(cy) + radius * Math.sin(-midAngle * RADIAN);
                                    return (
                                        <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight="bold">
                                            {value}
                                        </text>
                                    );
                                }}
                                labelLine={false}
                            >
                                {data.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} stroke="var(--card)" strokeWidth={2} />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: 'bold' }} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        );
    }
);

/**
 * RadarChartModern - Gráfico de radar (araña) para comparativas multidimensionales.
 */
export const RadarChartModern = forwardRef<HTMLDivElement, BaseChartProps & { categories: string[], dataKey: string }>(
    ({ data, categories, dataKey, height: propsHeight, title, subtitle, className }, ref) => {
        const { height, containerRef } = useChartHeight(propsHeight);

        return (
            <div ref={ref} className={cn("bg-[var(--card)] border border-[var(--border)] p-[var(--spacing-lg)] rounded-[var(--radius-2xl)] shadow-sm", className)}>
                {(title || subtitle) && (
                    <div className="mb-0">
                        {title && <h3 className="text-lg font-black text-[var(--foreground)] tracking-tight">{title}</h3>}
                        {subtitle && <p className="text-xs text-[var(--foreground-muted)] font-medium">{subtitle}</p>}
                    </div>
                )}
                <div ref={containerRef} className="w-full mt-[var(--spacing-md)]" style={{ height }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={data} cx="50%" cy="50%" outerRadius="80%">
                            <PolarGrid stroke="var(--border)" />
                            <PolarAngleAxis dataKey={dataKey} tick={{ fill: 'var(--foreground-subtle)', fontSize: 10, fontWeight: 'bold' }} />
                            <PolarRadiusAxis angle={30} domain={['auto', 'auto']} tick={{ fill: 'var(--foreground-subtle)', fontSize: 10 }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: 'bold' }} />
                            {categories.map((cat, i) => (
                                <Radar
                                    key={cat}
                                    name={cat}
                                    dataKey={cat}
                                    stroke={CHART_COLORS[i % CHART_COLORS.length]}
                                    fill={CHART_COLORS[i % CHART_COLORS.length]}
                                    fillOpacity={0.4}
                                    animationDuration={1500}
                                />
                            ))}
                        </RadarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        );
    }
);

/**
 * ScatterChartModern - Gráfico de dispersión para correlaciones.
 */
export const ScatterChartModern = forwardRef<HTMLDivElement, BaseChartProps & { xKey: string, yKey: string, zKey?: string, nameKey?: string }>(
    ({ data, xKey, yKey, zKey, nameKey, height: propsHeight, title, subtitle, className }, ref) => {
        const { height, containerRef } = useChartHeight(propsHeight);

        return (
            <div ref={ref} className={cn("bg-[var(--card)] border border-[var(--border)] p-[var(--spacing-lg)] rounded-[var(--radius-2xl)] shadow-sm", className)}>
                {(title || subtitle) && (
                    <div className="mb-0">
                        {title && <h3 className="text-lg font-black text-[var(--foreground)] tracking-tight">{title}</h3>}
                        {subtitle && <p className="text-xs text-[var(--foreground-muted)] font-medium">{subtitle}</p>}
                    </div>
                )}
                <div ref={containerRef} className="w-full mt-[var(--spacing-md)]" style={{ height }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                            <XAxis
                                type="number"
                                dataKey={xKey}
                                name={xKey}
                                stroke="var(--foreground-subtle)"
                                fontSize={10}
                                fontWeight="black"
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                type="number"
                                dataKey={yKey}
                                name={yKey}
                                stroke="var(--foreground-subtle)"
                                fontSize={10}
                                fontWeight="black"
                                tickLine={false}
                                axisLine={false}
                            />
                            {zKey && <ZAxis type="number" dataKey={zKey} range={[60, 400]} name={zKey} />}
                            <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                            <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: '20px', fontSize: '10px', fontWeight: 'bold' }} />
                            <Scatter
                                name={nameKey || "Datos"}
                                data={data}
                                fill={CHART_COLORS[0]}
                                animationDuration={1500}
                            >
                                {data.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                ))}
                            </Scatter>
                        </ScatterChart>
                    </ResponsiveContainer>
                </div>
            </div>
        );
    }
);

/**
 * RadialBarChartModern - Gráfico de barras radiales concéntricas.
 */
export const RadialBarChartModern = forwardRef<HTMLDivElement, BaseChartProps & { valueKey: string }>(
    ({ data, valueKey, height: propsHeight, title, subtitle, className }, ref) => {
        const { height, containerRef } = useChartHeight(propsHeight);

        return (
            <div ref={ref} className={cn("bg-[var(--card)] border border-[var(--border)] p-[var(--spacing-lg)] rounded-[var(--radius-2xl)] shadow-sm", className)}>
                {(title || subtitle) && (
                    <div className="mb-0">
                        {title && <h3 className="text-lg font-black text-[var(--foreground)] tracking-tight">{title}</h3>}
                        {subtitle && <p className="text-xs text-[var(--foreground-muted)] font-medium">{subtitle}</p>}
                    </div>
                )}
                <div ref={containerRef} className="w-full mt-[var(--spacing-md)]" style={{ height }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <RadialBarChart cx="50%" cy="50%" innerRadius="10%" outerRadius="80%" barSize={10} data={data}>
                            <RadialBar
                                label={{ position: 'insideStart', fill: 'var(--foreground)', fontSize: 10, fontWeight: 'bold' }}
                                background
                                dataKey={valueKey}
                                animationDuration={1500}
                            >
                                {data.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                ))}
                            </RadialBar>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend iconSize={10} verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: 'bold' }} />
                        </RadialBarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        );
    }
);

/**
 * PolarAreaChartModern - Gráfico de área polar (segmentos tipo pie con radios variables).
 */
export const PolarAreaChartModern = forwardRef<HTMLDivElement, BaseChartProps & { categories: string[], dataKey: string }>(
    ({ data, categories, dataKey, height: propsHeight, title, subtitle, className }, ref) => {
        const { height, containerRef } = useChartHeight(propsHeight);

        return (
            <div ref={ref} className={cn("bg-[var(--card)] border border-[var(--border)] p-[var(--spacing-lg)] rounded-[var(--radius-2xl)] shadow-sm", className)}>
                {(title || subtitle) && (
                    <div className="mb-0">
                        {title && <h3 className="text-lg font-black text-[var(--foreground)] tracking-tight">{title}</h3>}
                        {subtitle && <p className="text-xs text-[var(--foreground-muted)] font-medium">{subtitle}</p>}
                    </div>
                )}
                <div ref={containerRef} className="w-full mt-[var(--spacing-md)]" style={{ height }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
                            <PolarGrid stroke="var(--border)" />
                            <PolarAngleAxis dataKey={dataKey} tick={{ fill: 'var(--foreground-subtle)', fontSize: 10, fontWeight: 'bold' }} />
                            <PolarRadiusAxis angle={90} domain={[0, 'auto']} tick={false} axisLine={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: 'bold' }} />
                            {categories.map((cat, i) => (
                                <Radar
                                    key={cat}
                                    name={cat}
                                    dataKey={cat}
                                    stroke={CHART_COLORS[i % CHART_COLORS.length]}
                                    fill={CHART_COLORS[i % CHART_COLORS.length]}
                                    fillOpacity={0.6}
                                    strokeWidth={2}
                                    animationDuration={1500}
                                />
                            ))}
                        </RadarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        );
    }
);

AreaChartModern.displayName = 'AreaChartModern';
BarChartModern.displayName = 'BarChartModern';
DonutChartModern.displayName = 'DonutChartModern';
LineChartModern.displayName = 'LineChartModern';
PieChartModern.displayName = 'PieChartModern';
RadarChartModern.displayName = 'RadarChartModern';
ScatterChartModern.displayName = 'ScatterChartModern';
RadialBarChartModern.displayName = 'RadialBarChartModern';
PolarAreaChartModern.displayName = 'PolarAreaChartModern';
