import { delay, http, HttpResponse } from "msw";

import type { ResponsibilityAssignment } from "../../entities/responsibility/types.ts";

type AssignmentData = ResponsibilityAssignment[] | "loading" | "error";

export function createTodayAssignmentHandlers(data: AssignmentData) {
    return [
        http.get("/api/today/assignments", async () => {
            if (data === "loading") {
                await delay("infinite");

                return HttpResponse.json([]);
            }

            if (data === "error") {
                return new HttpResponse(null, { status: 500 });
            }

            return HttpResponse.json(data);
        }),
        http.put("/api/today/assignments/:plantId", async ({ params, request }) => {
            if (data === "loading") {
                await delay("infinite");

                return HttpResponse.json({});
            }

            if (data === "error") {
                return new HttpResponse(null, { status: 500 });
            }

            const { plantId } = params;
            const body = (await request.json()) as Record<string, unknown>;

            const existing = (data as ResponsibilityAssignment[]).find(a => a.plantId === plantId);
            const updated: ResponsibilityAssignment = {
                id: existing?.id ?? `assignment-new-${plantId}`,
                plantId: plantId as string,
                householdId: existing?.householdId ?? "household-1",
                strategy: body.strategy as "fixed" | "rotating" | "unassigned",
                assignedMemberId: body.assignedMemberId as string | undefined,
                assignedMemberName: body.assignedMemberName as string | undefined
            };

            return HttpResponse.json(updated);
        })
    ];
}
