import { forwardRef, useMemo, useState, useCallback, ReactNode } from 'react'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock } from 'lucide-react'

// ===== Types =====
export interface Resource {
  id: string | number
  name: string
  avatar?: string
  subtitle?: string
  color?: string
}

export interface ResourceEvent {
  id: string | number
  resourceId: string | number
  title: string
  start: Date
  end: Date
  color?: string
  description?: string
  status?: 'confirmed' | 'pending' | 'cancelled'
  data?: any
}

export interface TimeSlot {
  hour: number
  minute: number
  label: string
}

export interface ResourceCalendarProps {
  resources: Resource[]
  events: ResourceEvent[]
  date?: Date
  startHour?: number
  endHour?: number
  slotDuration?: 15 | 30 | 60
  onEventClick?: (event: ResourceEvent) => void
  onSlotClick?: (resourceId: string | number, date: Date) => void
  onDateChange?: (date: Date) => void
  headerTemplate?: (resource: Resource) => ReactNode
  eventTemplate?: (event: ResourceEvent) => ReactNode
  emptySlotTemplate?: (resourceId: string | number, date: Date) => ReactNode
  showCurrentTime?: boolean
  minEventHeight?: number
  className?: string
}

// ===== Helper Functions =====
const formatTime = (hour: number, minute: number): string => {
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
}

const getEventPosition = (
  event: ResourceEvent,
  startHour: number,
  slotDuration: number,
  slotHeight: number
): { top: number; height: number } => {
  const eventStartHour = event.start.getHours()
  const eventStartMinute = event.start.getMinutes()
  const eventEndHour = event.end.getHours()
  const eventEndMinute = event.end.getMinutes()

  const startMinutesFromDayStart = (eventStartHour - startHour) * 60 + eventStartMinute
  const endMinutesFromDayStart = (eventEndHour - startHour) * 60 + eventEndMinute
  const durationMinutes = endMinutesFromDayStart - startMinutesFromDayStart

  const pixelsPerMinute = slotHeight / slotDuration

  return {
    top: startMinutesFromDayStart * pixelsPerMinute,
    height: Math.max(durationMinutes * pixelsPerMinute, slotHeight),
  }
}

const isSameDay = (date1: Date, date2: Date): boolean => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  )
}

const statusColors: Record<string, { bg: string; border: string; text: string }> = {
  confirmed: {
    bg: 'bg-[var(--accent)]/20',
    border: 'border-[var(--accent)]',
    text: 'text-[var(--accent)]',
  },
  pending: {
    bg: 'bg-[var(--warning)]/20',
    border: 'border-[var(--warning)]',
    text: 'text-[var(--warning)]',
  },
  cancelled: {
    bg: 'bg-[var(--destructive)]/20',
    border: 'border-[var(--destructive)]',
    text: 'text-[var(--destructive)] line-through',
  },
}

