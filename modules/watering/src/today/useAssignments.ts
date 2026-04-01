import { useCallback, useEffect, useState } from "react";

import { getAuthHeaders } from "@packages/core-module";

import { responsibilityAssignmentSchema } from "./responsibilitySchema.ts";
import type { ResponsibilityAssignment } from "./responsibilityTypes.ts";

const API_BASE = "/api/today/assignments";

export function useAssignments() {
    const [assignments, setAssignments] = useState<ResponsibilityAssignment[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const refetch = useCallback(async () => {
        try {
            const response = await fetch(API_BASE, {
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch assignments: ${response.status}`);
            }

            const data: unknown[] = await response.json();
            setAssignments(data.map(item => responsibilityAssignmentSchema.parse(item)));
        } catch {
            // Silently handle
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        refetch();
    }, [refetch]);

    return { assignments, isLoading, refetch };
}
