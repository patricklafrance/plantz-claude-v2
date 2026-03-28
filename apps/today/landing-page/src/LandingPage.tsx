import { useLiveQuery } from "@tanstack/react-db";
import { useQueryClient } from "@tanstack/react-query";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { useState, useRef, useMemo, useCallback, useEffect } from "react";

import { Button } from "@packages/components";
import { getAuthHeaders, getCurrentUserId } from "@packages/core-module";
import { applyPlantFilters, FilterBar, isDueForWatering, PlantListHeader, PlantListItem, usePlantFilters } from "@packages/core-plants";
import type { Plant } from "@packages/core-plants";
import type { ResponsibilityAssignment } from "@packages/core-plants/assignment";

import { createBulkCareEvents, createCareEvent } from "./careEventsApi.ts";
import { PlantCareSection } from "./PlantCareSection.tsx";
import { PlantDetailDialog } from "./PlantDetailDialog.tsx";
import { ResponsibilityBadge } from "./ResponsibilityBadge.tsx";
import { useTodayPlantsCollection } from "./TodayPlantsContext.tsx";
import { VacationPlanBanner } from "./VacationPlanBanner.tsx";

interface HouseholdMember {
    userId: string;
    name: string;
}

function resolveActorName(actorId: string | undefined, memberNameMap: Map<string, string>): string | undefined {
    if (!actorId) {
        return undefined;
    }
    return memberNameMap.get(actorId) ?? "a household member";
}

