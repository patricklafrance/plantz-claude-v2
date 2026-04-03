import { http, HttpResponse } from "msw";

import { getUserId } from "../../db/auth/getUserId.ts";
import { usersDb } from "../../db/auth/usersDb.ts";
import { generateId } from "../../db/generateId.ts";
import { householdDb } from "../../db/household/householdDb.ts";
import type { HouseholdMember } from "../../entities/household/types.ts";

export const householdHandlers = [
    http.get("/api/household", () => {
        const userId = getUserId();

        if (!userId) {
            return new HttpResponse(null, { status: 401 });
        }

        const household = householdDb.getHouseholdByUser(userId);

        if (!household) {
            return HttpResponse.json(null);
        }

        return HttpResponse.json(household);
    }),

    http.post("/api/household", async ({ request }) => {
        const userId = getUserId();

        if (!userId) {
            return new HttpResponse(null, { status: 401 });
        }

        const body = (await request.json()) as { name: string };
        const now = new Date();

        const household = householdDb.insertHousehold({
            id: generateId(),
            name: body.name,
            createdBy: userId,
            creationDate: now
        });

        const user = usersDb.getById(userId);
        const memberId = generateId();

        householdDb.insertMember({
            id: memberId,
            householdId: household.id,
            userId,
            userName: user?.name ?? "Unknown",
            role: "owner",
            joinDate: now
        });

        return HttpResponse.json(household, { status: 201 });
    }),

    http.get("/api/household/members", () => {
        const userId = getUserId();

        if (!userId) {
            return new HttpResponse(null, { status: 401 });
        }

        const household = householdDb.getHouseholdByUser(userId);

        if (!household) {
            return HttpResponse.json([]);
        }

        const members = householdDb.getMembers(household.id);

        return HttpResponse.json(members);
    }),

    http.post("/api/household/invite", async ({ request }) => {
        const userId = getUserId();

        if (!userId) {
            return new HttpResponse(null, { status: 401 });
        }

        const household = householdDb.getHouseholdByUser(userId);

        if (!household) {
            return new HttpResponse(null, { status: 404 });
        }

        const body = (await request.json()) as { email: string };
        const invitedUser = usersDb.getByEmail(body.email);

        if (!invitedUser) {
            return HttpResponse.json({ error: "User not found" }, { status: 404 });
        }

        const existingMember = householdDb.getMemberByUserId(household.id, invitedUser.id);

        if (existingMember) {
            return HttpResponse.json({ error: "User is already a member" }, { status: 409 });
        }

        const memberId = generateId();

        const member: HouseholdMember = {
            id: memberId,
            householdId: household.id,
            userId: invitedUser.id,
            userName: invitedUser.name,
            role: "member",
            joinDate: new Date()
        };

        householdDb.insertMember(member);

        return HttpResponse.json(member, { status: 201 });
    })
];
