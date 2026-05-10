
import React from 'react';
import ReactGridLayout, {
    Responsive,
    useContainerWidth,
    Layout,
    ResponsiveLayouts
} from 'react-grid-layout';
import { GridConfig, DragConfig, ResizeConfig, Compactor, verticalCompactor } from 'react-grid-layout/core';
import { GridBackground } from 'react-grid-layout/extras';
import { cn } from '@/lib/utils';

// Import mandatory styles from the library
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

export interface GridItemConfig {
    id: string;
    x: number;
    y: number;
    w: number;
    h: number;
    minW?: number;
    maxW?: number;
    minH?: number;
    maxH?: number;
    static?: boolean;
    isDraggable?: boolean;
    isResizable?: boolean;
}

export interface ModularGridProps {
    /** Layout definition for static mode or single breakpoint */
    layout?: Layout;
    /** Layouts for each breakpoint in responsive mode */
    layouts?: ResponsiveLayouts;
    /** Current children to render as grid items */
    children?: React.ReactNode;

    /** Grid measurement settings */
    gridConfig?: Partial<GridConfig>;
    /** Drag behavior settings */
    dragConfig?: Partial<DragConfig>;
    /** Resize behavior settings */
    resizeConfig?: Partial<ResizeConfig>;
    /** Compactor strategy */
    compactor?: Compactor;

    /** Breakpoints for responsive mode */
    breakpoints?: Record<string, number>;
    /** Columns per breakpoint */
    cols?: Record<string, number>;

    /** Show the dot grid background */
    showGridBackground?: boolean;
    /** Whether to use the responsive version */
    responsive?: boolean;

    /** Container class name */
    className?: string;
    /** Container style overrides */
    style?: React.CSSProperties;
    /** Pass-through props for styling */
    pt?: {
        root?: React.HTMLAttributes<HTMLDivElement>;
        background?: React.SVGAttributes<SVGSVGElement>;
        grid?: any;
    };

    /** Callback when layout changes */
    onLayoutChange?: (layout: Layout, layouts: ResponsiveLayouts) => void;
    /** Callback when breakpoint changes */
    onBreakpointChange?: (newBreakpoint: string, newCols: number) => void;
}

/**
 * ModularGrid - A premium, draggable and resizable grid layout system.
 * Built on top of React-Grid-Layout v2 with a modernized API.
 */
export const ModularGrid = ({
    layout,
    layouts,
    children,
    gridConfig = { cols: 12, rowHeight: 60, margin: [16, 16] },
    dragConfig = { enabled: true, handle: '.drag-handle' },
    resizeConfig = { enabled: true, handles: ['se'] },
    compactor = verticalCompactor,
    breakpoints = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 },
    cols = { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 },
    showGridBackground = true,
    responsive = true,
    className,
    style,
    pt,
    onLayoutChange,
    onBreakpointChange
}: ModularGridProps) => {
    // 1. Hook for reactive container width (V2 Recommended)
    const { width, containerRef, mounted } = useContainerWidth({
        measureBeforeMount: false,
        initialWidth: 1200
    });

    const isResponsive = responsive && !!layouts;
    const currentCols = isResponsive ? (cols.lg || 12) : (gridConfig.cols || 12);

    return (
        <div
            ref={containerRef}
            className={cn(
                "relative w-full min-h-[400px] rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--background)] transition-all duration-300",
                className,
                pt?.root?.className
            )}
            style={{ ...style, ...pt?.root?.style }}
            {...pt?.root}
        >
            {/* Dots Background from RGL Extras */}
            {showGridBackground && mounted && (
                <GridBackground
                    width={width}
                    cols={currentCols}
                    rowHeight={gridConfig.rowHeight || 60}
                    margin={gridConfig.margin || [16, 16]}
                    className={cn("opacity-[0.05] pointer-events-none absolute inset-0 text-[var(--primary)]", pt?.background?.className)}
                    style={pt?.background?.style}
                    {...(pt?.background as any)}
                />
            )}

            {mounted && (
                isResponsive ? (
                    <Responsive
                        width={width}
                        layouts={layouts}
                        breakpoints={breakpoints}
                        cols={cols}
                        rowHeight={gridConfig.rowHeight}
                        margin={gridConfig.margin}
                        containerPadding={gridConfig.containerPadding}
                        dragConfig={dragConfig}
                        resizeConfig={resizeConfig}
                        compactor={compactor}
                        onLayoutChange={onLayoutChange}
                        onBreakpointChange={onBreakpointChange}
                        className={cn("w-full h-full", pt?.grid?.className)}
                        {...pt?.grid}
                    >
                        {children}
                    </Responsive>
                ) : (
                    <ReactGridLayout
                        width={width}
                        layout={layout}
                        gridConfig={gridConfig}
                        dragConfig={dragConfig}
                        resizeConfig={resizeConfig}
                        compactor={compactor}
                        onLayoutChange={(newLayout) => onLayoutChange?.(newLayout, {})}
                        className={cn("w-full h-full", pt?.grid?.className)}
                        {...pt?.grid}
                    >
                        {children}
                    </ReactGridLayout>
                )
            )}
        </div>
    );
};

export default ModularGrid;
