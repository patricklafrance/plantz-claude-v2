import { useLiveQuery } from "@tanstack/react-db";
import { useQueryClient } from "@tanstack/react-query";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { formatDistanceToNow } from "date-fns";
import { Users } from "lucide-react";
import { useState, useRef, useMemo, useCallback } from "react";

import { Button } from "@packages/components";
import { applyPlantFilters, FilterBar, isDueForWatering, PlantListHeader, PlantListItem, usePlantFilters } from "@packages/core-plants";
import type { Plant } from "@packages/core-plants";

import { createBulkCareEvents, createCareEvent } from "./careEventsApi.ts";
import { PlantCareSection } from "./PlantCareSection.tsx";
import { PlantDetailDialog } from "./PlantDetailDialog.tsx";
import { useTodayPlantsCollection } from "./TodayPlantsContext.tsx";
import { useHouseholdContext, type PlantResponsibility } from "./useHouseholdContext.ts";
import { VacationPlanBanner } from "./VacationPlanBanner.tsx";

interface PlantGroup {
    key: string;
    label: string;
    plants: Plant[];
}

function groupPlantsByResponsibility(plants: Plant[], currentUserId: string | undefined, responsibilities: PlantResponsibility[]): PlantGroup[] {
    const responsibilityMap = new Map<string, PlantResponsibility>();

    for (const r of responsibilities) {
        responsibilityMap.set(r.plantId, r);
    }

    const personal: Plant[] = [];
    const myResponsibility: Plant[] = [];
    const othersResponsibility: Plant[] = [];
    const unassigned: Plant[] = [];

    for (const plant of plants) {
        if (!plant.householdId) {
            personal.push(plant);
            continue;
        }

        const responsibility = responsibilityMap.get(plant.id);

        if (!responsibility || responsibility.strategy === "unassigned") {
            unassigned.push(plant);
        } else if (responsibility.responsibleUserId === currentUserId) {
            myResponsibility.push(plant);
        } else {
            othersResponsibility.push(plant);
        }
    }

    const groups: PlantGroup[] = [];

    if (personal.length > 0) {
        groups.push({ key: "personal", label: "My Plants", plants: personal });
    }

    if (myResponsibility.length > 0) {
        groups.push({ key: "my-responsibility", label: "My Responsibility", plants: myResponsibility });
    }

    if (othersResponsibility.length > 0) {
        groups.push({ key: "others-responsibility", label: "Others' Tasks", plants: othersResponsibility });
    }

    if (unassigned.length > 0) {
        groups.push({ key: "unassigned", label: "Unassigned", plants: unassigned });
    }

    return groups;
}

interface FlatRow {
    type: "header" | "plant";
    key: string;
    label?: string;
    plant?: Plant;
}

function flattenGroups(groups: PlantGroup[]): FlatRow[] {
    const rows: FlatRow[] = [];

    for (const group of groups) {
        rows.push({ type: "header", key: `header-${group.key}`, label: group.label });

        for (const plant of group.plants) {
            rows.push({ type: "plant", key: plant.id, plant });
        }
    }

    return rows;
}

