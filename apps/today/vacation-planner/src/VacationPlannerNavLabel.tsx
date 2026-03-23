import { useEffect, useState } from "react";

import { getAuthHeaders } from "@packages/core-module";

export function VacationPlannerNavLabel() {
    const [hasActivePlan, setHasActivePlan] = useState(false);

    useEffect(() => {
        async function fetchActivePlan() {
            try {
                const response = await fetch("/api/today/vacation-planner/plans/active", {
                    headers: getAuthHeaders(),
                });
                if (response.ok) {
                    const plan = await response.json();
                    setHasActivePlan(plan !== null);
                }
            } catch {
                // No active plan or fetch failed — don't show dot
            }
        }
        fetchActivePlan();
    }, []);

    useEffect(() => {
        function handlePlanChanged(event: Event) {
            const detail = (event as CustomEvent<{ active: boolean }>).detail;
            setHasActivePlan(detail.active);
        }

        window.addEventListener("vacation-plan-changed", handlePlanChanged);

        return () => {
            window.removeEventListener("vacation-plan-changed", handlePlanChanged);
        };
    }, []);

    return (
        <span className="inline-flex items-center gap-1.5">
            Vacation Planner
            {hasActivePlan && <span className="bg-primary h-1.5 w-1.5 rounded-full" />}
        </span>
    );
}
