import { forwardRef, useState, useCallback, useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight, X, Maximize } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface GalleryImage {
    src: string
    alt: string
    title?: string
    description?: string
}

export interface GalleryProps {
    images?: GalleryImage[]
    /** @deprecated Use `images` instead */
    value?: GalleryImage[]
    showThumbnails?: boolean
    autoPlay?: boolean
    interval?: number
    className?: string
}

export const Gallery = forwardRef<HTMLDivElement, GalleryProps>(
    ({
        images,
        value,
        showThumbnails = true,
        autoPlay = false,
        interval = 3000,
        className,
    }, ref) => {
        const galleryImages = images || value || []
        const [activeIndex, setActiveIndex] = useState(0)
        const [isFullscreen, setIsFullscreen] = useState(false)
        const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

        const goToPrev = useCallback(() => {
            setActiveIndex(prev =>
                prev === 0 ? galleryImages.length - 1 : prev - 1
            )
        }, [galleryImages.length])

        const goToNext = useCallback(() => {
            setActiveIndex(prev =>
                prev === galleryImages.length - 1 ? 0 : prev + 1
            )
        }, [galleryImages.length])

        const handlePrev = useCallback(() => {
            goToPrev()
            if (timerRef.current) {
                clearInterval(timerRef.current)
                if (autoPlay) {
                    timerRef.current = setInterval(goToNext, interval)
                }
            }
        }, [goToPrev, autoPlay, goToNext, interval])

        const handleNext = useCallback(() => {
            goToNext()
            if (timerRef.current) {
                clearInterval(timerRef.current)
                if (autoPlay) {
                    timerRef.current = setInterval(goToNext, interval)
                }
            }
        }, [goToNext, autoPlay, interval])

        const handleThumbnailClick = useCallback((index: number) => {
            if (index === activeIndex) return
            setActiveIndex(index)
            if (timerRef.current) {
                clearInterval(timerRef.current)
                if (autoPlay) {
                    timerRef.current = setInterval(goToNext, interval)
                }
            }
        }, [activeIndex, autoPlay, goToNext, interval])

        const toggleFullscreen = useCallback(() => {
            setIsFullscreen(prev => !prev)
        }, [])

        // Auto-play
        useEffect(() => {
            if (!autoPlay || galleryImages.length <= 1) return
            timerRef.current = setInterval(goToNext, interval)
            return () => {
                if (timerRef.current) {
                    clearInterval(timerRef.current)
                    timerRef.current = null
                }
            }
        }, [autoPlay, interval, goToNext, galleryImages.length])

        // Pause auto-play when fullscreen
        useEffect(() => {
            if (isFullscreen && timerRef.current) {
                clearInterval(timerRef.current)
                timerRef.current = null
            } else if (autoPlay && galleryImages.length > 1) {
                timerRef.current = setInterval(goToNext, interval)
            }
            return () => {
                if (timerRef.current) {
                    clearInterval(timerRef.current)
                    timerRef.current = null
                }
            }
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [isFullscreen])

        // Keyboard navigation
        useEffect(() => {
            const handleKeyDown = (e: KeyboardEvent) => {
                if (e.key === 'ArrowLeft') handlePrev()
                if (e.key === 'ArrowRight') handleNext()
                if (e.key === 'Escape' && isFullscreen) setIsFullscreen(false)
            }
            window.addEventListener('keydown', handleKeyDown)
            return () => window.removeEventListener('keydown', handleKeyDown)
        }, [handlePrev, handleNext, isFullscreen])

        if (!galleryImages.length) return null

        const currentImage = galleryImages[activeIndex]

        const renderNavButton = (
            direction: 'prev' | 'next',
            onClick: () => void,
            className?: string
        ) => {
            const Icon = direction === 'prev' ? ChevronLeft : ChevronRight
            const label = direction === 'prev' ? 'Previous image' : 'Next image'
            return (
                <button
                    type="button"
                    onClick={onClick}
                    className={cn(
                        'absolute top-1/2 -translate-y-1/2 z-10',
                        'bg-[var(--card)]/80 text-[var(--primary)]',
                        'rounded-full w-10 h-10',
                        'flex items-center justify-center',
                        'hover:bg-[var(--card)] hover:text-[var(--primary-hover)]',
                        'transition-all duration-[var(--transition-fast)]',
                        'opacity-0 group-hover:opacity-100 focus:opacity-100',
                        'focus-visible:ring-2 focus-visible:ring-[var(--ring)]',
                        direction === 'prev' ? 'left-[var(--spacing-md)]' : 'right-[var(--spacing-md)]',
                        className
                    )}
                    aria-label={label}
                >
                    <Icon className="w-5 h-5" />
                </button>
            )
        }

        return (
            <div
                ref={ref}
                className={cn('gallery-container', className)}
                role="region"
                aria-label="Image gallery"
                aria-roledescription="carousel"
            >
                {/* Main image area */}
                <div className="relative group overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--background-secondary)]">
                    <div className="w-full aspect-video">
                        <img
                            src={currentImage.src}
                            alt={currentImage.alt}
                            className="w-full h-full object-cover transition-opacity duration-[var(--transition-base)]"
                            draggable={false}
                        />
                    </div>

                    {/* Navigation arrows */}
                    {galleryImages.length > 1 && (
                        <>
                            {renderNavButton('prev', handlePrev)}
                            {renderNavButton('next', handleNext)}
                        </>
                    )}

                    {/* Fullscreen toggle */}
                    <button
                        type="button"
                        onClick={toggleFullscreen}
                        className={cn(
                            'absolute top-[var(--spacing-md)] right-[var(--spacing-md)] z-10',
                            'bg-[var(--card)]/80 text-[var(--foreground)]',
                            'rounded-full w-8 h-8',
                            'flex items-center justify-center',
                            'hover:bg-[var(--card)]',
                            'transition-all duration-[var(--transition-fast)]',
                            'opacity-0 group-hover:opacity-100 focus:opacity-100',
                            'focus-visible:ring-2 focus-visible:ring-[var(--ring)]'
                        )}
                        aria-label="Open fullscreen"
                    >
                        <Maximize className="w-4 h-4" />
                    </button>

                    {/* Title / description overlay */}
                    {(currentImage.title || currentImage.description) && (
                        <div className={cn(
                            'absolute bottom-0 left-0 right-0',
                            'bg-gradient-to-t from-black/60 to-transparent',
                            'p-[var(--spacing-md)] pt-8'
                        )}>
                            {currentImage.title && (
                                <h3 className="text-white text-lg font-semibold">
                                    {currentImage.title}
                                </h3>
                            )}
                            {currentImage.description && (
                                <p className="text-white/80 text-sm mt-[var(--spacing-xxs)]">
                                    {currentImage.description}
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {/* Thumbnails strip */}
                {showThumbnails && galleryImages.length > 1 && (
                    <div
                        className={cn(
                            'flex gap-[var(--spacing-sm)] mt-[var(--spacing-md)]',
                            'overflow-x-auto pb-[var(--spacing-xs)]'
                        )}
                        role="tablist"
                        aria-label="Image thumbnails"
                    >
                        {galleryImages.map((image, index) => (
                            <button
                                key={index}
                                type="button"
                                onClick={() => handleThumbnailClick(index)}
                                role="tab"
                                aria-selected={index === activeIndex}
                                aria-label={`View ${image.alt}${image.title ? ` - ${image.title}` : ''}`}
                                className={cn(
                                    'flex-shrink-0 overflow-hidden rounded-[var(--radius-sm)]',
                                    'border transition-all duration-[var(--transition-fast)]',
                                    'focus-visible:ring-2 focus-visible:ring-[var(--ring)]',
                                    index === activeIndex
                                        ? 'border-[var(--primary)] opacity-100 ring-2 ring-[var(--ring)] ring-offset-1 ring-offset-[var(--background)]'
                                        : 'border-[var(--border)] opacity-60 hover:opacity-100'
                                )}
                            >
                                <img
                                    src={image.src}
                                    alt={image.alt}
                                    className="w-20 h-16 object-cover"
                                    draggable={false}
                                />
                            </button>
                        ))}
                    </div>
                )}

                {/* Fullscreen overlay */}
                {isFullscreen && (
                    <div
                        className={cn(
                            'fixed inset-0 z-[var(--z-modal)]',
                            'bg-black/95 flex items-center justify-center',
                            'animate-in fade-in zoom-in duration-[var(--transition-slow)]'
                        )}
                        role="dialog"
                        aria-modal="true"
                        aria-label="Fullscreen gallery"
                    >
                        <div className="relative w-full h-full flex flex-col items-center justify-center p-[var(--spacing-xl)]">
                            {/* Main fullscreen image */}
                            <img
                                src={currentImage.src}
                                alt={currentImage.alt}
                                className="max-w-full max-h-[85vh] object-contain select-none"
                                draggable={false}
                            />

                            {/* Fullscreen navigation */}
                            {galleryImages.length > 1 && (
                                <>
                                    <button
                                        type="button"
                                        onClick={handlePrev}
                                        className={cn(
                                            'absolute left-[var(--spacing-md)] top-1/2 -translate-y-1/2',
                                            'bg-white/10 text-white rounded-full w-12 h-12',
                                            'flex items-center justify-center',
                                            'hover:bg-white/20 transition-all duration-[var(--transition-fast)]',
                                            'focus-visible:ring-2 focus-visible:ring-white'
                                        )}
                                        aria-label="Previous image"
                                    >
                                        <ChevronLeft className="w-6 h-6" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleNext}
                                        className={cn(
                                            'absolute right-[var(--spacing-md)] top-1/2 -translate-y-1/2',
                                            'bg-white/10 text-white rounded-full w-12 h-12',
                                            'flex items-center justify-center',
                                            'hover:bg-white/20 transition-all duration-[var(--transition-fast)]',
                                            'focus-visible:ring-2 focus-visible:ring-white'
                                        )}
                                        aria-label="Next image"
                                    >
                                        <ChevronRight className="w-6 h-6" />
                                    </button>
                                </>
                            )}

                            {/* Close button */}
                            <button
                                type="button"
                                onClick={toggleFullscreen}
                                className={cn(
                                    'absolute top-[var(--spacing-md)] right-[var(--spacing-md)]',
                                    'bg-white/10 text-white rounded-full w-10 h-10',
                                    'flex items-center justify-center',
                                    'hover:bg-white/20 transition-all duration-[var(--transition-fast)]',
                                    'focus-visible:ring-2 focus-visible:ring-white'
                                )}
                                aria-label="Close fullscreen"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            {/* Image counter */}
                            <div className="absolute top-[var(--spacing-lg)] left-1/2 -translate-x-1/2 text-white/60 text-sm">
                                {activeIndex + 1} / {galleryImages.length}
                            </div>

                            {/* Title/description in fullscreen */}
                            {(currentImage.title || currentImage.description) && (
                                <div className="absolute bottom-[var(--spacing-2xl)] left-1/2 -translate-x-1/2 text-center max-w-lg">
                                    {currentImage.title && (
                                        <h3 className="text-white text-xl font-semibold">
                                            {currentImage.title}
                                        </h3>
                                    )}
                                    {currentImage.description && (
                                        <p className="text-white/70 text-sm mt-[var(--spacing-xs)]">
                                            {currentImage.description}
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Thumbnails in fullscreen */}
                            {showThumbnails && galleryImages.length > 1 && (
                                <div
                                    className={cn(
                                        'absolute bottom-[var(--spacing-md)] left-1/2 -translate-x-1/2',
                                        'flex gap-[var(--spacing-xs)] overflow-x-auto',
                                        'px-[var(--spacing-md)] py-[var(--spacing-xs)] max-w-[90vw]'
                                    )}
                                >
                                    {galleryImages.map((image, index) => (
                                        <button
                                            key={index}
                                            type="button"
                                            onClick={() => handleThumbnailClick(index)}
                                            className={cn(
                                                'flex-shrink-0 overflow-hidden rounded border-2 transition-all',
                                                'focus-visible:ring-2 focus-visible:ring-white',
                                                index === activeIndex
                                                    ? 'border-white opacity-100'
                                                    : 'border-transparent opacity-50 hover:opacity-80'
                                            )}
                                            aria-label={`View ${image.alt}`}
                                        >
                                            <img
                                                src={image.src}
                                                alt={image.alt}
                                                className="w-16 h-12 object-cover"
                                                draggable={false}
                                            />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        )
    }
)

Gallery.displayName = 'Gallery'

export default Gallery
