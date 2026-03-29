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

interface CreateHandlersOptions {
    households: HouseholdData;
    members?: StoryMember[];
    postDelay?: "infinite";
}

export function createManagementHouseholdHandlers(options: CreateHandlersOptions) {
    const { households, members = [], postDelay } = options;

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
        })
    ];
}
