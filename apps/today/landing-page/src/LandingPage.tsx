import { useLiveQuery } from "@tanstack/react-db";
import { useQueryClient } from "@tanstack/react-query";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { useState, useRef, useMemo, useCallback } from "react";

import { Button } from "@packages/components";
import { applyPlantFilters, FilterBar, isDueForWatering, PlantListHeader, PlantListItem, usePlantFilters } from "@packages/core-plants";
import type { Plant } from "@packages/core-plants";

import { createBulkCareEvents, createCareEvent } from "./careEventsApi.ts";
import { PlantCareSection } from "./PlantCareSection.tsx";
import { PlantDetailDialog } from "./PlantDetailDialog.tsx";
import { useTodayPlantsCollection } from "./TodayPlantsContext.tsx";
import { VacationPlanBanner } from "./VacationPlanBanner.tsx";

export function LandingPage() {
    const { filters, updateFilter, clearFilters, hasActiveFilters } = usePlantFilters();
    const [detailPlant, setDetailPlant] = useState<Plant | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const listRef = useRef<HTMLDivElement>(null);
    const queryClient = useQueryClient();

    const collection = useTodayPlantsCollection();
    const { data: allPlants, isReady } = useLiveQuery((q) => q.from({ plant: collection }));

    const plants = useMemo(() => {
        if (!allPlants) return [];

        // First sort by name, then filter to only plants due for watering, then apply user filters
        const sorted = allPlants.toSorted((a, b) => a.name.localeCompare(b.name));
        const duePlants = sorted.filter((p) => isDueForWatering(p));

        return applyPlantFilters(duePlants, filters);
    }, [allPlants, filters]);

    const virtualizer = useWindowVirtualizer({
        count: plants.length,
        estimateSize: () => 49,
        overscan: 10,
        scrollMargin: (listRef.current?.getBoundingClientRect().top ?? 0) + window.scrollY,
    });

    const allSelected = plants.length > 0 && plants.every((p) => selectedIds.has(p.id));

    const toggleSelect = useCallback((id: string) => {
        setSelectedIds((prev) => {
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
            setSelectedIds(new Set(plants.map((p) => p.id)));
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
        if (!detailPlant) return;

        try {
            await createCareEvent(detailPlant.id, "watered");
            await Promise.all([queryClient.invalidateQueries({ queryKey: ["today", "care-events", detailPlant.id] }), collection.utils.refetch()]);
            setDetailPlant(null);
        } catch {
            // Silently handle — the user can retry.
        }
    }, [detailPlant, queryClient, collection]);

    const handleBulkMarkWatered = useCallback(async () => {
        const ids = plants.filter((p) => selectedIds.has(p.id)).map((p) => p.id);
        if (ids.length === 0) return;

        try {
            await createBulkCareEvents(ids, "watered");
            setSelectedIds(new Set());
            await collection.utils.refetch();
        } catch {
            // Silently handle — the user can retry.
        }
    }, [plants, selectedIds, collection]);

    const selectedCount = plants.filter((p) => selectedIds.has(p.id)).length;

    const totalSize = virtualizer.getTotalSize();
    const virtualizerContainerStyle = useMemo(
        () => ({
            height: `${totalSize}px`,
            width: "100%",
            position: "relative" as const,
        }),
        [totalSize],
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

            <FilterBar filters={filters} onFilterChange={updateFilter} onClear={clearFilters} hasActiveFilters={hasActiveFilters} showDueForWatering={false} />

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
                    {virtualizer.getVirtualItems().map((virtualRow) => {
                        const plant = plants[virtualRow.index]!;
                        // oxlint-disable-next-line react-perf/jsx-no-new-object-as-prop -- Virtual row positioning requires per-item inline styles
                        const rowStyle = {
                            position: "absolute" as const,
                            top: 0,
                            left: 0,
                            width: "100%",
                            height: `${virtualRow.size}px`,
                            transform: `translateY(${virtualRow.start - virtualizer.options.scrollMargin}px)`,
                        };
                        return (
                            <div key={plant.id} role="listitem" style={rowStyle}>
                                <PlantListItem plant={plant} selected={selectedIds.has(plant.id)} onToggleSelect={toggleSelect} onClick={handleViewDetail} />
                            </div>
                        );
                    })}
                </div>
            </div>

            <PlantDetailDialog
                plant={detailPlant}
                open={detailPlant !== null}
                onOpenChange={handleDetailOpenChange}
                careSection={detailPlant ? <PlantCareSection plantId={detailPlant.id} wateringFrequency={detailPlant.wateringFrequency} onAdjustmentAccepted={handleAdjustmentAccepted} /> : undefined}
                onMarkWatered={handleMarkWatered}
            />
        </div>
    );
}
