import { useQuery } from "@tanstack/react-query";

import { parseHouseholdMember } from "@packages/api/entities/household";

const MEMBERS_KEY = ["household", "members"];

export function useHouseholdMembers() {
    return useQuery({
        queryKey: MEMBERS_KEY,
        queryFn: async () => {
            const response = await fetch("/api/household/members");

            if (!response.ok) {
                throw new Error(`Failed to fetch members: ${response.status}`);
            }

            const data: unknown[] = await response.json();

            return data.map(item => parseHouseholdMember(item as Record<string, unknown>));
        }
    });
}
