import { useLiveQuery } from "@tanstack/react-db";
import { Pencil, Trash2, Plus } from "lucide-react";
import { useState } from "react";

import { Button } from "@packages/components";
import type { Household } from "@packages/core-module";

import { CreateHouseholdDialog } from "./CreateHouseholdDialog.tsx";
import { DeleteHouseholdConfirmDialog } from "./DeleteHouseholdConfirmDialog.tsx";
import { EditHouseholdDialog } from "./EditHouseholdDialog.tsx";
import { useManagementHouseholdCollection } from "./ManagementHouseholdContext.tsx";

function formatDate(date: Date): string {
    return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

export function HouseholdPage() {
    const [createOpen, setCreateOpen] = useState(false);
    const [editHousehold, setEditHousehold] = useState<Household | null>(null);
    const [editOpen, setEditOpen] = useState(false);
    const [deleteHousehold, setDeleteHousehold] = useState<Household | null>(null);
    const [deleteOpen, setDeleteOpen] = useState(false);

    const collection = useManagementHouseholdCollection();
    const { data: households, isReady } = useLiveQuery(q => q.from({ household: collection }));

    const household = households?.[0] ?? null;

    function handleEdit(h: Household) {
        setEditHousehold(h);
        setEditOpen(true);
    }

    function handleDelete(h: Household) {
        setDeleteHousehold(h);
        setDeleteOpen(true);
    }

    if (!isReady) {
        return (
            <div className="flex items-center justify-center p-6">
                <p className="text-muted-foreground text-sm">Loading...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4 p-6">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-semibold">Household</h1>
            </div>

            {!household ? (
                <div className="border-border flex flex-col items-center gap-4 rounded-lg border p-8 text-center">
                    <p className="text-muted-foreground text-sm">You don&apos;t have a household yet</p>
                    <Button size="sm" onClick={() => setCreateOpen(true)}>
                        <Plus data-icon="inline-start" aria-hidden="true" />
                        Create Household
                    </Button>
                </div>
            ) : (
                <div className="border-border rounded-lg border p-6">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex flex-col gap-1">
                            <h2 className="text-lg font-medium">{household.name}</h2>
                            <p className="text-muted-foreground text-sm">Created {formatDate(household.createdAt)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleEdit(household)} aria-label={`Edit ${household.name}`}>
                                <Pencil data-icon="inline-start" aria-hidden="true" />
                                Edit
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => handleDelete(household)} aria-label={`Delete ${household.name}`}>
                                <Trash2 data-icon="inline-start" aria-hidden="true" />
                                Delete
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <CreateHouseholdDialog open={createOpen} onOpenChange={setCreateOpen} />
            <EditHouseholdDialog household={editHousehold} open={editOpen} onOpenChange={setEditOpen} />
            <DeleteHouseholdConfirmDialog household={deleteHousehold} open={deleteOpen} onOpenChange={setDeleteOpen} />
        </div>
    );
}
