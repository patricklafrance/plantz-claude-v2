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
        }),
        http.post("/api/management/household/:id/members", async () => {
            if (typeof data === "string") {
                return new HttpResponse(null, { status: 500 });
            }

            const household = data[0];
            const newMember = {
                userId: "user-carol",
                userName: "Carol",
                email: "carol@example.com",
                role: "member" as const,
                joinedAt: new Date().toISOString(),
                status: "invited" as const
            };

            return HttpResponse.json(
                {
                    ...household,
                    members: [...(household?.members ?? []), newMember]
                },
                { status: 201 }
            );
        }),
        http.put("/api/management/household/:id/members/:userId", async () => {
            if (typeof data === "string") {
                return new HttpResponse(null, { status: 500 });
            }

            const household = data[0];

            return HttpResponse.json({
                ...household,
                members: household?.members.map(m => (m.status === "invited" ? { ...m, status: "active" } : m)) ?? []
            });
        }),
        http.delete("/api/management/household/:id/members/:userId", () => {
            if (typeof data === "string") {
                return new HttpResponse(null, { status: 500 });
            }

            const household = data[0];

            // Return the household with the last non-owner member removed
            return HttpResponse.json({
                ...household,
                members: household?.members.filter(m => m.role === "owner") ?? []
            });
        })
    ];
}
