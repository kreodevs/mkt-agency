import * as React from "react"
import useEmblaCarousel, {
    type UseEmblaCarouselType,
} from "embla-carousel-react"
import { ArrowLeft, ArrowRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/atoms/Button"

import Autoplay from "embla-carousel-autoplay"

type CarouselApi = UseEmblaCarouselType[1]
type CarouselOptions = Parameters<typeof useEmblaCarousel>[0]
type CarouselPlugins = Parameters<typeof useEmblaCarousel>[1]

type CarouselProps = {
    opts?: CarouselOptions
    plugins?: CarouselPlugins
    orientation?: "horizontal" | "vertical"
    setApi?: (api: CarouselApi) => void
    autoPlay?: boolean
    delay?: number
    controlsPosition?: "sides" | "bottom" | "top" | "static"
    controlsOffset?: "inner" | "outer"
    controlsShape?: "circle" | "rounded" | "square"
    controlsVariant?: "default" | "secondary" | "outline" | "ghost" | "destructive" | "link"
}

type CarouselContextProps = {
    carouselRef: ReturnType<typeof useEmblaCarousel>[0]
    api: ReturnType<typeof useEmblaCarousel>[1]
    scrollPrev: () => void
    scrollNext: () => void
    scrollTo: (index: number) => void
    canScrollPrev: boolean
    canScrollNext: boolean
    selectedIndex: number
    scrollSnaps: number[]
} & CarouselProps

const CarouselContext = React.createContext<CarouselContextProps | null>(null)

function useCarousel() {
    const context = React.useContext(CarouselContext)

    if (!context) {
        throw new Error("useCarousel must be used within a <Carousel />")
    }

    return context
}

const Carousel = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & CarouselProps
>(
    (
        {
            orientation = "horizontal",
            opts,
            setApi,
            plugins = [],
            autoPlay = false,
            delay = 4000,
            controlsPosition = "sides",
            controlsOffset = "outer",
            controlsShape = "circle",
            controlsVariant = "outline",
            className,
            children,
            ...props
        },
        ref
    ) => {
        const carouselPlugins = React.useMemo(() => {
            const p = [...(plugins || [])]
            if (autoPlay) {
                p.push(Autoplay({ delay, stopOnInteraction: true }))
            }
            return p
        }, [plugins, autoPlay, delay])

        const [carouselRef, api] = useEmblaCarousel(
            {
                ...opts,
                axis: orientation === "horizontal" ? "x" : "y",
            },
            carouselPlugins
        )
        const [canScrollPrev, setCanScrollPrev] = React.useState(false)
        const [canScrollNext, setCanScrollNext] = React.useState(false)
        const [selectedIndex, setSelectedIndex] = React.useState(0)
        const [scrollSnaps, setScrollSnaps] = React.useState<number[]>([])

        const onSelect = React.useCallback((api: CarouselApi) => {
            if (!api) {
                return
            }

            setSelectedIndex(api.selectedScrollSnap())
            setCanScrollPrev(api.canScrollPrev())
            setCanScrollNext(api.canScrollNext())
        }, [])

        const onInit = React.useCallback((api: CarouselApi) => {
            if (!api) {
                return
            }
            setScrollSnaps(api.scrollSnapList())
        }, [])

        const scrollPrev = React.useCallback(() => {
            api?.scrollPrev()
        }, [api])

        const scrollNext = React.useCallback(() => {
            api?.scrollNext()
        }, [api])

        const scrollTo = React.useCallback((index: number) => {
            api?.scrollTo(index)
        }, [api])

        const handleKeyDown = React.useCallback(
            (event: React.KeyboardEvent<HTMLDivElement>) => {
                if (event.key === "ArrowLeft") {
                    event.preventDefault()
                    scrollPrev()
                } else if (event.key === "ArrowRight") {
                    event.preventDefault()
                    scrollNext()
                }
            },
            [scrollPrev, scrollNext]
        )

        React.useEffect(() => {
            if (!api || !setApi) {
                return
            }

            setApi(api)
        }, [api, setApi])

        React.useEffect(() => {
            if (!api) {
                return
            }

            onInit(api)
            onSelect(api)
            api.on("reInit", onInit)
            api.on("reInit", onSelect)
            api.on("select", onSelect)

            return () => {
                api?.off("select", onSelect)
            }
        }, [api, onInit, onSelect])

        return (
            <CarouselContext.Provider
                value={{
                    carouselRef,
                    api: api,
                    opts,
                    orientation:
                        orientation || (opts?.axis === "y" ? "vertical" : "horizontal"),
                    scrollPrev,
                    scrollNext,
                    scrollTo,
                    canScrollPrev,
                    canScrollNext,
                    selectedIndex,
                    scrollSnaps,
                    controlsPosition,
                    controlsOffset,
                    controlsShape,
                    controlsVariant,
                }}
            >
                <div
                    ref={ref}
                    onKeyDownCapture={handleKeyDown}
                    className={cn("relative", className)}
                    role="region"
                    aria-roledescription="carousel"
                    {...props}
                >
                    {children}
                </div>
            </CarouselContext.Provider>
        )
    }
)
Carousel.displayName = "Carousel"

const CarouselContent = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
    const { carouselRef, orientation } = useCarousel()

    return (
        <div ref={carouselRef} className="overflow-hidden">
            <div
                ref={ref}
                className={cn(
                    "flex",
                    orientation === "horizontal" ? "-ml-4" : "-mt-4 flex-col",
                    className
                )}
                {...props}
            />
        </div>
    )
})
CarouselContent.displayName = "CarouselContent"

