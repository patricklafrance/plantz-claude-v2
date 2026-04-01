import { useLiveQuery } from "@tanstack/react-db";
import { useQueryClient } from "@tanstack/react-query";
import { useState, useMemo, useCallback } from "react";

import { Badge, Button } from "@packages/components";
import { getAuthHeaders, getCurrentUserId } from "@packages/core-module";
import { applyPlantFilters, FilterBar, isDueForWatering, PlantListHeader, PlantListItem, usePlantFilters } from "@packages/core-plants";
import type { Plant } from "@packages/core-plants";

import { AssignResponsibilityDialog } from "./AssignResponsibilityDialog.tsx";
import { createBulkCareEvents, createCareEvent, DuplicateWateringError } from "./careEventsApi.ts";
import type { DuplicateWateringConflict } from "./careEventsApi.ts";
import { DuplicateWateringDialog } from "./DuplicateWateringDialog.tsx";
import { PlantCareSection } from "./PlantCareSection.tsx";
import { PlantDetailDialog } from "./PlantDetailDialog.tsx";
import type { ResponsibilityAssignment, ResponsibilityStrategy } from "./responsibilityTypes.ts";
import { useTodayPlantsCollection } from "./TodayPlantsContext.tsx";
import { useAssignments } from "./useAssignments.ts";
import { useHouseholdInfo } from "./useHouseholdInfo.ts";
import { VacationPlanBanner } from "./VacationPlanBanner.tsx";

function getResponsibilityLabel(assignment: ResponsibilityAssignment | undefined): string | null {
    if (!assignment) {
        return null;
    }

    switch (assignment.strategy) {
        case "fixed":
            return assignment.assignedUserName ? `Assigned to ${assignment.assignedUserName}` : "Assigned";
        case "rotating":
            return "Rotating";
        case "unassigned":
            return "Unassigned";
    }
}

interface PlantGroup {
    label: string;
    plants: Plant[];
}

function groupPlantsByResponsibility(
    plants: Plant[],
    assignmentsByPlant: Map<string, ResponsibilityAssignment>,
    currentUserId: string | null
): PlantGroup[] {
    const privatePlants: Plant[] = [];
    const myTasks: Plant[] = [];
    const othersTasks: Plant[] = [];
    const unassignedTasks: Plant[] = [];

    for (const plant of plants) {
        if (!plant.householdId) {
            privatePlants.push(plant);
            continue;
        }

        const assignment = assignmentsByPlant.get(plant.id);

        if (!assignment || assignment.strategy === "unassigned") {
            unassignedTasks.push(plant);
        } else if (assignment.strategy === "fixed" && assignment.assignedUserId === currentUserId) {
            myTasks.push(plant);
        } else if (assignment.strategy === "fixed") {
            othersTasks.push(plant);
        } else if (assignment.strategy === "rotating") {
            // Rotating tasks go to "My Tasks" for simplicity -- everyone shares
            myTasks.push(plant);
        }
    }

    const groups: PlantGroup[] = [];

    if (privatePlants.length > 0) {
        groups.push({ label: "Personal Plants", plants: privatePlants });
    }

    if (myTasks.length > 0) {
        groups.push({ label: "My Tasks", plants: myTasks });
    }

    if (othersTasks.length > 0) {
        groups.push({ label: "Others' Tasks", plants: othersTasks });
    }

    if (unassignedTasks.length > 0) {
        groups.push({ label: "Unassigned", plants: unassignedTasks });
    }

    return groups;
}

