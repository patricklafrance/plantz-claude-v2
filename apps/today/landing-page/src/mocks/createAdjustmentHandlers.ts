import { delay, http, HttpResponse } from "msw";

import type { AdjustmentEvent, AdjustmentRecommendation } from "@packages/core-plants/care-event";

type AdjustmentHandlersData =
    | {
          recommendation?: AdjustmentRecommendation | null;
          history?: AdjustmentEvent[];
      }
    | "loading"
    | "error";

export function createAdjustmentHandlers(data: AdjustmentHandlersData) {
    return [
        http.get("/api/today/adjustments/recommendation", async () => {
            if (data === "loading") {
                await delay("infinite");

                return HttpResponse.json(null);
            }

            if (data === "error") {
                return new HttpResponse(null, { status: 500 });
            }

            return HttpResponse.json(data.recommendation ?? null);
        }),
        http.post("/api/today/adjustments", async ({ request }) => {
            if (data === "loading") {
                await delay("infinite");

                return HttpResponse.json({}, { status: 201 });
            }

            if (data === "error") {
                return new HttpResponse(null, { status: 500 });
            }

            const body = (await request.json()) as {
                plantId: string;
                previousInterval: number;
                newInterval: number;
                note?: string;
            };

            return HttpResponse.json(
                {
                    id: "new-adjustment-1",
                    plantId: body.plantId,
                    previousInterval: body.previousInterval,
                    newInterval: body.newInterval,
                    adjustmentDate: new Date().toISOString(),
                    note: body.note,
                },
                { status: 201 },
            );
        }),
        http.post("/api/today/adjustments/dismiss", async () => {
            if (data === "loading") {
                await delay("infinite");

                return new HttpResponse(null, { status: 204 });
            }

            if (data === "error") {
                return new HttpResponse(null, { status: 500 });
            }

            return new HttpResponse(null, { status: 204 });
        }),
        http.get("/api/today/adjustments", async () => {
            if (data === "loading") {
                await delay("infinite");

                return HttpResponse.json([]);
            }

            if (data === "error") {
                return new HttpResponse(null, { status: 500 });
            }

            return HttpResponse.json(data.history ?? []);
        }),
    ];
}
