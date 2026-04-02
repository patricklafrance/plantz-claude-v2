import { delay, http, HttpResponse } from "msw";

import type { Household, HouseholdMember } from "../../entities/household/types.ts";

export interface HouseholdData {
    household: Household | null;
    members: HouseholdMember[];
}

type HandlerData = HouseholdData | "loading" | "error";

export function createHouseholdHandlers(data: HandlerData) {
    return [
        http.get("/api/household", async () => {
            if (data === "loading") {
                await delay("infinite");

                return HttpResponse.json(null);
            }

            if (data === "error") {
                return new HttpResponse(null, { status: 500 });
            }

            return HttpResponse.json(data.household);
        }),
        http.get("/api/household/members", async () => {
            if (data === "loading") {
                await delay("infinite");

                return HttpResponse.json([]);
            }

            if (data === "error") {
                return new HttpResponse(null, { status: 500 });
            }

            return HttpResponse.json(data.members);
        }),
        http.post("/api/household", async ({ request }) => {
            if (data === "loading") {
                await delay("infinite");

                return HttpResponse.json({}, { status: 201 });
            }

            if (data === "error") {
                return new HttpResponse(null, { status: 500 });
            }

            const body = (await request.json()) as { name: string };
            const now = new Date();

            return HttpResponse.json(
                {
                    id: "new-household-id",
                    name: body.name,
                    createdBy: "user-alice",
                    creationDate: now
                } satisfies Household,
                { status: 201 }
            );
        }),
        http.post("/api/household/invite", async ({ request }) => {
            if (data === "loading") {
                await delay("infinite");

                return HttpResponse.json({}, { status: 201 });
            }

            if (data === "error") {
                return new HttpResponse(null, { status: 500 });
            }

            const body = (await request.json()) as { email: string };
            const now = new Date();

            return HttpResponse.json(
                {
                    id: "new-member-id",
                    householdId: data.household?.id ?? "household-1",
                    userId: "new-user-id",
                    userName: body.email.split("@")[0] ?? "New Member",
                    role: "member",
                    joinDate: now
                } satisfies HouseholdMember,
                { status: 201 }
            );
        })
    ];
}