// ===== Component =====
export const ResourceCalendar = forwardRef<HTMLDivElement, ResourceCalendarProps>(
  (
    {
      resources,
      events,
      date = new Date(),
      startHour = 8,
      endHour = 18,
      slotDuration = 30,
      onEventClick,
      onSlotClick,
      onDateChange,
      headerTemplate,
      eventTemplate,
      emptySlotTemplate,
      showCurrentTime = true,
      minEventHeight = 40,
      className = '',
    },
    ref
  ) => {
    const [currentDate, setCurrentDate] = useState(date)
    const slotHeight = slotDuration === 15 ? 24 : slotDuration === 30 ? 32 : 48

    // Generate time slots
    const timeSlots = useMemo((): TimeSlot[] => {
      const slots: TimeSlot[] = []
      for (let hour = startHour; hour < endHour; hour++) {
        for (let minute = 0; minute < 60; minute += slotDuration) {
          slots.push({
            hour,
            minute,
            label: formatTime(hour, minute),
          })
        }
      }
      return slots
    }, [startHour, endHour, slotDuration])

    // Filter events for current date
    const filteredEvents = useMemo(() => {
      return events.filter((event) => isSameDay(event.start, currentDate))
    }, [events, currentDate])

    // Get events for a specific resource
    const getResourceEvents = useCallback(
      (resourceId: string | number) => {
        return filteredEvents.filter((event) => event.resourceId === resourceId)
      },
      [filteredEvents]
    )

    // Current time indicator position
    const currentTimePosition = useMemo(() => {
      const now = new Date()
      if (!isSameDay(now, currentDate)) return null

      const currentHour = now.getHours()
      const currentMinute = now.getMinutes()

      if (currentHour < startHour || currentHour >= endHour) return null

      const minutesFromStart = (currentHour - startHour) * 60 + currentMinute
      const pixelsPerMinute = slotHeight / slotDuration
      return minutesFromStart * pixelsPerMinute
    }, [currentDate, startHour, endHour, slotDuration, slotHeight])

    // Navigation handlers
    const goToPreviousDay = () => {
      const newDate = new Date(currentDate)
      newDate.setDate(newDate.getDate() - 1)
      setCurrentDate(newDate)
      onDateChange?.(newDate)
    }

    const goToNextDay = () => {
      const newDate = new Date(currentDate)
      newDate.setDate(newDate.getDate() + 1)
      setCurrentDate(newDate)
      onDateChange?.(newDate)
    }

    const goToToday = () => {
      const today = new Date()
      setCurrentDate(today)
      onDateChange?.(today)
    }

    // Slot click handler
    const handleSlotClick = (resourceId: string | number, slot: TimeSlot) => {
      if (!onSlotClick) return
      const slotDate = new Date(currentDate)
      slotDate.setHours(slot.hour, slot.minute, 0, 0)
      onSlotClick(resourceId, slotDate)
    }

    // Default event renderer
    const renderEvent = (event: ResourceEvent) => {
      if (eventTemplate) return eventTemplate(event)

      const status = event.status || 'confirmed'
      const colors = statusColors[status]

      return (
        <div
          className={`
            absolute left-1 right-1 px-[var(--spacing-sm)] py-[var(--spacing-xs)]
            rounded-[var(--radius-sm)]
            border-l-2 ${colors.bg}
            cursor-pointer
            transition-all duration-150
            hover:shadow-md hover:scale-[1.02]
            overflow-hidden
          `}
          style={{ borderLeftColor: event.color || 'var(--accent)' }}
          onClick={(e) => {
            e.stopPropagation()
            onEventClick?.(event)
          }}
        >
          <p className={`text-xs font-medium truncate ${colors.text}`} style={{ color: event.color }}>
            {event.title}
          </p>
          <p className="text-[10px] text-[var(--foreground-muted)] truncate">
            {formatTime(event.start.getHours(), event.start.getMinutes())} -{' '}
            {formatTime(event.end.getHours(), event.end.getMinutes())}
          </p>
          {event.description && (
            <p className="text-[10px] text-[var(--foreground-subtle)] truncate mt-[var(--spacing-xxs)]">
              {event.description}
            </p>
          )}
        </div>
      )
    }

    // Default header renderer
    const renderResourceHeader = (resource: Resource) => {
      if (headerTemplate) return headerTemplate(resource)

      return (
        <div className="flex items-center gap-[var(--spacing-sm)] px-[var(--spacing-md)] py-[var(--spacing-sm)]">
          {resource.avatar ? (
            <img
              src={resource.avatar}
              alt={resource.name}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium"
              style={{
                backgroundColor: resource.color || 'var(--accent)',
                color: 'var(--accent-foreground)',
              }}
            >
              {resource.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-medium text-[var(--foreground)] truncate">
              {resource.name}
            </p>
            {resource.subtitle && (
              <p className="text-xs text-[var(--foreground-muted)] truncate">
                {resource.subtitle}
              </p>
            )}
          </div>
        </div>
      )
    }

    const isToday = isSameDay(currentDate, new Date())

    return (
      <div
        ref={ref}
        className={`rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] overflow-hidden ${className}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-[var(--spacing-md)] py-[var(--spacing-md)] border-b border-[var(--border)] bg-[var(--secondary)]">
          <div className="flex items-center gap-[var(--spacing-md)]">
            <div className="flex items-center gap-[var(--spacing-xs)]">
              <button
                onClick={goToPreviousDay}
                className="p-1.5 rounded-[var(--radius-sm)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={goToNextDay}
                className="p-1.5 rounded-[var(--radius-sm)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-[var(--spacing-sm)]">
              <CalendarIcon className="w-4 h-4 text-[var(--accent)]" />
              <h2 className="text-sm font-semibold text-[var(--foreground)]">
                {currentDate.toLocaleDateString('es-ES', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </h2>
              {isToday && (
                <span className="px-[var(--spacing-sm)] py-[var(--spacing-xxs)] text-[10px] font-medium rounded-full bg-[var(--accent)] text-[var(--accent-foreground)]">
                  Hoy
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-[var(--spacing-sm)]">
            <button
              onClick={goToToday}
              className="px-[var(--spacing-md)] py-1.5 text-xs font-medium rounded-[var(--radius)] border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
            >
              Hoy
            </button>
            <div className="flex items-center gap-[var(--spacing-xs)] text-xs text-[var(--foreground-muted)]">
              <Clock className="w-3.5 h-3.5" />
              <span>{resources.length} recursos</span>
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="overflow-auto">
          <div className="min-w-[800px]">
            {/* Resource Headers */}
            <div className="flex border-b border-[var(--border)] bg-[var(--secondary)]/50 sticky top-0 z-10">
              {/* Time column header */}
              <div className="w-16 shrink-0 px-[var(--spacing-sm)] py-[var(--spacing-sm)] border-r border-[var(--border)]">
                <Clock className="w-4 h-4 text-[var(--foreground-muted)] mx-auto" />
              </div>
              {/* Resource headers */}
              {resources.map((resource) => (
                <div
                  key={resource.id}
                  className="flex-1 min-w-[150px] border-r border-[var(--border)] last:border-r-0"
                >
                  {renderResourceHeader(resource)}
                </div>
              ))}
            </div>

            {/* Time Grid */}
            <div className="relative">
              {/* Current time indicator */}
              {showCurrentTime && currentTimePosition !== null && (
                <div
                  className="absolute left-0 right-0 z-20 pointer-events-none"
                  style={{ top: currentTimePosition }}
                >
                  <div className="flex items-center">
                    <div className="w-16 flex justify-end pr-[var(--spacing-xs)]">
                      <div className="w-2 h-2 rounded-full bg-[var(--destructive)]" />
                    </div>
                    <div className="flex-1 h-px bg-[var(--destructive)]" />
                  </div>
                </div>
              )}

              {/* Time slots */}
              {timeSlots.map((slot, slotIndex) => (
                <div
                  key={`${slot.hour}-${slot.minute}`}
                  className={`flex border-b border-[var(--border)] ${slot.minute === 0 ? 'border-b-[var(--border)]' : 'border-b-[var(--border)]/50'
                    }`}
                  style={{ height: slotHeight }}
                >
                  {/* Time label */}
                  <div className="w-16 shrink-0 px-[var(--spacing-sm)] border-r border-[var(--border)] flex items-start justify-end">
                    {slot.minute === 0 && (
                      <span className="text-[10px] text-[var(--foreground-muted)] -mt-1.5">
                        {slot.label}
                      </span>
                    )}
                  </div>

                  {/* Resource columns */}
                  {resources.map((resource) => {
                    const isFirstSlot = slotIndex === 0

                    return (
                      <div
                        key={resource.id}
                        className={`
                          flex-1 min-w-[150px] relative
                          border-r border-[var(--border)]/50 last:border-r-0
                          hover:bg-[var(--secondary)]/30
                          cursor-pointer
                          transition-colors
                        `}
                        onClick={() => handleSlotClick(resource.id, slot)}
                      >
                        {/* Render events for first slot of each resource */}
                        {isFirstSlot && (
                          <div className="absolute inset-0 pointer-events-none">
                            {getResourceEvents(resource.id).map((event) => {
                              const position = getEventPosition(
                                event,
                                startHour,
                                slotDuration,
                                slotHeight
                              )
                              return (
                                <div
                                  key={event.id}
                                  className="absolute left-0 right-0 pointer-events-auto"
                                  style={{
                                    top: position.top,
                                    height: Math.max(position.height, minEventHeight),
                                  }}
                                >
                                  {renderEvent(event)}
                                </div>
                              )
                            })}
                          </div>
                        )}

                        {/* Empty slot template */}
                        {emptySlotTemplate && !getResourceEvents(resource.id).some(
                          (e) =>
                            e.start.getHours() === slot.hour &&
                            e.start.getMinutes() === slot.minute
                        ) && (
                            <div className="absolute inset-0 pointer-events-none">
                              {emptySlotTemplate(resource.id, (() => {
                                const d = new Date(currentDate)
                                d.setHours(slot.hour, slot.minute, 0, 0)
                                return d
                              })())}
                            </div>
                          )}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer with legend */}
        <div className="flex items-center justify-between px-[var(--spacing-md)] py-[var(--spacing-sm)] border-t border-[var(--border)] bg-[var(--secondary)]/50">
          <div className="flex items-center gap-[var(--spacing-md)] text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-[var(--accent)]/20 border-l-2 border-[var(--accent)]" />
              <span className="text-[var(--foreground-muted)]">Confirmado</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-[var(--warning)]/20 border-l-2 border-[var(--warning)]" />
              <span className="text-[var(--foreground-muted)]">Pendiente</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-[var(--destructive)]/20 border-l-2 border-[var(--destructive)]" />
              <span className="text-[var(--foreground-muted)]">Cancelado</span>
            </div>
          </div>
          <div className="text-xs text-[var(--foreground-muted)]">
            {filteredEvents.length} evento(s) para hoy
          </div>
        </div>
      </div>
    )
  }
)

ResourceCalendar.displayName = 'ResourceCalendar'

export default ResourceCalendar
