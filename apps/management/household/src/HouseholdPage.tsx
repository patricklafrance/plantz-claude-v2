import { useLiveQuery } from "@tanstack/react-db";
import { Pencil, Trash2, Plus, UserPlus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@packages/components";
import type { Household } from "@packages/core-module";
import { getAuthHeaders } from "@packages/core-module";

import type { AssignmentRow } from "./AssignmentList.tsx";
import { AssignmentList } from "./AssignmentList.tsx";
import { CreateHouseholdDialog } from "./CreateHouseholdDialog.tsx";
import { DeleteHouseholdConfirmDialog } from "./DeleteHouseholdConfirmDialog.tsx";
import { EditAssignmentDialog } from "./EditAssignmentDialog.tsx";
import { EditHouseholdDialog } from "./EditHouseholdDialog.tsx";
import { InviteMemberDialog } from "./InviteMemberDialog.tsx";
import { useManagementHouseholdCollection } from "./ManagementHouseholdContext.tsx";
import type { MemberRow } from "./MemberList.tsx";
import { MemberList } from "./MemberList.tsx";
import { RemoveMemberConfirmDialog } from "./RemoveMemberConfirmDialog.tsx";

function formatDate(date: Date): string {
    return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

interface EnrichedMember {
    id: string;
    householdId: string;
    userId: string;
    joinedAt: Date;
    name: string;
    email: string;
}

async function fetchMembers(householdId: string): Promise<EnrichedMember[]> {
    const response = await fetch(`/api/management/households/${householdId}/members`, {
        headers: getAuthHeaders()
    });

    if (!response.ok) {
        return [];
    }

    const raw = (await response.json()) as Array<{ id: string; householdId: string; userId: string; joinedAt: string; name: string; email: string }>;

    return raw.map(m => ({ ...m, joinedAt: new Date(m.joinedAt) }));
}

async function fetchAssignments(householdId: string): Promise<AssignmentRow[]> {
    const response = await fetch(`/api/management/households/${householdId}/assignments`, {
        headers: getAuthHeaders()
    });

    if (!response.ok) {
        return [];
    }

    return (await response.json()) as AssignmentRow[];
}

export function HouseholdPage() {
    const [createOpen, setCreateOpen] = useState(false);
    const [editHousehold, setEditHousehold] = useState<Household | null>(null);
    const [editOpen, setEditOpen] = useState(false);
    const [deleteHousehold, setDeleteHousehold] = useState<Household | null>(null);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [inviteOpen, setInviteOpen] = useState(false);
    const [removeMember, setRemoveMember] = useState<MemberRow | null>(null);
    const [removeOpen, setRemoveOpen] = useState(false);
    const [members, setMembers] = useState<EnrichedMember[]>([]);
    const [assignments, setAssignments] = useState<AssignmentRow[]>([]);
    const [editAssignment, setEditAssignment] = useState<AssignmentRow | null>(null);
    const [editAssignmentOpen, setEditAssignmentOpen] = useState(false);

    const collection = useManagementHouseholdCollection();
    const { data: households, isReady } = useLiveQuery(q => q.from({ household: collection }));

    const household = households?.[0] ?? null;

    const loadMembers = useCallback(async (h: Household) => {
        const fetched = await fetchMembers(h.id);
        setMembers(fetched);
    }, []);

    const loadAssignments = useCallback(async (h: Household) => {
        const fetched = await fetchAssignments(h.id);
        setAssignments(fetched);
    }, []);

    useEffect(() => {
        if (household) {
            void loadMembers(household);
        } else {
            setMembers([]);
        }
    }, [household, loadMembers]);

    useEffect(() => {
        if (household) {
            void loadAssignments(household);
        } else {
            setAssignments([]);
        }
    }, [household, loadAssignments]);

    function handleEdit(h: Household) {
        setEditHousehold(h);
        setEditOpen(true);
    }

    function handleDelete(h: Household) {
        setDeleteHousehold(h);
        setDeleteOpen(true);
    }

    function handleRemoveMember(member: MemberRow) {
        setRemoveMember(member);
        setRemoveOpen(true);
    }

    function handleMemberRemoved() {
        if (household) {
            void loadMembers(household);
        }
    }

    function handleMemberInvited() {
        if (household) {
            void loadMembers(household);
        }
    }

    function handleEditAssignment(assignment: AssignmentRow) {
        setEditAssignment(assignment);
        setEditAssignmentOpen(true);
    }

    function handleAssignmentSaved(updated: AssignmentRow) {
        setAssignments(prev => prev.map(a => (a.id === updated.id ? updated : a)));
    }

    // Enrich assignments with member names from loaded members
    const enrichedAssignments: AssignmentRow[] = assignments.map(a => {
        if (a.assignmentType === "fixed" && a.assignedUserId) {
            const member = members.find(m => m.userId === a.assignedUserId);
            return { ...a, assignedMemberName: member?.name ?? a.assignedUserId };
        }
        return a;
    });

    const memberOptions = members.map(m => ({ id: m.id, userId: m.userId, name: m.name }));

    // The API returns enriched member data (name + email) so no additional lookup is needed.
    const memberRows: MemberRow[] = members.map(m => ({
        id: m.id,
        name: m.name,
        email: m.email,
        joinedAt: m.joinedAt,
        isOwner: household?.ownerId === m.userId
    }));

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
                <div className="border-border flex flex-col gap-6 rounded-lg border p-6">
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

                    <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold">Members</h3>
                            <Button size="sm" onClick={() => setInviteOpen(true)}>
                                <UserPlus data-icon="inline-start" aria-hidden="true" />
                                Invite Member
                            </Button>
                        </div>
                        <div className="border-border rounded-lg border">
                            <MemberList members={memberRows} onRemove={handleRemoveMember} />
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold">Responsibility Assignments</h3>
                        </div>
                        <div className="border-border rounded-lg border">
                            <AssignmentList assignments={enrichedAssignments} onEdit={handleEditAssignment} />
                        </div>
                    </div>
                </div>
            )}

            <CreateHouseholdDialog open={createOpen} onOpenChange={setCreateOpen} />
            <EditHouseholdDialog household={editHousehold} open={editOpen} onOpenChange={setEditOpen} />
            <DeleteHouseholdConfirmDialog household={deleteHousehold} open={deleteOpen} onOpenChange={setDeleteOpen} />
            {household && (
                <>
                    <InviteMemberDialog householdId={household.id} open={inviteOpen} onOpenChange={setInviteOpen} onInvited={handleMemberInvited} />
                    <RemoveMemberConfirmDialog
                        member={removeMember}
                        householdId={household.id}
                        open={removeOpen}
                        onOpenChange={setRemoveOpen}
                        onRemoved={handleMemberRemoved}
                    />
                    <EditAssignmentDialog
                        assignment={editAssignment}
                        members={memberOptions}
                        householdId={household.id}
                        open={editAssignmentOpen}
                        onOpenChange={setEditAssignmentOpen}
                        onSaved={handleAssignmentSaved}
                    />
                </>
            )}
        </div>
    );
}
