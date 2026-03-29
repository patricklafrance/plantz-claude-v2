import { useLiveQuery } from "@tanstack/react-db";
import { Home, Plus, Users } from "lucide-react";
import { useState, useEffect, useCallback } from "react";

import { Button } from "@packages/components";
import { getAuthHeaders } from "@packages/core-module";

import { CreateHouseholdDialog } from "./CreateHouseholdDialog.tsx";
import { useManagementHouseholdCollection } from "./ManagementHouseholdContext.tsx";

interface MemberResponse {
    id: string;
    householdId: string;
    userId: string;
    userName: string;
    joinedDate: string;
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

export function HouseholdPage() {
    const [createOpen, setCreateOpen] = useState(false);
    const [members, setMembers] = useState<MemberResponse[]>([]);

    const collection = useManagementHouseholdCollection();
    const { data: households, isReady } = useLiveQuery(q => q.from({ household: collection }));

    const household = households?.[0];

    const loadMembers = useCallback(async (householdId: string) => {
        const result = await fetchMembers(householdId);
        setMembers(result);
    }, []);

    useEffect(() => {
        if (household) {
            loadMembers(household.id);
        }
    }, [household, loadMembers]);

    if (!isReady) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="text-muted-foreground text-sm">Loading...</div>
            </div>
        );
    }

    if (!household) {
        return (
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
        </div>
    );
}
