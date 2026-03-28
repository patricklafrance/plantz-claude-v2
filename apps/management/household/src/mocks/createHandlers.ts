import { delay, http, HttpResponse } from "msw";

import type { Household } from "@packages/core-module";

type HouseholdsData = Household[] | "loading" | "error";

export function createManagementHouseholdHandlers(data: HouseholdsData) {
    // Keep a mutable copy so POST/PUT/DELETE mutations are visible to the
    // subsequent GET refetch that `collection.utils.refetch()` triggers.
    const store: Household[] = typeof data === "string" ? [] : [...data];

    return [
        http.get("/api/management/households", async () => {
            if (data === "loading") {
                await delay("infinite");

                return HttpResponse.json([]);
            }

            if (data === "error") {
                return new HttpResponse(null, { status: 500 });
            }

            return HttpResponse.json(store);
        }),
        http.get("/api/management/households/:id", ({ params }) => {
            if (typeof data === "string") {
                return new HttpResponse(null, { status: 404 });
            }

            const household = store.find(h => h.id === params["id"]);

            return household ? HttpResponse.json(household) : new HttpResponse(null, { status: 404 });
        }),
        http.post("/api/management/households", async ({ request }) => {
            const body = (await request.json()) as { name: string };
            const created: Household = {
                id: crypto.randomUUID(),
                name: body.name,
                ownerId: "user-alice",
                createdAt: new Date()
            };

            store.push(created);

            return HttpResponse.json(created, { status: 201 });
        }),
        http.put("/api/management/households/:id", async ({ params, request }) => {
            const body = (await request.json()) as { name: string };
            const idx = store.findIndex(h => h.id === params["id"]);

            if (idx !== -1) {
                store[idx] = { ...store[idx], name: body.name } as Household;
            }

            return HttpResponse.json(idx !== -1 ? store[idx] : {}, { status: 200 });
        }),
        http.delete("/api/management/households/:id", ({ params }) => {
            const idx = store.findIndex(h => h.id === params["id"]);

            if (idx !== -1) {
                store.splice(idx, 1);
            }

            return new HttpResponse(null, { status: 204 });
        })
    ];
}
