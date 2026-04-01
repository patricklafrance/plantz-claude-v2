import { delay, http, HttpResponse } from "msw";

import type { Household } from "@packages/core-plants/household";

type HouseholdData = Household[] | "loading" | "error";

export function createManagementHouseholdHandlers(data: HouseholdData) {
    return [
        http.get("/api/management/household", async () => {
            if (data === "loading") {
                await delay("infinite");

                return HttpResponse.json([]);
            }

            if (data === "error") {
                return new HttpResponse(null, { status: 500 });
            }

            return HttpResponse.json(data);
        }),
        http.post("/api/management/household", async () => {
            if (typeof data === "string") {
                return new HttpResponse(null, { status: 500 });
            }

            return HttpResponse.json(
                {
                    id: "new-household-1",
                    name: "New Household",
                    createdBy: "user-alice",
                    createdAt: new Date().toISOString(),
                    members: [
                        {
                            userId: "user-alice",
                            userName: "Alice",
                            email: "user-alice@example.com",
                            role: "owner",
                            joinedAt: new Date().toISOString(),
                            status: "active"
                        }
                    ]
                },
                { status: 201 }
            );
        })
    ];
}
