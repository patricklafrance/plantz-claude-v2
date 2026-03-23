import { CareInsightsSummary, getFrequencyDays } from "@packages/core-plants";
import { computeCareInsights } from "@packages/core-plants/care-event";

import { AdjustmentSection } from "./AdjustmentSection.tsx";
import { CareHistoryTimeline } from "./CareHistoryTimeline.tsx";
import { useCareEvents } from "./useCareEvents.ts";

interface PlantCareSectionProps {
    plantId: string;
    wateringFrequency?: string;
    onAdjustmentAccepted?: () => void;
}

export function PlantCareSection({ plantId, wateringFrequency, onAdjustmentAccepted }: PlantCareSectionProps) {
    const { events, isLoading } = useCareEvents(plantId);
    const insights = computeCareInsights(events);

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
            <div className="flex flex-col gap-2">
                <h3 className="text-sm font-semibold">Care Insights</h3>
                <CareInsightsSummary insights={insights} />
            </div>
            <div className="flex flex-col gap-2">
                <h3 className="text-sm font-semibold">Care History</h3>
                <CareHistoryTimeline events={events} />
            </div>
            {currentIntervalDays !== null && onAdjustmentAccepted && <AdjustmentSection plantId={plantId} currentIntervalDays={currentIntervalDays} onAdjustmentAccepted={onAdjustmentAccepted} />}
        </div>
    );
}
