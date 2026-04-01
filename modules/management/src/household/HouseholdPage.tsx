import { useLiveQuery } from "@tanstack/react-db";
import { Plus, Home, Users, UserPlus, X } from "lucide-react";
import { useState, useCallback, useMemo } from "react";

import { Button, Badge } from "@packages/components";
import { getCurrentUserId } from "@packages/core-module";

import { CreateHouseholdDialog } from "./CreateHouseholdDialog.tsx";
import { createManagementHouseholdMemberActions } from "./householdCollection.ts";
import { InviteMemberDialog } from "./InviteMemberDialog.tsx";
import { useManagementHouseholdCollection } from "./ManagementHouseholdContext.tsx";

export function HouseholdPage() {
    const [createOpen, setCreateOpen] = useState(false);
    const [inviteOpen, setInviteOpen] = useState(false);

    const collection = useManagementHouseholdCollection();
    const { data: households, isReady } = useLiveQuery(q => q.from({ household: collection }));
    const memberActions = useMemo(() => createManagementHouseholdMemberActions(collection), [collection]);

    const currentUserId = getCurrentUserId();

    const handleOpenCreate = useCallback(() => setCreateOpen(true), []);
    const handleOpenInvite = useCallback(() => setInviteOpen(true), []);

    if (!isReady) {
        return (
            <div className="flex items-center justify-center p-6">
                <p className="text-muted-foreground text-sm">Loading household...</p>
            </div>
        );
    }

    const household = households?.[0];

    // Determine if the current user is the owner
    const isOwner = household?.createdBy === currentUserId;

    // Check if the current user has a pending invitation
    const currentUserMember = household?.members.find(m => m.userId === currentUserId);
    const hasPendingInvite = currentUserMember?.status === "invited";

    function handleAcceptInvite() {
        if (!household || !currentUserId) return;
        memberActions.acceptInvite({ householdId: household.id, userId: currentUserId });
    }

    function handleDeclineInvite() {
        if (!household || !currentUserId) return;
        memberActions.declineInvite({ householdId: household.id, userId: currentUserId });
    }

    function handleRemoveMember(userId: string) {
        if (!household) return;
        memberActions.removeMember({ householdId: household.id, userId });
    }

    return (
        <div className="flex flex-col gap-4 p-6">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-semibold">Household</h1>
            </div>

            {!household ? (
                <div className="border-border flex flex-col items-center gap-4 rounded-lg border border-dashed p-12">
                    <div className="bg-muted flex size-12 items-center justify-center rounded-full">
                        <Home className="text-muted-foreground size-6" aria-hidden="true" />
                    </div>
                    <div className="text-center">
                        <p className="text-sm font-medium">No household yet</p>
                        <p className="text-muted-foreground text-sm">Create a household to share plants and coordinate care with others.</p>
                    </div>
                    <Button size="sm" onClick={handleOpenCreate}>
                        <Plus data-icon="inline-start" />
                        Create Household
                    </Button>
                </div>
            ) : (
                <div className="border-border rounded-lg border">
                    <div className="border-border flex items-center gap-3 border-b p-4">
                        <div className="bg-primary/10 flex size-10 items-center justify-center rounded-full">
                            <Home className="text-primary size-5" aria-hidden="true" />
                        </div>
                        <div>
                            <h2 className="font-medium">{household.name}</h2>
                            <p className="text-muted-foreground text-xs">Created {household.createdAt.toLocaleDateString()}</p>
                        </div>
                    </div>

                    {hasPendingInvite && (
                        <div className="bg-muted/50 border-border flex items-center justify-between border-b px-4 py-3">
                            <p className="text-sm">You have been invited to join this household.</p>
                            <div className="flex gap-2">
                                <Button size="sm" onClick={handleAcceptInvite}>
                                    Accept
                                </Button>
                                <Button size="sm" variant="outline" onClick={handleDeclineInvite}>
                                    Decline
                                </Button>
                            </div>
                        </div>
                    )}

                    <div className="p-4">
                        <div className="mb-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Users className="text-muted-foreground size-4" aria-hidden="true" />
                                <h3 className="text-sm font-medium">Members</h3>
                            </div>
                            {isOwner && (
                                <Button size="sm" variant="outline" onClick={handleOpenInvite}>
                                    <UserPlus data-icon="inline-start" />
                                    Invite Member
                                </Button>
                            )}
                        </div>
                        <ul className="flex flex-col gap-2" aria-label="Household members">
                            {household.members.map(member => (
                                <li key={member.userId} className="flex items-center justify-between rounded-md px-3 py-2 text-sm">
                                    <div className="flex items-center gap-2">
                                        <span>{member.userName}</span>
                                        <span className="text-muted-foreground text-xs">{member.email}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {member.status === "invited" && <Badge variant="outline">Invited</Badge>}
                                        <Badge variant={member.role === "owner" ? "default" : "secondary"}>{member.role}</Badge>
                                        {isOwner && member.role !== "owner" && (
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="size-7"
                                                onClick={() => handleRemoveMember(member.userId)}
                                                aria-label={`Remove ${member.userName}`}
                                            >
                                                <X className="size-3.5" />
                                            </Button>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

            <CreateHouseholdDialog open={createOpen} onOpenChange={setCreateOpen} />
            {household && <InviteMemberDialog open={inviteOpen} onOpenChange={setInviteOpen} householdId={household.id} />}
        </div>
    );
}
