import { useLiveQuery } from "@tanstack/react-db";
import { useState, useMemo, useCallback, useEffect } from "react";

import { Badge, Button } from "@packages/components";
import { getAuthHeaders } from "@packages/core-module";
import type { PlanningStrategy, RecommendationType, DelegationInfo } from "@packages/core-plants/vacation";

import { DelegationDialog } from "./DelegationDialog.tsx";
import { RecommendationGroup } from "./RecommendationGroup.tsx";
import { useTodayVacationPlantsCollection } from "./TodayVacationPlantsContext.tsx";
import { useVacationPlan } from "./useVacationPlan.ts";
import { VacationDateForm } from "./VacationDateForm.tsx";

const RECOMMENDATION_ORDER: RecommendationType[] = ["already-overdue", "water-before-trip", "delegate-watering", "safe-until-return"];

export function VacationPlannerPage() {
    const collection = useTodayVacationPlantsCollection();
    const { data: plants, isReady } = useLiveQuery((q) => q.from({ plant: collection }));
    const { plan, recommendations, isSaving, createPlan, savePlan, cancelPlan, overrideRecommendation, setDelegation, loadPlan } = useVacationPlan();

    const [delegatingPlantId, setDelegatingPlantId] = useState<string | null>(null);

    // Load active plan on mount
    useEffect(() => {
        async function loadActivePlan() {
            try {
                const response = await fetch("/api/today/vacation-planner/plans/active", {
                    headers: getAuthHeaders(),
                });
                if (response.ok) {
                    const activePlan = await response.json();
                    if (activePlan) {
                        loadPlan(activePlan, activePlan.recommendations ?? []);
                    }
                }
            } catch {
                // No active plan — that's fine
            }
        }
        loadActivePlan();
    }, [loadPlan]);

    const handleGenerate = useCallback(
        (startDate: Date, endDate: Date, strategy: PlanningStrategy) => {
            if (!plants) return;
            createPlan(plants, startDate, endDate, strategy);
        },
        [plants, createPlan],
    );

    const handleDelegate = setDelegatingPlantId;

    const handleOverride = useCallback(
        (plantId: string) => {
            // Simple toggle: override to water-before-trip if currently something else
            const rec = recommendations.find((r) => r.plantId === plantId);
            if (rec) {
                const newType: RecommendationType = rec.type === "water-before-trip" ? "safe-until-return" : "water-before-trip";
                overrideRecommendation(plantId, newType);
            }
        },
        [recommendations, overrideRecommendation],
    );

    const handleDelegationSave = useCallback(
        (delegation: DelegationInfo) => {
            if (delegatingPlantId) {
                setDelegation(delegatingPlantId, delegation);
                setDelegatingPlantId(null);
            }
        },
        [delegatingPlantId, setDelegation],
    );

    const groupedRecommendations = useMemo(() => {
        const groups = new Map<RecommendationType, typeof recommendations>();
        for (const type of RECOMMENDATION_ORDER) {
            groups.set(type, []);
        }
        for (const rec of recommendations) {
            const displayType = rec.override ?? rec.type;
            const group = groups.get(displayType);
            if (group) {
                group.push(rec);
            }
        }

        return groups;
    }, [recommendations]);

    const delegatingPlant = delegatingPlantId ? recommendations.find((r) => r.plantId === delegatingPlantId) : null;

    if (!isReady) {
        return (
            <div className="flex items-center justify-center p-6">
                <p className="text-muted-foreground text-sm">Loading plants...</p>
            </div>
        );
    }

    const hasPlants = plants && plants.length > 0;

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <h1 className="text-xl font-semibold">Vacation Planner</h1>
                    {plan && plan.status === "draft" && <Badge variant="secondary">Draft</Badge>}
                    {plan && plan.status === "active" && <Badge variant="default">Saved</Badge>}
                </div>
                {plan && plan.status === "active" && (
                    <Button variant="destructive" size="sm" onClick={cancelPlan}>
                        Cancel Plan
                    </Button>
                )}
                {plan && plan.status === "draft" && (
                    <Button size="sm" onClick={savePlan} disabled={isSaving}>
                        {isSaving ? "Saving..." : "Save Plan"}
                    </Button>
                )}
            </div>

            {!hasPlants ? (
                <div className="border-border flex flex-col items-center justify-center gap-2 rounded-lg border p-12">
                    <p className="text-muted-foreground text-sm">No plants found. Add some plants first to plan your vacation care.</p>
                </div>
            ) : (
                <>
                    {(!plan || plan.status === "cancelled") && <VacationDateForm onGenerate={handleGenerate} />}

                    {plan && plan.status !== "cancelled" && <VacationDateForm onGenerate={handleGenerate} initialStartDate={plan.startDate} initialEndDate={plan.endDate} initialStrategy={plan.strategy} disabled={plan.status === "active"} />}

                    {recommendations.length === 0 && !plan && (
                        <div className="border-border flex flex-col items-center justify-center gap-2 rounded-lg border p-12">
                            <p className="text-muted-foreground text-sm">Select your trip dates and generate a forecast to see recommendations for your plants.</p>
                        </div>
                    )}

                    {recommendations.length > 0 && (
                        <div className="flex flex-col gap-6">
                            {RECOMMENDATION_ORDER.map((type) => {
                                const recs = groupedRecommendations.get(type) ?? [];

                                return <RecommendationGroup key={type} type={type} recommendations={recs} onDelegate={handleDelegate} onOverride={handleOverride} />;
                            })}
                        </div>
                    )}
                </>
            )}

            {delegatingPlant && plan && (
                <DelegationDialog
                    open={delegatingPlantId !== null}
                    onOpenChange={(open) => !open && setDelegatingPlantId(null)}
                    plantName={delegatingPlant.plantName}
                    tripStartDate={plan.startDate}
                    tripEndDate={plan.endDate}
                    existingDelegation={delegatingPlant.delegation}
                    onSave={handleDelegationSave}
                />
            )}
        </div>
    );
}
