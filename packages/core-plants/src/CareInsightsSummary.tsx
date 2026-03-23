import { format } from "date-fns";

import type { CareInsight } from "./care-event/careEventTypes.ts";

interface CareInsightsSummaryProps {
    insights: CareInsight | null;
}

export function CareInsightsSummary({ insights }: CareInsightsSummaryProps) {
    if (!insights) {
        return (
            <div className="flex items-center justify-center py-4">
                <p className="text-muted-foreground text-sm">No care history yet</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="flex flex-col gap-0.5">
                <span className="text-muted-foreground text-xs font-medium">Last watered</span>
                <span className="text-sm">{format(insights.lastWateredDate, "PPP")}</span>
            </div>
            <div className="flex flex-col gap-0.5">
                <span className="text-muted-foreground text-xs font-medium">Avg. interval</span>
                <span className="text-sm">{insights.averageWateringIntervalDays > 0 ? `${insights.averageWateringIntervalDays} days` : "N/A"}</span>
            </div>
            <div className="flex flex-col gap-0.5">
                <span className="text-muted-foreground text-xs font-medium">Watering streak</span>
                <span className="text-sm">
                    {insights.wateringStreak} {insights.wateringStreak === 1 ? "event" : "events"}
                </span>
            </div>
            <div className="flex flex-col gap-0.5">
                <span className="text-muted-foreground text-xs font-medium">Missed waterings</span>
                <span className="text-sm">{insights.missedWateringCount}</span>
            </div>
            <div className="flex flex-col gap-0.5">
                <span className="text-muted-foreground text-xs font-medium">Consistency</span>
                <span className="text-sm">{insights.consistencyScore}%</span>
            </div>
        </div>
    );
}
