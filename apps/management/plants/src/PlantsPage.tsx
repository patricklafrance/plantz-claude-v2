import { useLiveQuery } from "@tanstack/react-db";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { Plus } from "lucide-react";
import { useState, useRef, useMemo, useCallback } from "react";

import { Button } from "@packages/components";
import { applyPlantFilters, DeleteConfirmDialog, FilterBar, PlantListHeader, PlantListItem, usePlantFilters } from "@packages/core-plants";
import type { Plant } from "@packages/core-plants";

import { createBulkCareEvents, createCareEvent } from "./careEventsApi.ts";
import { CreatePlantDialog } from "./CreatePlantDialog.tsx";
import { EditPlantDialog } from "./EditPlantDialog.tsx";
import { useManagementPlantsCollection } from "./ManagementPlantsContext.tsx";
import { createManagementPlantActions } from "./plantsCollection.ts";

export function PlantsPage() {
    const { filters, updateFilter, clearFilters, hasActiveFilters } = usePlantFilters();
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [createOpen, setCreateOpen] = useState(false);
    const [editPlant, setEditPlant] = useState<Plant | null>(null);
    const [editOpen, setEditOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<Plant[] | null>(null);
    const listRef = useRef<HTMLDivElement>(null);

    const collection = useManagementPlantsCollection();
    const actions = useMemo(() => createManagementPlantActions(collection), [collection]);
    const { data: allPlants, isReady } = useLiveQuery((q) => q.from({ plant: collection }));

    const plants = useMemo(() => {
        if (!allPlants) return [];
        const sorted = allPlants.toSorted((a, b) => a.name.localeCompare(b.name));

        return applyPlantFilters(sorted, filters);
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

    const handleDeleteSingle = useCallback((plant: Plant) => {
        setDeleteTarget([plant]);
    }, []);

    const handleBulkDelete = useCallback(() => {
        const selected = plants.filter((p) => selectedIds.has(p.id));
        if (selected.length > 0) {
            setDeleteTarget(selected);
        }
    }, [plants, selectedIds]);

    const confirmDelete = useCallback(() => {
        if (!deleteTarget) return;
        const ids = deleteTarget.map((p) => p.id);
        actions.deletePlants(ids);
        setSelectedIds((prev) => {
            const next = new Set(prev);
            for (const plant of deleteTarget) {
                next.delete(plant.id);
            }
            return next;
        });
        if (editOpen && editPlant && deleteTarget.some((p) => p.id === editPlant.id)) {
            setEditOpen(false);
            setEditPlant(null);
        }
        setDeleteTarget(null);
    }, [deleteTarget, editOpen, editPlant, actions]);

    const handleEditFromDialog = useCallback(
        (plant: Plant) => {
            setEditOpen(false);
            setEditPlant(null);
            handleDeleteSingle(plant);
        },
        [handleDeleteSingle],
    );

    const handleOpenCreate = useCallback(() => setCreateOpen(true), []);

    const handleEditPlant = useCallback((plant: Plant) => {
        setEditPlant(plant);
        setEditOpen(true);
    }, []);

    const handleDeleteDialogOpenChange = useCallback((open: boolean) => {
        if (!open) setDeleteTarget(null);
    }, []);

    const handleMarkWatered = useCallback(
        async (plant: Plant) => {
            try {
                await createCareEvent(plant.id, "watered");
                await collection.utils.refetch();
                setEditOpen(false);
                setEditPlant(null);
            } catch {
                // Silently handle — the user can retry.
            }
        },
        [collection],
    );

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

    const deleteTargetNames = deleteTarget?.map((p) => p.name) ?? [];

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
                <h1 className="text-xl font-semibold">Plants</h1>
                <div className="flex items-center gap-2">
                    <Button size="sm" onClick={handleOpenCreate}>
                        <Plus data-icon="inline-start" />
                        New plant
                    </Button>
                </div>
            </div>

            <FilterBar filters={filters} onFilterChange={updateFilter} onClear={clearFilters} hasActiveFilters={hasActiveFilters} />

            {selectedCount > 0 && (
                <div role="status" className="border-primary/20 bg-primary/5 flex items-center gap-3 rounded-lg border px-4 py-2">
                    <span className="text-sm font-medium">{selectedCount} selected</span>
                    <Button variant="default" size="xs" onClick={handleBulkMarkWatered}>
                        Mark selected as Watered
                    </Button>
                    <Button variant="destructive" size="xs" onClick={handleBulkDelete}>
                        Delete selected
                    </Button>
                </div>
            )}

            <div role="status" aria-live="polite" className="text-muted-foreground text-xs">
                {plants.length} plant{plants.length !== 1 ? "s" : ""}
            </div>

            <div className="border-border rounded-lg border">
                <PlantListHeader showActions selectAllChecked={allSelected} onToggleSelectAll={toggleAll} />
                <div ref={listRef} role="list" aria-label="Plants" style={virtualizerContainerStyle}>
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
                                <PlantListItem plant={plant} selected={selectedIds.has(plant.id)} onToggleSelect={toggleSelect} onEdit={handleEditPlant} onDelete={handleDeleteSingle} onMarkWatered={handleMarkWatered} />
                            </div>
                        );
                    })}
                </div>
            </div>

            <CreatePlantDialog open={createOpen} onOpenChange={setCreateOpen} />
            <EditPlantDialog plant={editPlant} open={editOpen} onOpenChange={setEditOpen} onDelete={handleEditFromDialog} onMarkWatered={handleMarkWatered} />
            <DeleteConfirmDialog open={deleteTarget !== null} onOpenChange={handleDeleteDialogOpenChange} plantNames={deleteTargetNames} onConfirm={confirmDelete} />
        </div>
    );
}
