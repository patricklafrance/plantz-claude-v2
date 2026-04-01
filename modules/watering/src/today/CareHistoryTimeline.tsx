import { format } from "date-fns";

import type { CareEvent } from "@packages/core-plants/care-event";

import { CareEventBadge } from "./CareEventBadge.tsx";

interface CareHistoryTimelineProps {
    events: CareEvent[];
}

function groupByDay(events: CareEvent[]): Map<string, CareEvent[]> {
    const groups = new Map<string, CareEvent[]>();

    for (const event of events) {
        const dayKey = format(event.eventDate, "PPP");
        const existing = groups.get(dayKey);

        if (existing) {
            existing.push(event);
        } else {
            groups.set(dayKey, [event]);
        }
    }

    return groups;
}

export function CareHistoryTimeline({ events }: CareHistoryTimelineProps) {
    if (events.length === 0) {
        return (
            <div className="flex items-center justify-center py-4">
                <p className="text-muted-foreground text-sm">No care history yet</p>
            </div>
        );
    }

    // Events are already sorted by date descending from useCareEvents / props
    const grouped = groupByDay(events);

    return (
        <div className="flex flex-col gap-3">
            {[...grouped.entries()].map(([dayLabel, dayEvents]) => (
                <div key={dayLabel} className="flex flex-col gap-1.5">
                    <span className="text-muted-foreground text-xs font-medium">{dayLabel}</span>
                    {dayEvents.map(event => (
                        <div key={event.id} className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-2">
                                <CareEventBadge eventType={event.eventType} />
                                {event.notes && <span className="text-muted-foreground truncate text-xs">{event.notes}</span>}
                            </div>
                            {event.actorName && (
                                <span className="text-muted-foreground ml-1 text-xs">
                                    {event.eventType === "watered" ? "Watered" : event.eventType === "skipped" ? "Skipped" : "Delegated"} by{" "}
                                    {event.actorName}
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
}
