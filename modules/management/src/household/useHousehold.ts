import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { parseHousehold, parseHouseholdMember } from "@packages/api/entities/household";

const HOUSEHOLD_KEY = ["household"];
const MEMBERS_KEY = ["household", "members"];

export function useHousehold() {
    return useQuery({
        queryKey: HOUSEHOLD_KEY,
        queryFn: async () => {
            const response = await fetch("/api/household");

            if (!response.ok) {
                throw new Error(`Failed to fetch household: ${response.status}`);
            }

            const data: unknown = await response.json();

            if (data === null) {
                return null;
            }

            return parseHousehold(data as Record<string, unknown>);
        }
    });
}

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

export function useCreateHousehold() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (name: string) => {
            const response = await fetch("/api/household", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name })
            });

            if (!response.ok) {
                throw new Error(`Failed to create household: ${response.status}`);
            }

            return parseHousehold(await response.json());
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: HOUSEHOLD_KEY });
            queryClient.invalidateQueries({ queryKey: MEMBERS_KEY });
        }
    });
}

export function useInviteMember() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (email: string) => {
            const response = await fetch("/api/household/invite", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email })
            });

            if (!response.ok) {
                throw new Error(`Failed to invite member: ${response.status}`);
            }

            return parseHouseholdMember(await response.json());
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: MEMBERS_KEY });
        }
    });
}
