import { http, HttpResponse } from "msw";

import { getUserId } from "@packages/core-module/db";
import { householdDb } from "@packages/core-plants/db";
import { resolveMemberName } from "@packages/core-plants/household";

import type { ResponsibilityStrategy } from "../responsibilityTypes.ts";
import { assignmentsDb } from "./assignmentsDb.ts";

export const todayAssignmentHandlers = [
    http.get("/api/today/assignments", ({ request }) => {
        const userId = getUserId(request);

        if (!userId) {
            return new HttpResponse(null, { status: 401 });
        }

        const assignments = assignmentsDb.getAll();

        return HttpResponse.json(assignments);
    }),

    http.post("/api/today/assignments", async ({ request }) => {
        const userId = getUserId(request);

        if (!userId) {
            return new HttpResponse(null, { status: 401 });
        }

        const body = (await request.json()) as {
            plantId: string;
            strategy: ResponsibilityStrategy;
            assignedUserId?: string;
        };

        const assignedUserName = body.assignedUserId
            ? resolveMemberName(householdDb.getByMemberId(userId)?.members ?? [], body.assignedUserId)
            : undefined;

        const assignment = {
            id: crypto.randomUUID(),
            plantId: body.plantId,
            strategy: body.strategy,
            assignedUserId: body.assignedUserId,
            assignedUserName,
            lastRotatedAt: body.strategy === "rotating" ? new Date() : undefined
        };

        assignmentsDb.create(assignment);

        return HttpResponse.json(assignment, { status: 201 });
    }),

    http.put("/api/today/assignments/:id", async ({ params, request }) => {
        const userId = getUserId(request);

        if (!userId) {
            return new HttpResponse(null, { status: 401 });
        }

        const { id } = params;
        const body = (await request.json()) as {
            strategy: ResponsibilityStrategy;
            assignedUserId?: string;
        };

        const assignedUserName = body.assignedUserId
            ? resolveMemberName(householdDb.getByMemberId(userId)?.members ?? [], body.assignedUserId)
            : undefined;

        const updated = assignmentsDb.update(id as string, {
            strategy: body.strategy,
            assignedUserId: body.assignedUserId,
            assignedUserName,
            lastRotatedAt: body.strategy === "rotating" ? new Date() : undefined
        });

        if (!updated) {
            return new HttpResponse(null, { status: 404 });
        }

        return HttpResponse.json(updated);
    }),

    http.delete("/api/today/assignments/:id", ({ params, request }) => {
        const userId = getUserId(request);

        if (!userId) {
            return new HttpResponse(null, { status: 401 });
        }

        const { id } = params;
        const deleted = assignmentsDb.delete(id as string);

        if (!deleted) {
            return new HttpResponse(null, { status: 404 });
        }

        return new HttpResponse(null, { status: 204 });
    })
];
