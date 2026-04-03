import { http, HttpResponse } from "msw";

import { getUserId } from "../../db/auth/getUserId.ts";
import { householdDb } from "../../db/household/householdDb.ts";
import { assignmentDb } from "../../db/responsibility/assignmentDb.ts";

export const todayAssignmentHandlers = [
    http.get("/api/today/assignments", () => {
        const userId = getUserId();

        if (!userId) {
            return new HttpResponse(null, { status: 401 });
        }

        const household = householdDb.getHouseholdByUser(userId);

        if (!household) {
            return HttpResponse.json([]);
        }

        const assignments = assignmentDb.getByHousehold(household.id);

        return HttpResponse.json(assignments);
    }),

    http.put("/api/today/assignments/:plantId", async ({ params, request }) => {
        const userId = getUserId();

        if (!userId) {
            return new HttpResponse(null, { status: 401 });
        }

        const { plantId } = params;
        const body = (await request.json()) as Record<string, unknown>;

        const household = householdDb.getHouseholdByUser(userId);

        if (!household) {
            return new HttpResponse(null, { status: 400 });
        }

        const assignment = assignmentDb.upsertByPlant(plantId as string, {
            householdId: household.id,
            strategy: body.strategy as "fixed" | "rotating" | "unassigned",
            assignedMemberId: body.assignedMemberId as string | undefined,
            assignedMemberName: body.assignedMemberName as string | undefined
        });

        return HttpResponse.json(assignment);
    })
];
