import { formatDistanceToNow } from "date-fns";
import { useMemo } from "react";

import { getFrequencyDays } from "@packages/core-plants";

import { AdjustmentSection } from "./AdjustmentSection.tsx";
import { computeCareInsights } from "./careEventUtils.ts";
import { CareHistoryTimeline } from "./CareHistoryTimeline.tsx";
import { CareInsightsSummary } from "./CareInsightsSummary.tsx";
import { useCareEvents } from "./useCareEvents.ts";

interface PlantCareSectionProps {
    plantId: string;
    wateringFrequency?: string;
    onAdjustmentAccepted?: () => void;
    /** Whether this plant is shared (has a householdId). Used to show recent activity by others. */
    isShared?: boolean;
    /** Current user ID to filter out the current user's own activity. */
    currentUserId?: string | null;
}

export function PlantCareSection({ plantId, wateringFrequency, onAdjustmentAccepted, isShared, currentUserId }: PlantCareSectionProps) {
    const { events, isLoading } = useCareEvents(plantId);
    const insights = computeCareInsights(events);

    const recentActivityByOther = useMemo(() => {
        if (!isShared || !currentUserId) {
            return null;
        }

        const recentWatering = events.find(e => e.eventType === "watered" && e.actorId && e.actorId !== currentUserId && e.actorName);

        return recentWatering ?? null;
    }, [events, isShared, currentUserId]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-4">
                <p className="text-muted-foreground text-sm">Loading care history...</p>
            </div>
        );
    }

    const currentIntervalDays = wateringFrequency ? getFrequencyDays(wateringFrequency) : null;

    return (
        <div className="flex flex-col gap-4">
            {recentActivityByOther && (
                <div className="bg-muted/50 rounded-md px-3 py-2">
                    <p className="text-muted-foreground text-sm">
                        Watered by {recentActivityByOther.actorName} {formatDistanceToNow(recentActivityByOther.eventDate, { addSuffix: true })}
                    </p>
                </div>
            )}
            <div className="flex flex-col gap-2">
                <h3 className="text-sm font-semibold">Care Insights</h3>
                <CareInsightsSummary insights={insights} />
            </div>
            <div className="flex flex-col gap-2">
                <h3 className="text-sm font-semibold">Care History</h3>
                <CareHistoryTimeline events={events} />
            </div>
            {currentIntervalDays !== null && onAdjustmentAccepted && (
                <AdjustmentSection plantId={plantId} currentIntervalDays={currentIntervalDays} onAdjustmentAccepted={onAdjustmentAccepted} />
            )}
        </div>
    );
}
