import { defaultSeedPlants } from "@packages/core-plants/db";

import type { ResponsibilityAssignment } from "../responsibilityTypes.ts";

// Get shared plants (those with a householdId) to create assignment seed data.
const sharedPlants = defaultSeedPlants.filter(p => p.householdId);

export const defaultSeedAssignments: ResponsibilityAssignment[] = [
    // Fixed assignment to Alice
    ...(sharedPlants[0]
        ? [
              {
                  id: "assign-seed-1",
                  plantId: sharedPlants[0].id,
                  strategy: "fixed" as const,
                  assignedUserId: "user-alice",
                  assignedUserName: "Alice"
              }
          ]
        : []),
    // Fixed assignment to Bob
    ...(sharedPlants[1]
        ? [
              {
                  id: "assign-seed-2",
                  plantId: sharedPlants[1].id,
                  strategy: "fixed" as const,
                  assignedUserId: "user-bob",
                  assignedUserName: "Bob"
              }
          ]
        : []),
    // Rotating strategy
    ...(sharedPlants[2]
        ? [
              {
                  id: "assign-seed-3",
                  plantId: sharedPlants[2].id,
                  strategy: "rotating" as const,
                  lastRotatedAt: new Date(2024, 9, 1)
              }
          ]
        : []),
    // Unassigned strategy
    ...(sharedPlants[3]
        ? [
              {
                  id: "assign-seed-4",
                  plantId: sharedPlants[3].id,
                  strategy: "unassigned" as const
              }
          ]
        : [])
];
