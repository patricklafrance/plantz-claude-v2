import { useLiveQuery } from "@tanstack/react-db";
import { Check, Home, Leaf, LoaderCircle, Mail, Plus, Users, X } from "lucide-react";
import { useState, useEffect, useCallback } from "react";

import { Button, Select, SelectContent, SelectGroup, SelectItem, SelectTrigger } from "@packages/components";
import { getAuthHeaders } from "@packages/core-module";

import { CreateHouseholdDialog } from "./CreateHouseholdDialog.tsx";
import { acceptInvitation, declineInvitation } from "./householdCollection.ts";
import { InviteMemberDialog } from "./InviteMemberDialog.tsx";
import { useManagementHouseholdCollection } from "./ManagementHouseholdContext.tsx";

interface MemberResponse {
    id: string;
    householdId: string;
    userId: string;
    userName: string;
    joinedDate: string;
}

interface InvitationResponse {
    id: string;
    householdId: string;
    invitedBy: string;
    inviteeEmail: string;
    status: string;
    creationDate: string;
}

interface MyInvitationResponse {
    id: string;
    householdId: string;
    invitedBy: string;
    inviteeEmail: string;
    status: string;
    creationDate: string;
    householdName: string;
    inviterName: string;
}

interface SharedPlantResponse {
    id: string;
    name: string;
    householdId: string;
}

interface AssignmentResponse {
    id: string;
    plantId: string;
    householdId: string;
    strategy: "fixed" | "rotating" | "unassigned";
    assignedUserId?: string;
    responsibleUserName?: string;
}

async function fetchMembers(householdId: string): Promise<MemberResponse[]> {
    const response = await fetch(`/api/management/household/${householdId}/members`, {
        headers: getAuthHeaders()
    });

    if (!response.ok) {
        return [];
    }

    return response.json() as Promise<MemberResponse[]>;
}

async function fetchPendingInvitations(householdId: string): Promise<InvitationResponse[]> {
    const response = await fetch(`/api/management/household/${householdId}/invitations`, {
        headers: getAuthHeaders()
    });

    if (!response.ok) {
        return [];
    }

    return response.json() as Promise<InvitationResponse[]>;
}

async function fetchMyInvitations(): Promise<MyInvitationResponse[]> {
    const response = await fetch("/api/management/household/invitations/mine", {
        headers: getAuthHeaders()
    });

    if (!response.ok) {
        return [];
    }

    return response.json() as Promise<MyInvitationResponse[]>;
}

async function fetchSharedPlants(householdId: string): Promise<SharedPlantResponse[]> {
    const response = await fetch(`/api/management/household/${householdId}/shared-plants`, {
        headers: getAuthHeaders()
    });

    if (!response.ok) {
        return [];
    }

    return response.json() as Promise<SharedPlantResponse[]>;
}

async function fetchAssignments(householdId: string): Promise<AssignmentResponse[]> {
    const response = await fetch(`/api/management/household/${householdId}/assignments`, {
        headers: getAuthHeaders()
    });

    if (!response.ok) {
        return [];
    }

    return response.json() as Promise<AssignmentResponse[]>;
}

