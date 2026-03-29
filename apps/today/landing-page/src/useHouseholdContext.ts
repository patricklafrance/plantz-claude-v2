import { useQuery } from "@tanstack/react-query";

import { getAuthHeaders } from "@packages/core-module";

export interface PlantResponsibility {
    plantId: string;
    strategy: "fixed" | "rotating" | "unassigned";
    responsibleUserId?: string;
    responsibleUserName?: string;
}

export interface LastCareEvent {
    actorName?: string;
    eventDate: string;
}

export interface HouseholdContext {
    isMember: boolean;
    householdId?: string;
    currentUserId?: string;
    responsibilities: PlantResponsibility[];
    lastCareEvents: Record<string, LastCareEvent>;
    memberNames: Record<string, string>;
}

const EMPTY_CONTEXT: HouseholdContext = {
    isMember: false,
    responsibilities: [],
    lastCareEvents: {},
    memberNames: {}
};

async function fetchHouseholdContext(): Promise<HouseholdContext> {
    const response = await fetch("/api/today/household-context", {
        headers: getAuthHeaders()
    });

    if (!response.ok) {
        return EMPTY_CONTEXT;
    }

    const json = await response.json();

    return {
        isMember: json.isMember ?? false,
        householdId: json.householdId,
        currentUserId: json.currentUserId,
        responsibilities: json.responsibilities ?? [],
        lastCareEvents: json.lastCareEvents ?? {},
        memberNames: json.memberNames ?? {}
    };
}

export function useHouseholdContext(): { data: HouseholdContext; isLoading: boolean } {
    const { data, isLoading } = useQuery<HouseholdContext>({
        queryKey: ["today", "household-context"],
        queryFn: fetchHouseholdContext
    });

    return { data: data ?? EMPTY_CONTEXT, isLoading };
}
