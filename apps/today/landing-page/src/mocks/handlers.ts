import { http, HttpResponse } from "msw";

import { resolveResponsibleUser } from "@packages/core-household";
import { assignmentsDb, membersDb } from "@packages/core-household/db";
import { getUserId, usersDb } from "@packages/core-module/db";
import { careEventsDb, plantsDb } from "@packages/core-plants/db";

export const todayPlantHandlers = [
    http.get("/api/today/plants", ({ request }) => {
        const userId = getUserId(request);

        if (!userId) {
            return new HttpResponse(null, { status: 401 });
        }

        // Get user's personal plants
        const personalPlants = plantsDb.getAllByUser(userId);

        // Check if user belongs to a household, and if so, also include household plants
        const membership = membersDb.getByUserId(userId);

        if (!membership) {
            // No household — return personal plants only (single-user experience)
            return HttpResponse.json(personalPlants);
        }

        const householdPlants = plantsDb.getAllByHousehold(membership.householdId);

        // Union personal + household, deduplicate by id (a plant shared to the household
        // might also be owned by the current user)
        const seen = new Set<string>();
        const merged = [];

        for (const plant of personalPlants) {
            seen.add(plant.id);
            merged.push(plant);
        }

        for (const plant of householdPlants) {
            if (!seen.has(plant.id)) {
                seen.add(plant.id);
                merged.push(plant);
            }
        }

        return HttpResponse.json(merged);
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
    }),

    // Household context for today view: membership, members, assignments, and last care events
    http.get("/api/today/household-context", ({ request }) => {
        const userId = getUserId(request);

        if (!userId) {
            return new HttpResponse(null, { status: 401 });
        }

        const membership = membersDb.getByUserId(userId);

        if (!membership) {
            return HttpResponse.json({ isMember: false });
        }

        const householdId = membership.householdId;
        const members = membersDb.getAllByHousehold(householdId);
        const assignments = assignmentsDb.getAllByHousehold(householdId);

        // Resolve responsibility for each assignment
        const responsibilities = assignments.map(assignment => {
            const responsibleUserId = resolveResponsibleUser(assignment, members);
            const responsibleUser = responsibleUserId ? usersDb.getById(responsibleUserId) : undefined;

            return {
                plantId: assignment.plantId,
                strategy: assignment.strategy,
                responsibleUserId,
                responsibleUserName: responsibleUser?.name
            };
        });

        // Get last care event for each shared plant
        const householdPlants = plantsDb.getAllByHousehold(householdId);
        const lastCareEvents: Record<string, { actorName?: string; eventDate: string }> = {};

        for (const plant of householdPlants) {
            const events = careEventsDb.getAllByPlant(plant.id);

            if (events.length > 0) {
                const latest = events[0]!; // already sorted descending
                const actorName = latest.actorId ? usersDb.getById(latest.actorId)?.name : undefined;
                lastCareEvents[plant.id] = {
                    actorName,
                    eventDate: latest.eventDate.toISOString()
                };
            }
        }

        // Build a member name map for display
        const memberNames: Record<string, string> = {};

        for (const member of members) {
            const user = usersDb.getById(member.userId);

            if (user) {
                memberNames[member.userId] = user.name;
            }
        }

        return HttpResponse.json({
            isMember: true,
            householdId,
            currentUserId: userId,
            responsibilities,
            lastCareEvents,
            memberNames
        });
    })
];
