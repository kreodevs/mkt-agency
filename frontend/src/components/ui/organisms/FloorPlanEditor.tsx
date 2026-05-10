import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Stage, Layer, Rect, Circle, Transformer, Group, Text, Image as KonvaImage } from 'react-konva';
import useImage from 'use-image';
import { cn } from '@/lib/utils';
import { Button } from "@/components/atoms/Button";
import { Sparkles, Loader2 } from 'lucide-react';
import Konva from 'konva';

export type ShapeType = 'rect' | 'circle' | 'image';

export interface ProductCatalogItem {
    id: string;
    name: string;
    type: ShapeType;
    defaultWidth?: number;
    defaultHeight?: number;
    defaultRadius?: number;
    icon?: React.ReactNode;
    src?: string;
    fill?: string;
}

export interface FloorPlanItem {
    id: string;
    type: ShapeType;
    x: number;
    y: number;
    width?: number;
    height?: number;
    radius?: number;
    rotation: number;
    fill?: string;
    label?: string;
    src?: string;
}

export interface FloorPlanEditorProps {
    initialItems?: FloorPlanItem[];
    onChange?: (items: FloorPlanItem[]) => void;
    width?: number; // Initial width, but stage is responsive
    height?: number; // Height of the canvas area
    readOnly?: boolean;
    className?: string;
    availableProducts?: ProductCatalogItem[];
    geminiApiKey?: string;
    onGenerateRender?: (imageUrl: string) => void;
}

// Sub-component for individual Shape rendering with its own Ref to handle Transformer
const MovableShape = ({
    item,
    isSelected,
    onSelect,
    onChange,
    readOnly
}: {
    item: FloorPlanItem;
    isSelected: boolean;
    onSelect: () => void;
    onChange: (newAttrs: FloorPlanItem) => void;
    readOnly: boolean;
}) => {
    const shapeRef = useRef<any>(null);
    const trRef = useRef<any>(null);
    const [image] = useImage(item.src || '');

    useEffect(() => {
        if (isSelected && !readOnly && trRef.current && shapeRef.current) {
            trRef.current.nodes([shapeRef.current]);
            trRef.current.getLayer().batchDraw();
        }
    }, [isSelected, readOnly]);

    return (
        <React.Fragment>
            <Group
                ref={shapeRef}
                x={item.x}
                y={item.y}
                rotation={item.rotation}
                draggable={!readOnly}
                onClick={onSelect}
                onTap={onSelect}
                onDragEnd={(e) => {
                    onChange({
                        ...item,
                        x: e.target.x(),
                        y: e.target.y(),
                    });
                }}
                onTransformEnd={() => {
                    // Transformer changes scale, we need to convert scale back to width/height
                    const node = shapeRef.current;
                    const scaleX = node.scaleX();
                    const scaleY = node.scaleY();

                    // Reset scale back to 1 instantly while updating internal width/height to avoid recursive scaling
                    node.scaleX(1);
                    node.scaleY(1);

                    onChange({
                        ...item,
                        x: node.x(),
                        y: node.y(),
                        rotation: node.rotation(),
                        ...(item.type === 'rect' && { width: Math.max(5, (item.width || 50) * scaleX) }),
                        ...(item.type === 'rect' && { height: Math.max(5, (item.height || 50) * scaleY) }),
                        ...(item.type === 'circle' && { radius: Math.max(5, (item.radius || 25) * scaleX) }),
                        ...(item.type === 'image' && { width: Math.max(10, (item.width || 100) * scaleX) }),
                        ...(item.type === 'image' && { height: Math.max(10, (item.height || 100) * scaleY) })
                    });
                }}
            >
                {item.type === 'rect' && (
                    <Rect
                        width={item.width || 50}
                        height={item.height || 50}
                        fill={item.fill || 'var(--card)'}
                        stroke="var(--foreground)"
                        strokeWidth={1}
                        cornerRadius={4}
                        shadowColor="black"
                        shadowBlur={isSelected ? 10 : 2}
                        shadowOpacity={0.2}
                    />
                )}
                {item.type === 'circle' && (
                    <Circle
                        radius={item.radius || 25}
                        fill={item.fill || 'var(--card)'}
                        stroke="var(--foreground)"
                        strokeWidth={1}
                        shadowColor="black"
                        shadowBlur={isSelected ? 10 : 2}
                        shadowOpacity={0.2}
                    />
                )}
                {item.type === 'image' && (
                    <KonvaImage
                        image={image}
                        width={item.width || 100}
                        height={item.height || 100}
                        shadowColor="black"
                        shadowBlur={isSelected ? 10 : 2}
                        shadowOpacity={0.2}
                    />
                )}
                {item.label && (
                    <Text
                        text={item.label}
                        fontSize={12}
                        fontFamily="Inter, sans-serif"
                        fill="var(--foreground)"
                        align="center"
                        verticalAlign="middle"
                        width={item.type === 'circle' ? (item.radius || 25) * 2 : (item.width || 50)}
                        height={item.type === 'circle' ? (item.radius || 25) * 2 : (item.height || 50)}
                        offsetX={item.type === 'circle' ? (item.radius || 25) : 0}
                        offsetY={item.type === 'circle' ? (item.radius || 25) : 0}
                    />
                )}
            </Group>

            {isSelected && !readOnly && (
                <Transformer
                    ref={trRef}
                    boundBoxFunc={(oldBox, newBox) => {
                        // Limit minimum size
                        if (newBox.width < 10 || newBox.height < 10) {
                            return oldBox;
                        }
                        return newBox;
                    }}
                    anchorSize={8}
                    anchorCornerRadius={2}
                    borderStroke="#3b82f6" // accent color roughly
                    anchorStroke="#3b82f6"
                    anchorFill="#ffffff"
                />
            )}
        </React.Fragment>
    );
};

