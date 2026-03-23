import { format } from "date-fns";

import { Badge, Button } from "@packages/components";
import type { PlantRecommendation, RecommendationType } from "@packages/core-plants/vacation";

import { recommendationLabels } from "./recommendationLabels.ts";

const typeBadgeVariants: Record<RecommendationType, "default" | "secondary" | "destructive" | "outline"> = {
    "water-before-trip": "default",
    "safe-until-return": "secondary",
    "delegate-watering": "outline",
    "already-overdue": "destructive",
};

const riskLabels: Record<string, string> = {
    low: "Low Risk",
    medium: "Medium Risk",
    high: "High Risk",
};

const riskColors: Record<string, string> = {
    low: "text-muted-foreground",
    medium: "text-foreground",
    high: "text-destructive",
};

interface RecommendationCardProps {
    recommendation: PlantRecommendation;
    onDelegate?: (plantId: string) => void;
    onOverride?: (plantId: string) => void;
}

export function RecommendationCard({ recommendation, onDelegate, onOverride }: RecommendationCardProps) {
    const displayType = recommendation.override ?? recommendation.type;

    return (
        <div className="border-border bg-card flex flex-col gap-2 rounded-lg border p-4">
            <div className="flex items-start justify-between gap-2">
                <h3 className="truncate text-sm font-semibold" title={recommendation.plantName}>
                    {recommendation.plantName}
                </h3>
                <Badge variant={typeBadgeVariants[displayType]} className="shrink-0">
                    {recommendationLabels[displayType]}
                </Badge>
            </div>

            <p className="text-muted-foreground text-xs">{recommendation.reasoning}</p>

            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                    <span className="text-muted-foreground text-xs">Next watering: {format(recommendation.suggestedActionDate, "MMM d, yyyy")}</span>
                    <span className={`text-xs font-medium ${riskColors[recommendation.riskLevel]}`}>{riskLabels[recommendation.riskLevel]}</span>
                </div>

                <div className="flex items-center gap-1">
                    {displayType === "delegate-watering" && (
                        <Button variant="outline" size="xs" onClick={() => onDelegate?.(recommendation.plantId)}>
                            {recommendation.delegation ? recommendation.delegation.helperName : "Delegate"}
                        </Button>
                    )}
                    {onOverride && !recommendation.override && (
                        <Button variant="ghost" size="xs" onClick={() => onOverride?.(recommendation.plantId)}>
                            {displayType === "water-before-trip" ? "Mark as Safe Until Return" : "Mark as Water Before Trip"}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
