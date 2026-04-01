import { delay, http, HttpResponse } from "msw";

import type { ResponsibilityAssignment } from "../responsibilityTypes.ts";

type AssignmentHandlersData =
    | {
          assignments?: ResponsibilityAssignment[];
      }
    | "loading"
    | "error";

export function createAssignmentHandlers(data: AssignmentHandlersData) {
    return [
        http.get("/api/today/assignments", async () => {
            if (data === "loading") {
                await delay("infinite");

                return HttpResponse.json([]);
            }

            if (data === "error") {
                return new HttpResponse(null, { status: 500 });
            }

            return HttpResponse.json(data.assignments ?? []);
        }),

        http.post("/api/today/assignments", async ({ request }) => {
            if (data === "loading") {
                await delay("infinite");

                return HttpResponse.json({}, { status: 201 });
            }

            if (data === "error") {
                return new HttpResponse(null, { status: 500 });
            }

            const body = (await request.json()) as {
                plantId: string;
                strategy: string;
                assignedUserId?: string;
            };

            return HttpResponse.json(
                {
                    id: "new-assignment-1",
                    plantId: body.plantId,
                    strategy: body.strategy,
                    assignedUserId: body.assignedUserId,
                    assignedUserName: body.assignedUserId ? "Alice" : undefined
                },
                { status: 201 }
            );
        }),

        http.put("/api/today/assignments/:id", async ({ request }) => {
            if (data === "loading") {
                await delay("infinite");

                return HttpResponse.json({});
            }

            if (data === "error") {
                return new HttpResponse(null, { status: 500 });
            }

            const body = (await request.json()) as {
                strategy: string;
                assignedUserId?: string;
            };

            return HttpResponse.json({
                id: "updated-assignment",
                strategy: body.strategy,
                assignedUserId: body.assignedUserId,
                assignedUserName: body.assignedUserId ? "Alice" : undefined
            });
        }),

        http.delete("/api/today/assignments/:id", async () => {
            if (data === "loading") {
                await delay("infinite");

                return new HttpResponse(null, { status: 204 });
            }

            if (data === "error") {
                return new HttpResponse(null, { status: 500 });
            }

            return new HttpResponse(null, { status: 204 });
        })
    ];
}
