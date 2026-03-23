import { format } from "date-fns";

import type { AdjustmentEvent } from "./care-event/adjustmentTypes.ts";
import { formatIntervalLabel } from "./care-event/adjustmentUtils.ts";

interface AdjustmentHistoryListProps {
    events: AdjustmentEvent[];
}

export function AdjustmentHistoryList({ events }: AdjustmentHistoryListProps) {
    if (events.length === 0) {
        return (
            <div className="flex items-center justify-center py-4">
                <p className="text-muted-foreground text-sm">No adjustment history</p>
            </div>
        );
    }

    return (
        <ul className="flex flex-col gap-2">
            {events.map((event) => (
                <li key={event.id} className="bg-muted/30 flex flex-col gap-1 rounded-md px-3 py-2">
                    <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium">{format(event.adjustmentDate, "PPP")}</span>
                    </div>
                    <div className="text-muted-foreground text-xs">
                        Changed from {formatIntervalLabel(event.previousInterval)} to <span className="text-foreground font-medium">{formatIntervalLabel(event.newInterval)}</span>
                    </div>
                    {event.note && <p className="text-muted-foreground text-xs italic">{event.note}</p>}
                </li>
            ))}
        </ul>
    );
}
