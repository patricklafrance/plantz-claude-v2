import { delay, http, HttpResponse } from "msw";

import type { Household } from "@packages/core-household";

type HouseholdData = Household[] | "loading" | "error";

export interface StoryMember {
    id: string;
    householdId: string;
    userId: string;
    userName: string;
    joinedDate: Date;
}

export interface StoryInvitation {
    id: string;
    householdId: string;
    invitedBy: string;
    inviteeEmail: string;
    status: string;
    creationDate: Date;
}

export interface StoryMyInvitation {
    id: string;
    householdId: string;
    invitedBy: string;
    inviteeEmail: string;
    status: string;
    creationDate: Date;
    householdName: string;
    inviterName: string;
}

export interface StoryPlant {
    id: string;
    name: string;
    householdId: string;
}

export interface StoryAssignment {
    id: string;
    plantId: string;
    householdId: string;
    strategy: "fixed" | "rotating" | "unassigned";
    assignedUserId?: string;
    responsibleUserName?: string;
    lastRotatedDate?: Date;
}

interface CreateHandlersOptions {
    households: HouseholdData;
    members?: StoryMember[];
    pendingInvitations?: StoryInvitation[];
    myInvitations?: StoryMyInvitation[];
    sharedPlants?: StoryPlant[];
    assignments?: StoryAssignment[];
    postDelay?: "infinite";
    inviteResult?: "success" | "user-not-found" | "loading";
    acceptDeclineDelay?: "infinite";
    assignmentUpdateDelay?: "infinite";
}

export function createManagementHouseholdHandlers(options: CreateHandlersOptions) {
    const {
        households,
        members = [],
        pendingInvitations = [],
        myInvitations = [],
        sharedPlants = [],
        assignments = [],
        postDelay,
        inviteResult = "success",
        acceptDeclineDelay,
        assignmentUpdateDelay
    } = options;

    // Clone assignments so story mutations don't leak across stories
    const mutableAssignments = assignments.map(a => ({ ...a }));

    return [
        http.get("/api/management/household", async () => {
            if (households === "loading") {
                await delay("infinite");

                return HttpResponse.json([]);
            }

            if (households === "error") {
                return new HttpResponse(null, { status: 500 });
            }

            return HttpResponse.json(households);
        }),
        http.get("/api/management/household/:id/members", ({ params }) => {
            if (typeof households === "string") {
                return HttpResponse.json([]);
            }

            const householdMembers = members.filter(m => m.householdId === params.id);

            return HttpResponse.json(householdMembers);
        }),
        http.post("/api/management/household", async () => {
            if (households === "loading" || postDelay === "infinite") {
                await delay("infinite");

                return HttpResponse.json({}, { status: 201 });
            }

            return HttpResponse.json({}, { status: 201 });
        }),
        http.get("/api/management/household/:id/invitations", ({ params }) => {
            if (typeof households === "string") {
                return HttpResponse.json([]);
            }

            const householdInvitations = pendingInvitations.filter(i => i.householdId === params.id);

            return HttpResponse.json(householdInvitations);
        }),
        http.get("/api/management/household/invitations/mine", () => {
            return HttpResponse.json(myInvitations);
        }),
        http.post("/api/management/household/invitations", async () => {
            if (inviteResult === "loading") {
                await delay("infinite");

                return HttpResponse.json({}, { status: 201 });
            }

            if (inviteResult === "user-not-found") {
                return HttpResponse.json({ error: "User not found" }, { status: 422 });
            }

            return HttpResponse.json({ id: "inv-new", status: "pending" }, { status: 201 });
        }),
        http.patch("/api/management/household/invitations/:id/accept", async () => {
            if (acceptDeclineDelay === "infinite") {
                await delay("infinite");

                return HttpResponse.json({});
            }

            return HttpResponse.json({ status: "accepted" });
        }),
        http.patch("/api/management/household/invitations/:id/decline", async () => {
            if (acceptDeclineDelay === "infinite") {
                await delay("infinite");

                return HttpResponse.json({});
            }

            return HttpResponse.json({ status: "declined" });
        }),
        http.get("/api/management/household/:id/shared-plants", ({ params }) => {
            if (typeof households === "string") {
                return HttpResponse.json([]);
            }

            const householdPlants = sharedPlants.filter(p => p.householdId === params.id);

            return HttpResponse.json(householdPlants);
        }),
        http.get("/api/management/household/:id/assignments", ({ params }) => {
            if (typeof households === "string") {
                return HttpResponse.json([]);
            }

            const householdAssignments = mutableAssignments.filter(a => a.householdId === params.id);

            return HttpResponse.json(householdAssignments);
        }),
        http.patch("/api/management/household/assignments/:plantId", async ({ params, request }) => {
            if (assignmentUpdateDelay === "infinite") {
                await delay("infinite");

                return HttpResponse.json({});
            }

            const body = (await request.json()) as { strategy: string; assignedUserId?: string };
            const existing = mutableAssignments.find(a => a.plantId === params.plantId);

            if (existing) {
                existing.strategy = body.strategy as "fixed" | "rotating" | "unassigned";
                existing.assignedUserId = body.strategy === "fixed" ? body.assignedUserId : undefined;

                // Resolve responsibleUserName for the response
                if (body.strategy === "fixed" && body.assignedUserId) {
                    const member = members.find(m => m.userId === body.assignedUserId);
                    existing.responsibleUserName = member?.userName;
                } else if (body.strategy === "rotating" && members.length > 0) {
                    existing.responsibleUserName = members[0]?.userName;
                } else {
                    existing.responsibleUserName = undefined;
                }

                return HttpResponse.json(existing);
            }

            const newAssignment = {
                id: `assignment-new-${params.plantId}`,
                plantId: params.plantId as string,
                householdId: typeof households !== "string" && households[0] ? households[0].id : "h-1",
                strategy: body.strategy as "fixed" | "rotating" | "unassigned",
                assignedUserId: body.strategy === "fixed" ? body.assignedUserId : undefined,
                responsibleUserName: undefined as string | undefined
            };

            if (body.strategy === "fixed" && body.assignedUserId) {
                const member = members.find(m => m.userId === body.assignedUserId);
                newAssignment.responsibleUserName = member?.userName;
            }

            mutableAssignments.push(newAssignment);

            return HttpResponse.json(newAssignment);
        })
    ];
}
