import { http, HttpResponse } from "msw";

import type { Household } from "@packages/core-household";
import { assignmentsDb, householdsDb, invitationsDb, membersDb } from "@packages/core-household/db";
import { getUserId, usersDb } from "@packages/core-module/db";
import { plantsDb } from "@packages/core-plants/db";

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
    }),

    // --- Shared plants & responsibility assignment handlers ---

    http.get("/api/management/household/:id/shared-plants", ({ params, request }) => {
        const userId = getUserId(request);

        if (!userId) {
            return new HttpResponse(null, { status: 401 });
        }

        const plants = plantsDb.getAllByHousehold(params.id as string);

        return HttpResponse.json(plants);
    }),

    http.get("/api/management/household/:id/assignments", ({ params, request }) => {
        const userId = getUserId(request);

        if (!userId) {
            return new HttpResponse(null, { status: 401 });
        }

        const assignments = assignmentsDb.getAllByHousehold(params.id as string);

        // Enrich with responsible user name
        const members = membersDb.getAllByHousehold(params.id as string);
        const enriched = assignments.map(assignment => {
            let responsibleUserName: string | undefined;

            if (assignment.strategy === "fixed" && assignment.assignedUserId) {
                const user = usersDb.getById(assignment.assignedUserId);
                responsibleUserName = user?.name;
            } else if (assignment.strategy === "rotating") {
                // Compute current rotation member
                const sorted = [...members].sort((a, b) => {
                    const dateDiff = a.joinedDate.getTime() - b.joinedDate.getTime();

                    return dateDiff !== 0 ? dateDiff : a.id.localeCompare(b.id);
                });

                if (sorted.length > 0 && assignment.lastRotatedDate) {
                    const daysSinceRotation = Math.floor((Date.now() - assignment.lastRotatedDate.getTime()) / (1000 * 60 * 60 * 24));
                    const index = daysSinceRotation % sorted.length;
                    const member = sorted[index];

                    if (member) {
                        const user = usersDb.getById(member.userId);
                        responsibleUserName = user?.name;
                    }
                } else if (sorted.length > 0) {
                    const user = usersDb.getById(sorted[0]!.userId);
                    responsibleUserName = user?.name;
                }
            }

            return {
                ...assignment,
                responsibleUserName
            };
        });

        return HttpResponse.json(enriched);
    }),

    http.post("/api/management/household/assignments", async ({ request }) => {
        const userId = getUserId(request);

        if (!userId) {
            return new HttpResponse(null, { status: 401 });
        }

        const body = (await request.json()) as { plantId: string; householdId: string; strategy: string; assignedUserId?: string };

        const id =
            typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
                ? crypto.randomUUID()
                : `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

        const assignment = assignmentsDb.insert({
            id,
            plantId: body.plantId,
            householdId: body.householdId,
            strategy: body.strategy as "fixed" | "rotating" | "unassigned",
            assignedUserId: body.assignedUserId,
            lastRotatedDate: body.strategy === "rotating" ? new Date() : undefined
        });

        return HttpResponse.json(assignment, { status: 201 });
    }),

    http.patch("/api/management/household/assignments/:plantId", async ({ params, request }) => {
        const userId = getUserId(request);

        if (!userId) {
            return new HttpResponse(null, { status: 401 });
        }

        const body = (await request.json()) as { strategy: string; assignedUserId?: string };
        const assignment = assignmentsDb.getByPlant(params.plantId as string);

        if (!assignment) {
            // Create a new assignment if one doesn't exist yet
            const membership = membersDb.getByUserId(userId);

            if (!membership) {
                return new HttpResponse(null, { status: 403 });
            }

            const id =
                typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
                    ? crypto.randomUUID()
                    : `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

            const newAssignment = assignmentsDb.insert({
                id,
                plantId: params.plantId as string,
                householdId: membership.householdId,
                strategy: body.strategy as "fixed" | "rotating" | "unassigned",
                assignedUserId: body.strategy === "fixed" ? body.assignedUserId : undefined,
                lastRotatedDate: body.strategy === "rotating" ? new Date() : undefined
            });

            return HttpResponse.json(newAssignment);
        }

        const updated = assignmentsDb.update(assignment.id, {
            strategy: body.strategy as "fixed" | "rotating" | "unassigned",
            assignedUserId: body.strategy === "fixed" ? body.assignedUserId : undefined,
            lastRotatedDate: body.strategy === "rotating" ? new Date() : assignment.lastRotatedDate
        });

        return HttpResponse.json(updated);
    })
];
