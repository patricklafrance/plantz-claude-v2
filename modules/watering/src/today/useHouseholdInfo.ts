import { useEffect, useState } from "react";

import { getAuthHeaders } from "@packages/core-module";
import type { Household } from "@packages/core-plants/household";
import { householdSchema } from "@packages/core-plants/household";

/**
 * Fetches the current user's household info (if any) for the today view.
 * Read-only -- no mutations needed.
 */
export function useHouseholdInfo() {
    const [household, setHousehold] = useState<Household | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchHousehold() {
            try {
                const response = await fetch("/api/today/household", {
                    headers: getAuthHeaders()
                });

                if (!response.ok) {
                    setHousehold(null);

                    return;
                }

                const data: unknown = await response.json();

                if (data) {
                    setHousehold(householdSchema.parse(data));
                } else {
                    setHousehold(null);
                }
            } catch {
                setHousehold(null);
            } finally {
                setIsLoading(false);
            }
        }

        fetchHousehold();
    }, []);

    return { household, isLoading };
}