async function updateAssignment(plantId: string, strategy: string, assignedUserId?: string): Promise<AssignmentResponse> {
    const response = await fetch(`/api/management/household/assignments/${plantId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ strategy, assignedUserId })
    });

    return response.json() as Promise<AssignmentResponse>;
}

export function HouseholdPage() {
    const [createOpen, setCreateOpen] = useState(false);
    const [inviteOpen, setInviteOpen] = useState(false);
    const [members, setMembers] = useState<MemberResponse[]>([]);
    const [pendingInvitations, setPendingInvitations] = useState<InvitationResponse[]>([]);
    const [myInvitations, setMyInvitations] = useState<MyInvitationResponse[]>([]);
    const [loadingAction, setLoadingAction] = useState<string | null>(null);
    const [sharedPlants, setSharedPlants] = useState<SharedPlantResponse[]>([]);
    const [assignments, setAssignments] = useState<AssignmentResponse[]>([]);

    const collection = useManagementHouseholdCollection();
    const { data: households, isReady } = useLiveQuery(q => q.from({ household: collection }));

    const household = households?.[0];

    const loadMembers = useCallback(async (householdId: string) => {
        const result = await fetchMembers(householdId);
        setMembers(result);
    }, []);

    const loadPendingInvitations = useCallback(async (householdId: string) => {
        const result = await fetchPendingInvitations(householdId);
        setPendingInvitations(result);
    }, []);

    const loadMyInvitations = useCallback(async () => {
        const result = await fetchMyInvitations();
        setMyInvitations(result);
    }, []);

    const loadSharedPlants = useCallback(async (householdId: string) => {
        const result = await fetchSharedPlants(householdId);
        setSharedPlants(result);
    }, []);

    const loadAssignments = useCallback(async (householdId: string) => {
        const result = await fetchAssignments(householdId);
        setAssignments(result);
    }, []);

    useEffect(() => {
        if (household) {
            loadMembers(household.id);
            loadPendingInvitations(household.id);
            loadSharedPlants(household.id);
            loadAssignments(household.id);
        }
    }, [household, loadMembers, loadPendingInvitations, loadSharedPlants, loadAssignments]);

    useEffect(() => {
        loadMyInvitations();
    }, [loadMyInvitations]);

    async function handleAccept(invitationId: string) {
        setLoadingAction(`accept-${invitationId}`);

        try {
            await acceptInvitation(invitationId);
            await loadMyInvitations();

            if (household) {
                await loadMembers(household.id);
            }
        } finally {
            setLoadingAction(null);
        }
    }

    async function handleDecline(invitationId: string) {
        setLoadingAction(`decline-${invitationId}`);

        try {
            await declineInvitation(invitationId);
            await loadMyInvitations();
        } finally {
            setLoadingAction(null);
        }
    }

    async function handleAssignmentChange(plantId: string, value: string) {
        setLoadingAction(`assignment-${plantId}`);

        try {
            // value format: "fixed:<userId>", "rotating", or "unassigned"
            let strategy: string;
            let assignedUserId: string | undefined;

            if (value.startsWith("fixed:")) {
                strategy = "fixed";
                assignedUserId = value.slice(6);
            } else {
                strategy = value;
            }

            await updateAssignment(plantId, strategy, assignedUserId);

            if (household) {
                await loadAssignments(household.id);
            }
        } finally {
            setLoadingAction(null);
        }
    }

    function handleInviteSent() {
        if (household) {
            loadPendingInvitations(household.id);
        }
    }

    if (!isReady) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="text-muted-foreground text-sm">Loading...</div>
            </div>
        );
    }

    if (!household) {
        return (
            <div className="flex flex-col gap-8 p-4 sm:p-6">
                <div className="flex flex-col items-center justify-center gap-6 p-12">
                    <div className="bg-muted flex h-16 w-16 items-center justify-center rounded-full">
                        <Home className="text-muted-foreground h-8 w-8" />
                    </div>
                    <div className="flex flex-col items-center gap-2 text-center">
                        <h1 className="text-xl font-semibold">No household yet</h1>
                        <p className="text-muted-foreground max-w-sm text-sm">Create a household to share plants and coordinate care with others.</p>
                    </div>
                    <Button onClick={() => setCreateOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Household
                    </Button>
                    <CreateHouseholdDialog open={createOpen} onOpenChange={setCreateOpen} />
                </div>
                {myInvitations.length > 0 && (
                    <MyInvitationsSection
                        invitations={myInvitations}
                        loadingAction={loadingAction}
                        onAccept={handleAccept}
                        onDecline={handleDecline}
                    />
                )}
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 p-4 sm:p-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg">
                        <Home className="text-primary h-5 w-5" />
                    </div>
                    <h1 className="text-xl font-semibold">{household.name}</h1>
                </div>
                <Button variant="outline" size="sm" onClick={() => setInviteOpen(true)}>
                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                    Invite Member
                </Button>
            </div>
            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
                    <Users className="text-muted-foreground h-4 w-4" />
                    <h2 className="text-sm font-medium">Members ({members.length})</h2>
                </div>
                <div className="divide-border divide-y rounded-lg border">
                    {members.map(member => (
                        <div key={member.id} className="flex items-center gap-3 px-4 py-3">
                            <div className="bg-muted flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium">
                                {member.userName.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm">{member.userName}</span>
                        </div>
                    ))}
                </div>
            </div>
            {pendingInvitations.length > 0 && (
                <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-2">
                        <Mail className="text-muted-foreground h-4 w-4" />
                        <h2 className="text-sm font-medium">Pending Invitations ({pendingInvitations.length})</h2>
                    </div>
                    <div className="divide-border divide-y rounded-lg border">
                        {pendingInvitations.map(invitation => (
                            <div key={invitation.id} className="flex items-center justify-between px-4 py-3">
                                <div className="flex items-center gap-3">
                                    <div className="bg-muted flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium">
                                        {invitation.inviteeEmail.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm">{invitation.inviteeEmail}</span>
                                        <span className="text-muted-foreground text-xs">Pending</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            {sharedPlants.length > 0 && (
                <SharedPlantsSection
                    plants={sharedPlants}
                    assignments={assignments}
                    members={members}
                    loadingAction={loadingAction}
                    onAssignmentChange={handleAssignmentChange}
                />
            )}
            {myInvitations.length > 0 && (
                <MyInvitationsSection invitations={myInvitations} loadingAction={loadingAction} onAccept={handleAccept} onDecline={handleDecline} />
            )}
            <InviteMemberDialog open={inviteOpen} onOpenChange={setInviteOpen} householdId={household.id} onInviteSent={handleInviteSent} />
        </div>
    );
}

interface SharedPlantsSectionProps {
    plants: SharedPlantResponse[];
    assignments: AssignmentResponse[];
    members: MemberResponse[];
    loadingAction: string | null;
    onAssignmentChange: (plantId: string, value: string) => void;
}

function getAssignmentDisplayValue(assignment: AssignmentResponse | undefined): string {
    if (!assignment) {
        return "Unassigned";
    }

    if (assignment.strategy === "fixed" && assignment.responsibleUserName) {
        return assignment.responsibleUserName;
    }

    if (assignment.strategy === "rotating") {
        return "Rotating";
    }

    return "Unassigned";
}

function getAssignmentSelectValue(assignment: AssignmentResponse | undefined): string {
    if (!assignment || assignment.strategy === "unassigned") {
        return "unassigned";
    }

    if (assignment.strategy === "fixed" && assignment.assignedUserId) {
        return `fixed:${assignment.assignedUserId}`;
    }

    if (assignment.strategy === "rotating") {
        return "rotating";
    }

    return "unassigned";
}

function SharedPlantsSection({ plants, assignments, members, loadingAction, onAssignmentChange }: SharedPlantsSectionProps) {
    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
                <Leaf className="text-muted-foreground h-4 w-4" />
                <h2 className="text-sm font-medium">Shared Plants ({plants.length})</h2>
            </div>
            <div className="divide-border divide-y rounded-lg border">
                {plants.map(plant => {
                    const assignment = assignments.find(a => a.plantId === plant.id);
                    const isUpdating = loadingAction === `assignment-${plant.id}`;
                    const isAnyActionLoading = loadingAction !== null;
                    const displayValue = getAssignmentDisplayValue(assignment);
                    const selectValue = getAssignmentSelectValue(assignment);

                    return (
                        <div key={plant.id} className="flex items-center justify-between px-4 py-3">
                            <div className="flex flex-col gap-0.5">
                                <span className="text-sm font-medium">{plant.name}</span>
                                <span className="text-muted-foreground text-xs">
                                    {assignment?.strategy === "rotating" && assignment.responsibleUserName
                                        ? `Rotating - currently ${assignment.responsibleUserName}`
                                        : displayValue}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                {isUpdating && <LoaderCircle className="text-muted-foreground h-3.5 w-3.5 animate-spin" />}
                                <Select
                                    value={selectValue}
                                    onValueChange={value => {
                                        if (value) onAssignmentChange(plant.id, value);
                                    }}
                                    disabled={isAnyActionLoading}
                                >
                                    <SelectTrigger size="sm" className="w-[140px]" aria-label={`Responsibility for ${plant.name}`}>
                                        <span data-slot="select-value">{displayValue}</span>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            <SelectItem value="unassigned">Unassigned</SelectItem>
                                            <SelectItem value="rotating">Rotating</SelectItem>
                                            {members.map(member => (
                                                <SelectItem key={member.userId} value={`fixed:${member.userId}`}>
                                                    {member.userName}
                                                </SelectItem>
                                            ))}
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

interface MyInvitationsSectionProps {
    invitations: MyInvitationResponse[];
    loadingAction: string | null;
    onAccept: (id: string) => void;
    onDecline: (id: string) => void;
}

function MyInvitationsSection({ invitations, loadingAction, onAccept, onDecline }: MyInvitationsSectionProps) {
    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
                <Mail className="text-muted-foreground h-4 w-4" />
                <h2 className="text-sm font-medium">My Invitations ({invitations.length})</h2>
            </div>
            <div className="divide-border divide-y rounded-lg border">
                {invitations.map(invitation => {
                    const isAccepting = loadingAction === `accept-${invitation.id}`;
                    const isDeclining = loadingAction === `decline-${invitation.id}`;
                    const isDisabled = loadingAction !== null;

                    return (
                        <div key={invitation.id} className="flex items-center justify-between px-4 py-3">
                            <div className="flex flex-col gap-0.5">
                                <span className="text-sm font-medium">{invitation.householdName}</span>
                                <span className="text-muted-foreground text-xs">Invited by {invitation.inviterName}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onAccept(invitation.id)}
                                    disabled={isDisabled}
                                    aria-label={`Accept invitation from ${invitation.householdName}`}
                                >
                                    {isAccepting ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                                    <span className="ml-1">Accept</span>
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onDecline(invitation.id)}
                                    disabled={isDisabled}
                                    aria-label={`Decline invitation from ${invitation.householdName}`}
                                >
                                    {isDeclining ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
                                    <span className="ml-1">Decline</span>
                                </Button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
