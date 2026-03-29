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

interface CreateHandlersOptions {
    households: HouseholdData;
    members?: StoryMember[];
    pendingInvitations?: StoryInvitation[];
    myInvitations?: StoryMyInvitation[];
    postDelay?: "infinite";
    inviteResult?: "success" | "user-not-found" | "loading";
    acceptDeclineDelay?: "infinite";
}

export function createManagementHouseholdHandlers(options: CreateHandlersOptions) {
    const {
        households,
        members = [],
        pendingInvitations = [],
        myInvitations = [],
        postDelay,
        inviteResult = "success",
        acceptDeclineDelay
    } = options;

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
        })
    ];
}
