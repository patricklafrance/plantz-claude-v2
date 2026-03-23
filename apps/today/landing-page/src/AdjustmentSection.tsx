import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

import { Separator } from "@packages/components";
import { AdjustmentHistoryList, AdjustmentSuggestionCard } from "@packages/core-plants";

import { acceptAdjustment, dismissRecommendation } from "./adjustmentsApi.ts";
import { useAdjustmentHistory } from "./useAdjustmentHistory.ts";
import { useAdjustmentRecommendation } from "./useAdjustmentRecommendation.ts";

interface AdjustmentSectionProps {
    plantId: string;
    currentIntervalDays: number;
    onAdjustmentAccepted: () => void;
}

export function AdjustmentSection({ plantId, currentIntervalDays, onAdjustmentAccepted }: AdjustmentSectionProps) {
    const queryClient = useQueryClient();
    const { recommendation, isLoading: isLoadingRecommendation } = useAdjustmentRecommendation(plantId, currentIntervalDays);
    const { events, isLoading: isLoadingHistory } = useAdjustmentHistory(plantId);

    const handleAccept = useCallback(async () => {
        if (!recommendation) return;

        try {
            await acceptAdjustment(plantId, recommendation.currentInterval, recommendation.suggestedInterval);
            await Promise.all([queryClient.invalidateQueries({ queryKey: ["today", "adjustments", "recommendation", plantId] }), queryClient.invalidateQueries({ queryKey: ["today", "adjustments", "history", plantId] })]);
            onAdjustmentAccepted();
        } catch {
            // Silently handle — the user can retry.
        }
    }, [recommendation, plantId, queryClient, onAdjustmentAccepted]);

    const handleDismiss = useCallback(async () => {
        try {
            await dismissRecommendation(plantId);
            await queryClient.invalidateQueries({ queryKey: ["today", "adjustments", "recommendation", plantId] });
        } catch {
            // Silently handle — the user can retry.
        }
    }, [plantId, queryClient]);

    if (isLoadingRecommendation && isLoadingHistory) {
        return (
            <div className="flex items-center justify-center py-4">
                <p className="text-muted-foreground text-sm">Loading adjustments...</p>
            </div>
        );
    }

    const hasContent = recommendation !== null || events.length > 0;

    if (!hasContent && !isLoadingRecommendation && !isLoadingHistory) {
        return null;
    }

    return (
        <>
            <Separator />
            <div className="flex flex-col gap-3">
                <h3 className="text-sm font-semibold">Schedule Adjustments</h3>
                {recommendation && <AdjustmentSuggestionCard recommendation={recommendation} onAccept={handleAccept} onDismiss={handleDismiss} />}
                {events.length > 0 && (
                    <div className="flex flex-col gap-2">
                        <h4 className="text-xs font-semibold">Past Adjustments</h4>
                        <AdjustmentHistoryList events={events} />
                    </div>
                )}
            </div>
        </>
    );
}
