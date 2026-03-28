import { http, HttpResponse } from "msw";

import { getUserId, membersDb, usersDb } from "@packages/core-module/db";

function isSameDay(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
import { assignmentsDb, careEventsDb, plantsDb } from "@packages/core-plants/db";

export const todayPlantHandlers = [
    http.get("/api/today/plants", ({ request }) => {
        const userId = getUserId(request);

        if (!userId) {
            return new HttpResponse(null, { status: 401 });
        }

        // Get the user's own plants
        const ownPlants = plantsDb.getAllByUser(userId);

        // Get household plants for all households the user belongs to
        const memberships = membersDb.getByUser(userId);
        const householdPlantIds = new Set(ownPlants.map(p => p.id));
        const householdPlants: typeof ownPlants = [];

        if (memberships.length > 0) {
            const membershipHouseholdIds = new Set(memberships.map(m => m.householdId));
            for (const plant of plantsDb.getAll()) {
                if (plant.householdId && membershipHouseholdIds.has(plant.householdId) && !householdPlantIds.has(plant.id)) {
                    householdPlants.push(plant);
                    householdPlantIds.add(plant.id);
                }
            }
        }

        const plants = [...ownPlants, ...householdPlants];

        return HttpResponse.json(plants);
    }),

    http.get("/api/today/assignments", ({ request }) => {
        const userId = getUserId(request);

        if (!userId) {
            return new HttpResponse(null, { status: 401 });
        }

        const memberships = membersDb.getByUser(userId);
        const allAssignments = memberships.flatMap(m => assignmentsDb.getAllByHousehold(m.householdId));

        return HttpResponse.json(allAssignments);
    }),

    http.get("/api/today/watered-today", ({ request }) => {
        const userId = getUserId(request);

        if (!userId) {
            return new HttpResponse(null, { status: 401 });
        }

        // Find all plants visible to this user and check if any were watered today
        const ownPlants = plantsDb.getAllByUser(userId);
        const memberships = membersDb.getByUser(userId);
        const allVisiblePlantIds = new Set(ownPlants.map(p => p.id));

        if (memberships.length > 0) {
            const membershipHouseholdIds = new Set(memberships.map(m => m.householdId));
            for (const plant of plantsDb.getAll()) {
                if (plant.householdId && membershipHouseholdIds.has(plant.householdId)) {
                    allVisiblePlantIds.add(plant.id);
                }
            }
        }

        const today = new Date();
        const wateredToday: { plantId: string; actorId: string }[] = [];

        for (const plantId of allVisiblePlantIds) {
            const events = careEventsDb.getAllByPlant(plantId);
            const wateredEvent = events.find(e => e.eventType === "watered" && !!e.actorId && isSameDay(new Date(e.eventDate), today));

            if (wateredEvent?.actorId) {
                wateredToday.push({ plantId, actorId: wateredEvent.actorId });
            }
        }

        return HttpResponse.json(wateredToday);
    }),

    http.get("/api/today/household-members", ({ request }) => {
        const userId = getUserId(request);

        if (!userId) {
            return new HttpResponse(null, { status: 401 });
        }

        // Return all members (with user names) for all households the current user belongs to
        const ownMemberships = membersDb.getByUser(userId);
        const allMembers: { userId: string; name: string }[] = [];
        const seen = new Set<string>();

        for (const m of ownMemberships) {
            const householdMembers = membersDb.getByHousehold(m.householdId);
            for (const member of householdMembers) {
                if (!seen.has(member.userId)) {
                    seen.add(member.userId);
                    const user = usersDb.getById(member.userId);
                    if (user) {
                        allMembers.push({ userId: user.id, name: user.name });
                    }
                }
            }
        }

        return HttpResponse.json(allMembers);
    }),

    http.delete("/api/today/plants/:id", ({ params }) => {
        const { id } = params;
        const deleted = plantsDb.delete(id as string);

        if (!deleted) {
            return new HttpResponse(null, { status: 404 });
        }

        return new HttpResponse(null, { status: 204 });
    }),

    http.delete("/api/today/plants", async ({ request }) => {
        const body = (await request.json()) as { ids: string[] };
        plantsDb.deleteMany(body.ids);

        return new HttpResponse(null, { status: 204 });
    })
];
