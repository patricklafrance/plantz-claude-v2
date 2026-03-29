import { useEffect, useState } from "react";

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

export function useHouseholdContext(): { data: HouseholdContext; isLoading: boolean } {
    const [data, setData] = useState<HouseholdContext>(EMPTY_CONTEXT);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        async function fetchContext() {
            try {
                const response = await fetch("/api/today/household-context", {
                    headers: getAuthHeaders()
                });

                if (!response.ok) {
                    if (!cancelled) {
                        setData(EMPTY_CONTEXT);
                    }

                    return;
                }

                const json = await response.json();

                if (!cancelled) {
                    setData({
                        isMember: json.isMember ?? false,
                        householdId: json.householdId,
                        currentUserId: json.currentUserId,
                        responsibilities: json.responsibilities ?? [],
                        lastCareEvents: json.lastCareEvents ?? {},
                        memberNames: json.memberNames ?? {}
                    });
                }
            } catch {
                if (!cancelled) {
                    setData(EMPTY_CONTEXT);
                }
            } finally {
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        }

        fetchContext();

        return () => {
            cancelled = true;
        };
    }, []);

    return { data, isLoading };
}