export const FloorPlanEditor = ({
    initialItems = [],
    onChange,
    width = 800,
    height = 600,
    readOnly = false,
    className,
    availableProducts,
    geminiApiKey,
    onGenerateRender
}: FloorPlanEditorProps) => {

    const containerRef = useRef<HTMLDivElement>(null);
    const stageRef = useRef<any>(null);
    const [dimensions, setDimensions] = useState({ width, height });
    const [items, setItems] = useState<FloorPlanItem[]>(initialItems);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    // Sync state upward
    useEffect(() => {
        onChange?.(items);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [items]);

    // Handle responsive resizing of Canvas
    useEffect(() => {
        const handleResize = () => {
            if (containerRef.current) {
                setDimensions({
                    width: containerRef.current.offsetWidth,
                    height: containerRef.current.offsetHeight
                });
            }
        };

        // Initial size
        handleResize();

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Hotkeys handling
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (readOnly) return;
            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (selectedId) {
                    setItems(prev => prev.filter(it => it.id !== selectedId));
                    setSelectedId(null);
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedId, readOnly]);

    const checkDeselect = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
        // Deselect when clicked on empty background
        const clickedOnEmpty = e.target === e.target.getStage();
        if (clickedOnEmpty) {
            setSelectedId(null);
        }
    };

    const handleShapeChange = useCallback((id: string, newAttrs: FloorPlanItem) => {
        setItems((prev) => prev.map((item) => (item.id === id ? newAttrs : item)));
    }, []);

    const handleAddProduct = useCallback((prod: ProductCatalogItem) => {
        const newItem: FloorPlanItem = {
            id: 'item-' + Math.random().toString(36).substr(2, 9),
            type: prod.type,
            x: dimensions.width / 2 - (prod.defaultWidth || 50) / 2 + (Math.random() * 40 - 20),
            y: dimensions.height / 2 - (prod.defaultHeight || 50) / 2 + (Math.random() * 40 - 20),
            rotation: 0,
            label: prod.name,
            src: prod.src,
            fill: prod.fill,
            ...(prod.type === 'rect' && { width: prod.defaultWidth || 60, height: prod.defaultHeight || 60 }),
            ...(prod.type === 'image' && { width: prod.defaultWidth || 100, height: prod.defaultHeight || 100 }),
            ...(prod.type === 'circle' && { radius: prod.defaultRadius || 30 })
        };
        setItems(prev => [...prev, newItem]);
        setSelectedId(newItem.id);
    }, [dimensions]);

    const generateRender = async () => {
        if (!geminiApiKey || !stageRef.current) return;

        // Deselect immediately so handles aren't in the render
        setSelectedId(null);

        setTimeout(async () => {
            setIsGenerating(true);
            try {
                // For a highly descriptive prompt we analyze the items
                const sceneDescription = items.map(i => `${i.label} at x:${Math.round(i.x)} y:${Math.round(i.y)}`).join(', ');
                const prompt = `A highly realistic, photorealistic 3D top-down render of an event room layout. Professional architectural visualization, soft lighting, 4k resolution, cinematic lighting. The scene contains: ${sceneDescription}`;

                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${geminiApiKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        instances: [{ "prompt": prompt }],
                        parameters: { "sampleCount": 1 }
                    })
                });

                if (!response.ok) {
                    const text = await response.text();
                    throw new Error('Error in Gemini API: ' + text);
                }

                const result = await response.json();

                if (result.predictions && result.predictions[0] && result.predictions[0].bytesBase64Encoded) {
                    const finalImage = `data:image/png;base64,${result.predictions[0].bytesBase64Encoded}`;
                    onGenerateRender?.(finalImage);
                } else {
                    console.error("Unexpected Gemini response format", result);
                    alert("No se pudo generar el render con Imagen 3. Asegúrate de tener permisos API o revisa la consola.");
                }

            } catch (err: any) {
                console.error(err);
                alert("Error generando render: " + err.message);
            } finally {
                setIsGenerating(false);
            }
        }, 100);
    };

    return (
        <div
            className={cn("w-full flex flex-row overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--background)] shadow-sm", className)}
            style={{ minHeight: height }}
            tabIndex={0} // Allows capturing keyboard events like Delete
        >
            {/* Sidebar Products Catalog */}
            {availableProducts && !readOnly && (
                <div className="w-64 border-r border-[var(--border)] bg-[var(--card)] p-[var(--spacing-md)] flex flex-col gap-[var(--spacing-md)] overflow-y-auto">
                    <div className="flex flex-col gap-[var(--spacing-xs)]">
                        <h3 className="font-semibold text-[var(--foreground)]">Catálogo</h3>
                        <p className="text-xs text-[var(--foreground-muted)]">Clica para agregar al lienzo.</p>
                    </div>
                    <div className="flex flex-col gap-[var(--spacing-sm)] mt-[var(--spacing-sm)]">
                        {availableProducts.map(prod => (
                            <Button
                                key={prod.id}
                                variant="outline"
                                className="justify-start text-left h-auto py-[var(--spacing-sm)] px-[var(--spacing-md)] flex flex-row items-center whitespace-normal"
                                onClick={() => handleAddProduct(prod)}
                            >
                                {prod.icon && <span className="mr-[var(--spacing-md)] flex-shrink-0 text-[var(--foreground-muted)]">{prod.icon}</span>}
                                <span className="text-sm font-medium leading-tight">{prod.name}</span>
                            </Button>
                        ))}
                    </div>

                    {geminiApiKey && (
                        <div className="mt-auto pt-[var(--spacing-md)] border-t border-[var(--border)] flex flex-col gap-[var(--spacing-sm)]">
                            <p className="text-xs text-[var(--foreground-muted)] text-center mb-[var(--spacing-xs)]">Crea una foto real del acomodo actual con IA</p>
                            <Button
                                variant="default"
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                                onClick={generateRender}
                                disabled={isGenerating || items.length === 0}
                            >
                                {isGenerating ? <Loader2 className="w-4 h-4 mr-[var(--spacing-sm)] animate-spin" /> : <Sparkles className="w-4 h-4 mr-[var(--spacing-sm)]" />}
                                {isGenerating ? 'Generando...' : 'Render 3D Mágico'}
                            </Button>
                        </div>
                    )}
                </div>
            )}

            {/* Canvas Area */}
            <div ref={containerRef} className="flex-1 relative bg-[#f8fbff] dark:bg-[#0f1115]">
                {/* Background Grid Pattern purely done with CSS */}
                <div className="absolute inset-0 pointer-events-none opacity-[0.4] dark:opacity-[0.2]"
                    style={{
                        backgroundImage: 'radial-gradient(var(--foreground-muted) 1px, transparent 0)',
                        backgroundSize: '20px 20px'
                    }}
                />

                <Stage
                    ref={stageRef}
                    width={dimensions.width}
                    height={dimensions.height}
                    onMouseDown={checkDeselect}
                    onTouchStart={checkDeselect}
                    className="absolute inset-0"
                >
                    <Layer>
                        {items.map((item) => (
                            <MovableShape
                                key={item.id}
                                item={item}
                                isSelected={item.id === selectedId}
                                onSelect={() => !readOnly && setSelectedId(item.id)}
                                onChange={(newAttrs) => handleShapeChange(item.id, newAttrs)}
                                readOnly={readOnly}
                            />
                        ))}
                    </Layer>
                </Stage>
            </div>
        </div>
    );
};