export function LandingPage() {
    const { filters, updateFilter, clearFilters, hasActiveFilters } = usePlantFilters();
    const [detailPlant, setDetailPlant] = useState<Plant | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [wateringPlantId, setWateringPlantId] = useState<string | null>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const queryClient = useQueryClient();

    const collection = useTodayPlantsCollection();
    const { data: allPlants, isReady } = useLiveQuery(q => q.from({ plant: collection }));
    const { data: householdContext } = useHouseholdContext();

    const plants = useMemo(() => {
        if (!allPlants) {
            return [];
        }

        // First sort by name, then filter to only plants due for watering, then apply user filters
        const sorted = allPlants.toSorted((a, b) => a.name.localeCompare(b.name));
        const duePlants = sorted.filter(p => isDueForWatering(p));

        return applyPlantFilters(duePlants, filters);
    }, [allPlants, filters]);

    // Build grouped flat rows for the virtual list
    const rows = useMemo((): FlatRow[] => {
        if (!householdContext.isMember) {
            // No household — flat list, no grouping
            return plants.map(p => ({ type: "plant" as const, key: p.id, plant: p }));
        }

        const groups = groupPlantsByResponsibility(plants, householdContext.currentUserId, householdContext.responsibilities);

        // If only one group (e.g., all personal), skip group headers
        if (groups.length <= 1) {
            return plants.map(p => ({ type: "plant" as const, key: p.id, plant: p }));
        }

        return flattenGroups(groups);
    }, [plants, householdContext]);

    // Build a responsibility lookup for rendering annotations
    const responsibilityMap = useMemo(() => {
        const map = new Map<string, PlantResponsibility>();

        for (const r of householdContext.responsibilities) {
            map.set(r.plantId, r);
        }

        return map;
    }, [householdContext.responsibilities]);

    const virtualizer = useWindowVirtualizer({
        count: rows.length,
        estimateSize: index => (rows[index]?.type === "header" ? 36 : 68),
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

    const handleMarkWatered = useCallback(async () => {
        if (!detailPlant) {
            return;
        }

        setWateringPlantId(detailPlant.id);

        try {
            await createCareEvent(detailPlant.id, "watered");
            await Promise.all([queryClient.invalidateQueries({ queryKey: ["today", "care-events", detailPlant.id] }), collection.utils.refetch()]);
            setDetailPlant(null);
        } catch {
            // Silently handle — the user can retry.
        } finally {
            setWateringPlantId(null);
        }
    }, [detailPlant, queryClient, collection]);

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
                        const row = rows[virtualRow.index]!;
                        // oxlint-disable-next-line react-perf/jsx-no-new-object-as-prop -- Virtual row positioning requires per-item inline styles
                        const rowStyle = {
                            position: "absolute" as const,
                            top: 0,
                            left: 0,
                            width: "100%",
                            height: `${virtualRow.size}px`,
                            transform: `translateY(${virtualRow.start - virtualizer.options.scrollMargin}px)`
                        };

                        if (row.type === "header") {
                            return (
                                <div key={row.key} role="presentation" style={rowStyle} className="bg-muted/50 flex items-center px-4 py-2">
                                    <h2 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">{row.label}</h2>
                                </div>
                            );
                        }

                        const plant = row.plant!;
                        const isShared = !!plant.householdId;
                        const responsibility = isShared ? responsibilityMap.get(plant.id) : undefined;
                        const lastCare = isShared ? householdContext.lastCareEvents[plant.id] : undefined;

                        // Build annotation text for shared plants
                        let annotation: string | undefined;

                        if (isShared && householdContext.isMember) {
                            const parts: string[] = [];

                            // Responsibility label
                            if (responsibility) {
                                if (responsibility.strategy === "unassigned") {
                                    parts.push("Available for anyone");
                                } else if (responsibility.responsibleUserId === householdContext.currentUserId) {
                                    parts.push("Your responsibility");
                                } else if (responsibility.responsibleUserName) {
                                    parts.push(`Assigned to ${responsibility.responsibleUserName}`);
                                }
                            }

                            // Last watered by
                            if (lastCare) {
                                const timeAgo = formatDistanceToNow(new Date(lastCare.eventDate), { addSuffix: true });

                                if (lastCare.actorName) {
                                    parts.push(`Last watered by ${lastCare.actorName}, ${timeAgo}`);
                                }
                            }

                            if (parts.length > 0) {
                                annotation = parts.join(" · ");
                            }
                        }

                        return (
                            <div key={plant.id} role="listitem" style={rowStyle}>
                                <div className="flex flex-col">
                                    <PlantListItem
                                        plant={plant}
                                        selected={selectedIds.has(plant.id)}
                                        onToggleSelect={toggleSelect}
                                        onClick={handleViewDetail}
                                    />
                                    {annotation && (
                                        <div className="border-border -mt-0.5 flex items-center gap-1.5 border-b px-4 pb-2">
                                            <Users className="text-muted-foreground size-3 shrink-0" aria-hidden="true" />
                                            <span className="text-muted-foreground text-xs">{annotation}</span>
                                        </div>
                                    )}
                                </div>
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
                        />
                    ) : undefined
                }
                onMarkWatered={handleMarkWatered}
                isWatering={wateringPlantId === detailPlant?.id}
            />
        </div>
    );
}