export function LandingPage() {
    const { filters, updateFilter, clearFilters, hasActiveFilters } = usePlantFilters();
    const [detailPlant, setDetailPlant] = useState<Plant | null>(null);
    const [isMarkingWatered, setIsMarkingWatered] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [assignPlant, setAssignPlant] = useState<Plant | null>(null);
    const [duplicateConflict, setDuplicateConflict] = useState<DuplicateWateringConflict | null>(null);
    const queryClient = useQueryClient();

    const collection = useTodayPlantsCollection();
    const { data: allPlants, isReady } = useLiveQuery(q => q.from({ plant: collection }));
    const { assignments, refetch: refetchAssignments } = useAssignments();
    const { household } = useHouseholdInfo();

    const currentUserId = useMemo(() => getCurrentUserId(), []);

    const plants = useMemo(() => {
        if (!allPlants) {
            return [];
        }

        // First sort by name, then filter to only plants due for watering, then apply user filters
        const sorted = allPlants.toSorted((a, b) => a.name.localeCompare(b.name));
        const duePlants = sorted.filter(p => isDueForWatering(p));

        return applyPlantFilters(duePlants, filters);
    }, [allPlants, filters]);

    const assignmentsByPlant = useMemo(() => {
        const map = new Map<string, ResponsibilityAssignment>();
        for (const a of assignments) {
            map.set(a.plantId, a);
        }

        return map;
    }, [assignments]);

    const hasSharedPlants = useMemo(() => plants.some(p => p.householdId), [plants]);

    const groups = useMemo(() => {
        if (!hasSharedPlants) {
            return null;
        }

        return groupPlantsByResponsibility(plants, assignmentsByPlant, currentUserId);
    }, [plants, assignmentsByPlant, currentUserId, hasSharedPlants]);

    const allSelected = plants.length > 0 && plants.every(p => selectedIds.has(p.id));

    const toggleSelect = useCallback((id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }

            return next;
        });
    }, []);

    const toggleAll = useCallback(() => {
        if (allSelected) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(plants.map(p => p.id)));
        }
    }, [allSelected, plants]);

    const handleViewDetail = useCallback((plant: Plant) => {
        setDetailPlant(plant);
    }, []);

    const handleDetailOpenChange = useCallback((open: boolean) => {
        if (!open) {
            setDetailPlant(null);
        }
    }, []);

    const handleAdjustmentAccepted = useCallback(async () => {
        await collection.utils.refetch();
    }, [collection]);

    const handleMarkWatered = useCallback(
        async (force?: boolean) => {
            if (!detailPlant) {
                return;
            }

            setIsMarkingWatered(true);

            try {
                await createCareEvent(detailPlant.id, "watered", undefined, force);
                await Promise.all([
                    queryClient.invalidateQueries({ queryKey: ["today", "care-events", detailPlant.id] }),
                    collection.utils.refetch()
                ]);
                setDuplicateConflict(null);
                setDetailPlant(null);
            } catch (error) {
                if (error instanceof DuplicateWateringError) {
                    setDuplicateConflict(error.conflict);
                }
                // Other errors silently handled — the user can retry.
            } finally {
                setIsMarkingWatered(false);
            }
        },
        [detailPlant, queryClient, collection]
    );

    const handleDuplicateConfirm = useCallback(() => {
        setDuplicateConflict(null);
        handleMarkWatered(true);
    }, [handleMarkWatered]);

    const handleDuplicateDismiss = useCallback(() => {
        setDuplicateConflict(null);
    }, []);

    const handleBulkMarkWatered = useCallback(async () => {
        const ids = plants.filter(p => selectedIds.has(p.id)).map(p => p.id);
        if (ids.length === 0) {
            return;
        }

        try {
            await createBulkCareEvents(ids, "watered");
            setSelectedIds(new Set());
            await collection.utils.refetch();
        } catch {
            // Silently handle — the user can retry.
        }
    }, [plants, selectedIds, collection]);

    const handleAssignClick = useCallback((plant: Plant) => {
        setAssignPlant(plant);
    }, []);

    const handleAssignSave = useCallback(
        async (strategy: ResponsibilityStrategy, assignedUserId?: string) => {
            if (!assignPlant) {
                return;
            }

            const existingAssignment = assignmentsByPlant.get(assignPlant.id);

            if (existingAssignment) {
                await fetch(`/api/today/assignments/${existingAssignment.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
                    body: JSON.stringify({ strategy, assignedUserId })
                });
            } else {
                await fetch("/api/today/assignments", {
                    method: "POST",
                    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
                    body: JSON.stringify({ plantId: assignPlant.id, strategy, assignedUserId })
                });
            }

            await refetchAssignments();
        },
        [assignPlant, assignmentsByPlant, refetchAssignments]
    );

    const selectedCount = plants.filter(p => selectedIds.has(p.id)).length;

    if (!isReady) {
        return (
            <div className="flex items-center justify-center p-6">
                <p className="text-muted-foreground text-sm">Loading plants...</p>
            </div>
        );
    }

    const renderPlantItem = (plant: Plant) => {
        const assignment = assignmentsByPlant.get(plant.id);
        const responsibilityLabel = getResponsibilityLabel(assignment);

        return (
            <div key={plant.id} role="listitem" className="relative">
                <PlantListItem plant={plant} selected={selectedIds.has(plant.id)} onToggleSelect={toggleSelect} onClick={handleViewDetail} />
                {plant.householdId && (
                    <div className="border-border -mt-0.5 flex items-center gap-2 border-b px-4 pb-2">
                        {responsibilityLabel && (
                            <Badge variant="outline" className="text-xs">
                                {responsibilityLabel}
                            </Badge>
                        )}
                        <Button variant="ghost" size="xs" className="text-xs" onClick={() => handleAssignClick(plant)}>
                            Assign
                        </Button>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="flex flex-col gap-4 p-6">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-semibold">Today</h1>
            </div>

            <VacationPlanBanner />

            <FilterBar
                filters={filters}
                onFilterChange={updateFilter}
                onClear={clearFilters}
                hasActiveFilters={hasActiveFilters}
                showDueForWatering={false}
            />

            {selectedCount > 0 && (
                <div role="status" className="border-primary/20 bg-primary/5 flex items-center gap-3 rounded-lg border px-4 py-2">
                    <span className="text-sm font-medium">{selectedCount} selected</span>
                    <Button variant="default" size="xs" onClick={handleBulkMarkWatered}>
                        Mark selected as Watered
                    </Button>
                </div>
            )}

            <div role="status" aria-live="polite" className="text-muted-foreground text-xs">
                {plants.length} plant{plants.length !== 1 ? "s" : ""} due for watering
            </div>

            <div className="border-border rounded-lg border">
                <PlantListHeader selectAllChecked={allSelected} onToggleSelectAll={toggleAll} />
                {groups ? (
                    <div role="list" aria-label="Plants due for watering">
                        {groups.map(group => (
                            <div key={group.label}>
                                <div className="bg-muted/50 border-border border-b px-4 py-1.5">
                                    <h2 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">{group.label}</h2>
                                </div>
                                {group.plants.map(renderPlantItem)}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div role="list" aria-label="Plants due for watering">
                        {plants.map(renderPlantItem)}
                    </div>
                )}
            </div>

            <PlantDetailDialog
                plant={detailPlant}
                open={detailPlant !== null}
                onOpenChange={handleDetailOpenChange}
                isMarkingWatered={isMarkingWatered}
                careSection={
                    detailPlant ? (
                        <PlantCareSection
                            plantId={detailPlant.id}
                            wateringFrequency={detailPlant.wateringFrequency}
                            onAdjustmentAccepted={handleAdjustmentAccepted}
                            isShared={!!detailPlant.householdId}
                            currentUserId={currentUserId}
                        />
                    ) : undefined
                }
                onMarkWatered={() => handleMarkWatered()}
            />

            {duplicateConflict && (
                <DuplicateWateringDialog
                    open={duplicateConflict !== null}
                    actorName={duplicateConflict.actorName}
                    wateredAt={duplicateConflict.wateredAt}
                    onConfirm={handleDuplicateConfirm}
                    onCancel={handleDuplicateDismiss}
                />
            )}

            {assignPlant && (
                <AssignResponsibilityDialog
                    plantName={assignPlant.name}
                    open={assignPlant !== null}
                    onOpenChange={open => {
                        if (!open) {
                            setAssignPlant(null);
                        }
                    }}
                    members={household?.members ?? []}
                    currentAssignment={assignmentsByPlant.get(assignPlant.id)}
                    onSave={handleAssignSave}
                />
            )}
        </div>
    );
}
