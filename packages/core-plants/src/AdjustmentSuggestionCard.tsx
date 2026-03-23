import { Check, X } from "lucide-react";

import { Badge, Button, cn } from "@packages/components";

import type { AdjustmentRecommendation, Confidence } from "./care-event/adjustmentTypes.ts";
import { formatIntervalLabel } from "./care-event/adjustmentUtils.ts";

const confidenceConfig: Record<Confidence, { label: string; className: string }> = {
    low: {
        label: "Low confidence",
        className: "bg-muted text-muted-foreground",
    },
    medium: {
        label: "Medium confidence",
        className: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
    },
    high: {
        label: "High confidence",
        className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
    },
};

interface AdjustmentSuggestionCardProps {
    recommendation: AdjustmentRecommendation;
    onAccept: () => void;
    onDismiss: () => void;
}

export function AdjustmentSuggestionCard({ recommendation, onAccept, onDismiss }: AdjustmentSuggestionCardProps) {
    const config = confidenceConfig[recommendation.confidence];

    return (
        <div aria-live="polite" className="bg-muted/50 flex flex-col gap-3 rounded-lg border p-4">
            <div className="flex items-start justify-between gap-2">
                <h4 className="text-sm font-semibold">Suggested Schedule Change</h4>
                <Badge variant="outline" className={cn("border-transparent", config.className)}>
                    {config.label}
                </Badge>
            </div>
            <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">{formatIntervalLabel(recommendation.suggestedInterval)}</span>
                <span className="text-muted-foreground text-sm">(currently {formatIntervalLabel(recommendation.currentInterval)})</span>
            </div>
            <p className="text-muted-foreground text-sm">{recommendation.explanation}</p>
            <p className="text-muted-foreground text-xs">{recommendation.recentBehaviorSummary}</p>
            <div className="flex gap-2">
                <Button variant="default" size="sm" onClick={onAccept} aria-label={`Accept suggested interval of ${recommendation.suggestedInterval} days`}>
                    <Check data-icon="inline-start" aria-hidden="true" />
                    Accept
                </Button>
                <Button variant="outline" size="sm" onClick={onDismiss} aria-label="Dismiss suggestion">
                    <X data-icon="inline-start" aria-hidden="true" />
                    Dismiss
                </Button>
            </div>
        </div>
    );
}
