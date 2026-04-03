import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { useState, useRef, useMemo, useCallback } from "react";

import type { Plant } from "@packages/api/entities/plants";
import { getFrequencyDays } from "@packages/api/entities/plants";
import { Button } from "@packages/components";
import { useSession } from "@packages/core-module";

import { FilterBar } from "./FilterBar.tsx";
import { PlantDetailDialog } from "./PlantDetailDialog.tsx";
import { PlantListHeader } from "./PlantListHeader.tsx";
import { PlantListItem } from "./PlantListItem.tsx";
import { applyPlantFilters, isDueForWatering } from "./plantUtils.ts";
import { useHouseholdMembers } from "./useHouseholdMembers.ts";
import { usePlantFilters } from "./usePlantFilters.ts";
import { useTodayAssignments, useSetAssignment } from "./useTodayAssignments.ts";
import { useTodayPlants, useMarkWatered } from "./useTodayPlants.ts";

function computeNextWateringDate(plant: Plant): Date {
    const days = getFrequencyDays(plant.wateringFrequency);
    const next = new Date();
    next.setDate(next.getDate() + days);
    next.setHours(0, 0, 0, 0);

    return next;
}

export function LandingPage() {
    const { filters, updateFilter, clearFilters, hasActiveFilters } = usePlantFilters();
    const [detailPlant, setDetailPlant] = useState<Plant | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const listRef = useRef<HTMLDivElement>(null);

    const session = useSession();
    const { data: allPlants, isPending: isPlantsLoading } = useTodayPlants();
    const { data: assignments, isPending: isAssignmentsLoading } = useTodayAssignments();
    const { data: members } = useHouseholdMembers();
    const markWatered = useMarkWatered();
    const setAssignment = useSetAssignment();

    const isPending = isPlantsLoading || isAssignmentsLoading;

    const assignmentMap = useMemo(() => {
        if (!assignments) {
            return new Map<string, { assignedTo?: string; isMine: boolean }>();
        }

        const map = new Map<string, { assignedTo?: string; isMine: boolean }>();

        for (const a of assignments) {
            const isMine = a.assignedMemberId ? (members?.some(m => m.id === a.assignedMemberId && m.userId === session?.id) ?? false) : false;

            map.set(a.plantId, {
                assignedTo:
                    a.strategy === "fixed" && a.assignedMemberName ? a.assignedMemberName : a.strategy === "rotating" ? "Rotating" : undefined,
                isMine
            });
        }

        return map;
    }, [assignments, members, session?.id]);

    const plants = useMemo(() => {
        if (!allPlants) {
            return [];
        }

        // First sort by name, then filter to only plants due for watering, then apply user filters
        const sorted = allPlants.toSorted((a, b) => a.name.localeCompare(b.name));
        const duePlants = sorted.filter(p => isDueForWatering(p));

        return applyPlantFilters(duePlants, filters);
    }, [allPlants, filters]);

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

    const handleMarkWatered = useCallback(() => {
        if (!detailPlant) {
            return;
        }

        markWatered.mutate({ id: detailPlant.id, nextWateringDate: computeNextWateringDate(detailPlant) }, { onSuccess: () => setDetailPlant(null) });
    }, [detailPlant, markWatered]);

    const handleBulkMarkWatered = useCallback(() => {
        const duePlants = plants.filter(p => selectedIds.has(p.id));
        if (duePlants.length === 0) {
            return;
        }

        for (const plant of duePlants) {
            markWatered.mutate({ id: plant.id, nextWateringDate: computeNextWateringDate(plant) });
        }
        setSelectedIds(new Set());
    }, [plants, selectedIds, markWatered]);

    const handleAssignmentChange = useCallback(
        (strategy: "fixed" | "rotating" | "unassigned", memberId?: string, memberName?: string) => {
            if (!detailPlant) {
                return;
            }

            setAssignment.mutate({
                plantId: detailPlant.id,
                strategy,
                assignedMemberId: strategy === "fixed" ? memberId : undefined,
                assignedMemberName: strategy === "fixed" ? memberName : undefined
            });
        },
        [detailPlant, setAssignment]
    );

    const detailAssignment = useMemo(() => {
        if (!detailPlant || !assignments) {
            return undefined;
        }

        return assignments.find(a => a.plantId === detailPlant.id);
    }, [detailPlant, assignments]);

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

    if (isPending) {
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
                        const assignmentInfo = assignmentMap.get(plant.id);
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
                            <div key={plant.id} role="listitem" style={rowStyle}>
                                <PlantListItem
                                    plant={plant}
                                    selected={selectedIds.has(plant.id)}
                                    assignedTo={assignmentInfo?.assignedTo}
                                    isMine={assignmentInfo?.isMine}
                                    onToggleSelect={toggleSelect}
                                    onClick={handleViewDetail}
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
                onMarkWatered={handleMarkWatered}
                assignment={detailAssignment}
                members={members}
                isSavingAssignment={setAssignment.isPending}
                onAssignmentChange={handleAssignmentChange}
            />
        </div>
    );
}