const CarouselItem = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
    const { orientation } = useCarousel()

    return (
        <div
            ref={ref}
            role="group"
            aria-roledescription="slide"
            className={cn(
                "min-w-0 shrink-0 grow-0 basis-full",
                orientation === "horizontal" ? "pl-[var(--spacing-md)]" : "pt-[var(--spacing-md)]",
                className
            )}
            {...props}
        />
    )
})
CarouselItem.displayName = "CarouselItem"

const CarouselPrevious = React.forwardRef<
    React.ElementRef<typeof Button>,
    React.ComponentProps<typeof Button>
>(({ className, variant, size = "icon", ...props }, ref) => {
    const {
        orientation,
        scrollPrev,
        canScrollPrev,
        controlsPosition,
        controlsOffset,
        controlsShape,
        controlsVariant,
    } = useCarousel()

    const shapeClasses = {
        circle: "rounded-full",
        rounded: "rounded-md",
        square: "rounded-none",
    }

    const pos = controlsPosition || "sides"
    const off = controlsOffset || "outer"
    const shape = controlsShape || "circle"

    const positionClasses = {
        sides: orientation === "horizontal"
            ? (off === "outer" ? "-left-12 top-1/2 -translate-y-1/2" : "left-4 top-1/2 -translate-y-1/2")
            : (off === "outer" ? "-top-12 left-1/2 -translate-x-1/2 rotate-90" : "top-4 left-1/2 -translate-x-1/2 rotate-90"),
        bottom: "static translate-y-0",
        top: "static translate-y-0",
        static: "static translate-y-0"
    }

    return (
        <Button
            ref={ref}
            variant={variant || controlsVariant || "outline"}
            size={size}
            className={cn(
                pos === "sides" ? "absolute" : "relative",
                "h-8 w-8 z-20",
                shapeClasses[shape],
                positionClasses[pos],
                className
            )}
            disabled={!canScrollPrev}
            onClick={scrollPrev}
            {...props}
        >
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Previous slide</span>
        </Button>
    )
})
CarouselPrevious.displayName = "CarouselPrevious"

const CarouselNext = React.forwardRef<
    React.ElementRef<typeof Button>,
    React.ComponentProps<typeof Button>
>(({ className, variant, size = "icon", ...props }, ref) => {
    const {
        orientation,
        scrollNext,
        canScrollNext,
        controlsPosition,
        controlsOffset,
        controlsShape,
        controlsVariant,
    } = useCarousel()

    const shapeClasses = {
        circle: "rounded-full",
        rounded: "rounded-md",
        square: "rounded-none",
    }

    const pos = controlsPosition || "sides"
    const off = controlsOffset || "outer"
    const shape = controlsShape || "circle"

    const positionClasses = {
        sides: orientation === "horizontal"
            ? (off === "outer" ? "-right-12 top-1/2 -translate-y-1/2" : "right-4 top-1/2 -translate-y-1/2")
            : (off === "outer" ? "-bottom-12 left-1/2 -translate-x-1/2 rotate-90" : "bottom-4 left-1/2 -translate-x-1/2 rotate-90"),
        bottom: "static translate-y-0",
        top: "static translate-y-0",
        static: "static translate-y-0"
    }

    return (
        <Button
            ref={ref}
            variant={variant || controlsVariant || "outline"}
            size={size}
            className={cn(
                pos === "sides" ? "absolute" : "relative",
                "h-8 w-8 z-20",
                shapeClasses[shape],
                positionClasses[pos],
                className
            )}
            disabled={!canScrollNext}
            onClick={scrollNext}
            {...props}
        >
            <ArrowRight className="h-4 w-4" />
            <span className="sr-only">Next slide</span>
        </Button>
    )
})
CarouselNext.displayName = "CarouselNext"

const CarouselDots = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
    const { scrollSnaps, selectedIndex, scrollTo } = useCarousel()

    if (scrollSnaps.length <= 1) return null

    return (
        <div
            ref={ref}
            className={cn("flex items-center justify-center gap-[var(--spacing-sm)]", className)}
            {...props}
        >
            {scrollSnaps.map((_, index) => (
                <button
                    key={index}
                    type="button"
                    className={cn(
                        "h-2 w-2 rounded-full transition-all duration-300",
                        index === selectedIndex
                            ? "bg-[var(--primary)] w-6"
                            : "bg-[var(--primary)] opacity-20 hover:opacity-40"
                    )}
                    onClick={() => scrollTo(index)}
                    aria-label={`Go to slide ${index + 1}`}
                />
            ))}
        </div>
    )
})
CarouselDots.displayName = "CarouselDots"

export {
    type CarouselApi,
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselPrevious,
    CarouselNext,
    CarouselDots,
}
