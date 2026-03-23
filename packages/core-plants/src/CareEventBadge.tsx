import { Badge, cn } from "@packages/components";

import type { CareEventType } from "./care-event/careEventTypes.ts";

const eventTypeConfig: Record<CareEventType, { label: string; className: string }> = {
    watered: {
        label: "Watered",
        className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
    },
    skipped: {
        label: "Skipped",
        className: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
    },
    delegated: {
        label: "Delegated",
        className: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
    },
};

interface CareEventBadgeProps {
    eventType: CareEventType;
}

export function CareEventBadge({ eventType }: CareEventBadgeProps) {
    const config = eventTypeConfig[eventType];

    return (
        <Badge variant="outline" className={cn("border-transparent", config.className)}>
            {config.label}
        </Badge>
    );
}
