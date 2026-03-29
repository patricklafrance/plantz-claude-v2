import { useEffect, useState } from "react";

import { getAuthHeaders } from "@packages/core-module";

interface MembershipResult {
    householdId: string | null;
    isLoading: boolean;
}

export function useHouseholdMembership(): MembershipResult {
    const [householdId, setHouseholdId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        async function fetchMembership() {
            try {
                const response = await fetch("/api/management/plants/membership", {
                    headers: getAuthHeaders()
                });

                if (!response.ok) {
                    return;
                }

                const data = (await response.json()) as { householdId: string | null };

                if (!cancelled) {
                    setHouseholdId(data.householdId);
                }
            } finally {
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        }

        fetchMembership();

        return () => {
            cancelled = true;
        };
    }, []);

    return { householdId, isLoading };
}
