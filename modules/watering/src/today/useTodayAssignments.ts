import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { parseResponsibilityAssignment } from "@packages/api/entities/responsibility";

const API_BASE = "/api/today/assignments";
const QUERY_KEY = ["today", "assignments", "list"];
const PLANTS_QUERY_KEY = ["today", "plants", "list"];

export function useTodayAssignments() {
    return useQuery({
        queryKey: QUERY_KEY,
        queryFn: async () => {
            const response = await fetch(API_BASE);

            if (!response.ok) {
                throw new Error(`Failed to fetch assignments: ${response.status}`);
            }

            const data: unknown[] = await response.json();

            return data.map(item => parseResponsibilityAssignment(item as Record<string, unknown>));
        }
    });
}

export function useSetAssignment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            plantId,
            strategy,
            assignedMemberId,
            assignedMemberName
        }: {
            plantId: string;
            strategy: "fixed" | "rotating" | "unassigned";
            assignedMemberId?: string;
            assignedMemberName?: string;
        }) => {
            const response = await fetch(`${API_BASE}/${plantId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ strategy, assignedMemberId, assignedMemberName })
            });

            if (!response.ok) {
                throw new Error(`Failed to set assignment: ${response.status}`);
            }

            return parseResponsibilityAssignment(await response.json());
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY });
            queryClient.invalidateQueries({ queryKey: PLANTS_QUERY_KEY });
        }
    });
}
