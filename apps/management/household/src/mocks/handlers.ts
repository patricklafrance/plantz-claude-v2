import { http, HttpResponse } from "msw";

import type { Household } from "@packages/core-household";
import { householdsDb, invitationsDb, membersDb } from "@packages/core-household/db";
import { getUserId, usersDb } from "@packages/core-module/db";

export const managementHouseholdHandlers = [
    http.get("/api/management/household", ({ request }) => {
        const userId = getUserId(request);

        if (!userId) {
            return new HttpResponse(null, { status: 401 });
        }

        // Find the household the user belongs to via membership
        const membership = membersDb.getByUserId(userId);

        if (!membership) {
            return HttpResponse.json([]);
        }

        const household = householdsDb.get(membership.householdId);

        return HttpResponse.json(household ? [household] : []);
    }),

    http.get("/api/management/household/:id/members", ({ params, request }) => {
        const userId = getUserId(request);

        if (!userId) {
            return new HttpResponse(null, { status: 401 });
        }

        const { id } = params;
        const members = membersDb.getAllByHousehold(id as string);

        // Enrich members with user names (BFF pattern)
        const enriched = members.map(member => {
            const user = usersDb.getById(member.userId);

            return {
                ...member,
                userName: user?.name ?? "Unknown"
            };
        });

        return HttpResponse.json(enriched);
    }),

    http.post("/api/management/household", async ({ request }) => {
        const userId = getUserId(request);

        if (!userId) {
            return new HttpResponse(null, { status: 401 });
        }

        const body = (await request.json()) as Record<string, unknown>;
        const now = new Date();

        const id =
            typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
                ? crypto.randomUUID()
                : `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

        const household = householdsDb.insert({
            ...(body as Record<string, unknown>),
            id,
            createdBy: userId,
            creationDate: now
        } as Household);

        // Auto-add the creator as a member
        const memberId =
            typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
                ? crypto.randomUUID()
                : `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

        membersDb.insert({
            id: memberId,
            householdId: id,
            userId,
            joinedDate: now
        });

        return HttpResponse.json(household, { status: 201 });
    }),

    // --- Invitation handlers ---

    http.post("/api/management/household/invitations", async ({ request }) => {
        const userId = getUserId(request);

        if (!userId) {
            return new HttpResponse(null, { status: 401 });
        }

        const body = (await request.json()) as { householdId: string; inviteeEmail: string };

        // Validate invitee exists
        const invitee = usersDb.getByEmail(body.inviteeEmail);

        if (!invitee) {
            return HttpResponse.json({ error: "User not found" }, { status: 422 });
        }

        const id =
            typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
                ? crypto.randomUUID()
                : `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

        const invitation = invitationsDb.insert({
            id,
            householdId: body.householdId,
            invitedBy: userId,
            inviteeEmail: body.inviteeEmail,
            status: "pending",
            creationDate: new Date()
        });

        return HttpResponse.json(invitation, { status: 201 });
    }),

    http.get("/api/management/household/:id/invitations", ({ params, request }) => {
        const userId = getUserId(request);

        if (!userId) {
            return new HttpResponse(null, { status: 401 });
        }

        const invitations = invitationsDb.getAllByHousehold(params.id as string).filter(i => i.status === "pending");

        return HttpResponse.json(invitations);
    }),

    http.get("/api/management/household/invitations/mine", ({ request }) => {
        const userId = getUserId(request);

        if (!userId) {
            return new HttpResponse(null, { status: 401 });
        }

        const user = usersDb.getById(userId);

        if (!user) {
            return HttpResponse.json([]);
        }

        const invitations = invitationsDb.getAllByInvitee(user.email).filter(i => i.status === "pending");

        // Enrich with household name and inviter name
        const enriched = invitations.map(inv => {
            const household = householdsDb.get(inv.householdId);
            const inviter = usersDb.getById(inv.invitedBy);

            return {
                ...inv,
                householdName: household?.name ?? "Unknown",
                inviterName: inviter?.name ?? "Unknown"
            };
        });

        return HttpResponse.json(enriched);
    }),

    http.patch("/api/management/household/invitations/:id/accept", ({ params, request }) => {
        const userId = getUserId(request);

        if (!userId) {
            return new HttpResponse(null, { status: 401 });
        }

        const invitation = invitationsDb.update(params.id as string, { status: "accepted" });

        if (!invitation) {
            return new HttpResponse(null, { status: 404 });
        }

        // Add the user as a member of the household
        const memberId =
            typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
                ? crypto.randomUUID()
                : `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

        membersDb.insert({
            id: memberId,
            householdId: invitation.householdId,
            userId,
            joinedDate: new Date()
        });

        return HttpResponse.json(invitation);
    }),

    http.patch("/api/management/household/invitations/:id/decline", ({ params, request }) => {
        const userId = getUserId(request);

        if (!userId) {
            return new HttpResponse(null, { status: 401 });
        }

        const invitation = invitationsDb.update(params.id as string, { status: "declined" });

        if (!invitation) {
            return new HttpResponse(null, { status: 404 });
        }

        return HttpResponse.json(invitation);
    })
];