export function LandingPage() {
    const { filters, updateFilter, clearFilters, hasActiveFilters } = usePlantFilters();
    const [detailPlant, setDetailPlant] = useState<Plant | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [wateredTodayMap, setWateredTodayMap] = useState<Map<string, string>>(new Map());
    const [assignments, setAssignments] = useState<ResponsibilityAssignment[]>([]);
    const [members, setMembers] = useState<HouseholdMember[]>([]);
    const [isWatering, setIsWatering] = useState(false);
    const listRef = useRef<HTMLDivElement>(null);
    const queryClient = useQueryClient();

    const collection = useTodayPlantsCollection();
    const { data: allPlants, isReady } = useLiveQuery(q => q.from({ plant: collection }));

    // Fetch assignments, household members, and today's watered state once on mount
    useEffect(() => {
        const headers = getAuthHeaders();

        Promise.all([
            fetch("/api/today/assignments", { headers }).then(r => (r.ok ? r.json() : [])),
            fetch("/api/today/household-members", { headers }).then(r => (r.ok ? r.json() : [])),
            fetch("/api/today/watered-today", { headers }).then(r => (r.ok ? r.json() : []))
        ]).then(
            ([assignmentsData, membersData, wateredTodayData]: [
                ResponsibilityAssignment[],
                HouseholdMember[],
                { plantId: string; actorId: string }[]
            ]) => {
                setAssignments(assignmentsData);
                setMembers(membersData);
                setWateredTodayMap(new Map(wateredTodayData.map(w => [w.plantId, w.actorId])));
            }
        );
    }, []);

    const plants = useMemo(() => {
        if (!allPlants) {
            return [];
        }

        // First sort by name, then filter to only plants due for watering, then apply user filters
        const sorted = allPlants.toSorted((a, b) => a.name.localeCompare(b.name));
        const duePlants = sorted.filter(p => isDueForWatering(p));

        return applyPlantFilters(duePlants, filters);
    }, [allPlants, filters]);

    const assignmentMap = useMemo(() => {
        const map = new Map<string, ResponsibilityAssignment>();
        for (const a of assignments) {
            map.set(a.plantId, a);
        }
        return map;
    }, [assignments]);

    const memberNameMap = useMemo(() => {
        const map = new Map<string, string>();
        for (const m of members) {
            map.set(m.userId, m.name);
        }
        return map;
    }, [members]);

    const currentUserId = useMemo(() => getCurrentUserId(), []);

    const virtualizer = useWindowVirtualizer({
        count: plants.length,
        estimateSize: () => 49,
        overscan: 10,
        scrollMargin: (listRef.current?.getBoundingClientRect().top ?? 0) + window.scrollY
    });

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
            // Only select plants not already watered today
            setSelectedIds(new Set(plants.filter(p => !wateredTodayMap.has(p.id)).map(p => p.id)));
        }
    }, [allSelected, plants, wateredTodayMap]);

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

    const handleMarkWatered = useCallback(async () => {
        if (!detailPlant) {
            return;
        }

        setIsWatering(true);

        try {
            await createCareEvent(detailPlant.id, "watered");
            setWateredTodayMap(prev => {
                const next = new Map(prev);
                next.set(detailPlant.id, currentUserId ?? "");
                return next;
            });
            await Promise.all([queryClient.invalidateQueries({ queryKey: ["today", "care-events", detailPlant.id] }), collection.utils.refetch()]);
            setDetailPlant(null);
        } catch {
            // Silently handle — the user can retry.
        } finally {
            setIsWatering(false);
        }
    }, [detailPlant, queryClient, collection, currentUserId]);

    const handleBulkMarkWatered = useCallback(async () => {
        // Skip plants already watered today
        const ids = plants.filter(p => selectedIds.has(p.id) && !wateredTodayMap.has(p.id)).map(p => p.id);
        if (ids.length === 0) {
            return;
        }

        try {
            await createBulkCareEvents(ids, "watered");
            setWateredTodayMap(prev => {
                const next = new Map(prev);
                for (const id of ids) {
                    next.set(id, currentUserId ?? "");
                }
                return next;
            });
            setSelectedIds(new Set());
            await collection.utils.refetch();
        } catch {
            // Silently handle — the user can retry.
        }
    }, [plants, selectedIds, collection, wateredTodayMap, currentUserId]);

    const selectedCount = plants.filter(p => selectedIds.has(p.id)).length;

    const totalSize = virtualizer.getTotalSize();
    const virtualizerContainerStyle = useMemo(
        () => ({
            height: `${totalSize}px`,
            width: "100%",
            position: "relative" as const
        }),
        [totalSize]
    );

    const detailPlantWateredBy = detailPlant ? wateredTodayMap.get(detailPlant.id) : undefined;
    const detailPlantWateredByName = resolveActorName(detailPlantWateredBy, memberNameMap);

    if (!isReady) {
        return (
            <div className="flex items-center justify-center p-6">
                <p className="text-muted-foreground text-sm">Loading plants...</p>
            </div>
        );
    }

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
                <div ref={listRef} role="list" aria-label="Plants due for watering" style={virtualizerContainerStyle}>
                    {virtualizer.getVirtualItems().map(virtualRow => {
                        const plant = plants[virtualRow.index]!;
                        const assignment = assignmentMap.get(plant.id);
                        const wateredByActorId = wateredTodayMap.get(plant.id);
                        const wateredByName = resolveActorName(wateredByActorId, memberNameMap);
                        const alreadyWatered = wateredTodayMap.has(plant.id);

                        // oxlint-disable-next-line react-perf/jsx-no-new-object-as-prop -- Virtual row positioning requires per-item inline styles
                        const rowStyle = {
                            position: "absolute" as const,
                            top: 0,
                            left: 0,
                            width: "100%",
                            height: `${virtualRow.size}px`,
                            transform: `translateY(${virtualRow.start - virtualizer.options.scrollMargin}px)`
                        };
                        return (
                            <div key={plant.id} role="listitem" style={rowStyle} className={alreadyWatered ? "opacity-60" : undefined}>
                                <PlantListItem
                                    plant={plant}
                                    selected={selectedIds.has(plant.id)}
                                    onToggleSelect={alreadyWatered ? undefined : toggleSelect}
                                    onClick={handleViewDetail}
                                    badge={
                                        alreadyWatered ? (
                                            <span className="text-muted-foreground text-xs" aria-label={`Watered today by ${wateredByName}`}>
                                                Watered today by {wateredByName}
                                            </span>
                                        ) : assignment ? (
                                            <ResponsibilityBadge
                                                assignment={assignment}
                                                currentUserId={currentUserId ?? ""}
                                                memberNameMap={memberNameMap}
                                            />
                                        ) : undefined
                                    }
                                />
                            </div>
                        );
                    })}
                </div>
            </div>

            <PlantDetailDialog
                plant={detailPlant}
                open={detailPlant !== null}
                onOpenChange={handleDetailOpenChange}
                careSection={
                    detailPlant ? (
                        <PlantCareSection
                            plantId={detailPlant.id}
                            wateringFrequency={detailPlant.wateringFrequency}
                            onAdjustmentAccepted={handleAdjustmentAccepted}
                            actorNameMap={memberNameMap}
                        />
                    ) : undefined
                }
                wateredTodayByName={detailPlantWateredByName}
                isWatering={isWatering}
                onMarkWatered={detailPlantWateredBy ? undefined : handleMarkWatered}
            />
        </div>
    );
}
