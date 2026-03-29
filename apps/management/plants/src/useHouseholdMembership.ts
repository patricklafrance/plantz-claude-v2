import { useQuery } from "@tanstack/react-query";

import { getAuthHeaders } from "@packages/core-module";

interface MembershipResult {
    householdId: string | null;
    isLoading: boolean;
}

async function fetchMembership(): Promise<string | null> {
    const response = await fetch("/api/management/plants/membership", {
        headers: getAuthHeaders()
    });

    if (!response.ok) {
        return null;
    }

    const data = (await response.json()) as { householdId: string | null };

    return data.householdId;
}

export function useHouseholdMembership(): MembershipResult {
    const { data, isLoading } = useQuery<string | null>({
        queryKey: ["management", "plants", "membership"],
        queryFn: fetchMembership
    });

    return { householdId: data ?? null, isLoading };
}
