import { format } from "date-fns";
import { useEffect, useState } from "react";
import { Link } from "react-router";

import { getAuthHeaders } from "@packages/core-module";
import type { VacationPlan } from "@packages/core-plants/vacation";

export function VacationPlanBanner() {
    const [plan, setPlan] = useState<VacationPlan | null>(null);

    useEffect(() => {
        async function fetchActivePlan() {
            try {
                const response = await fetch("/api/today/vacation-planner/plans/active", {
                    headers: getAuthHeaders(),
                });
                if (response.ok) {
                    const data = await response.json();
                    if (data) {
                        setPlan({
                            ...data,
                            startDate: new Date(data.startDate),
                            endDate: new Date(data.endDate),
                        });
                    }
                }
            } catch {
                // Fetch failed — don't show banner
            }
        }
        fetchActivePlan();
    }, []);

    if (!plan) {
        return null;
    }

    const startFormatted = format(plan.startDate, "MMM d");
    const endFormatted = format(plan.endDate, "MMM d, yyyy");

    return (
        <div className="bg-muted/50 border-border rounded-lg border p-3">
            <div className="flex items-center justify-between gap-2">
                <p className="text-sm">
                    Vacation plan active for {startFormatted} – {endFormatted}
                </p>
                <Link to="/today/vacation-planner" className="text-primary text-sm font-medium whitespace-nowrap hover:underline">
                    View plan
                </Link>
            </div>
        </div>
    );
}
