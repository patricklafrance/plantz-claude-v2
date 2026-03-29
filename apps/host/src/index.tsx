import "./styles/globals.css";
import { FireflyProvider, initializeFirefly } from "@squide/firefly";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRoot } from "react-dom/client";

import {
    assignmentsDb,
    defaultSeedHouseholds,
    defaultSeedInvitations,
    defaultSeedMembers,
    householdsDb,
    invitationsDb,
    membersDb
} from "@packages/core-household/db";
import { App, registerShell } from "@packages/core-module/shell";
import { defaultSeedPlants, plantsDb } from "@packages/core-plants/db";

import { getActiveModules } from "./getActiveModules.tsx";

const queryClient = new QueryClient();

plantsDb.reset(defaultSeedPlants);
householdsDb.reset(defaultSeedHouseholds);
membersDb.reset(defaultSeedMembers);
invitationsDb.reset(defaultSeedInvitations);

// Pre-share a few of Alice's plants with her household for development
const aliceHousehold = defaultSeedHouseholds[0];
if (aliceHousehold) {
    const alicePlants = plantsDb.getAllByUser("user-alice");
    const sharedPlants = alicePlants.slice(0, 5);

    for (const plant of sharedPlants) {
        plantsDb.update(plant.id, { householdId: aliceHousehold.id });
    }

    // Seed responsibility assignments covering all three strategies
    const strategies = ["fixed", "rotating", "unassigned"] as const;
    const seedAssignments = sharedPlants.map((plant, i) => ({
        id: `assignment-${i + 1}`,
        plantId: plant.id,
        householdId: aliceHousehold.id,
        strategy: strategies[i % strategies.length]!,
        assignedUserId: strategies[i % strategies.length] === "fixed" ? "user-alice" : undefined,
        lastRotatedDate: strategies[i % strategies.length] === "rotating" ? new Date(2025, 0, 1) : undefined
    }));

    assignmentsDb.reset(seedAssignments);
}

const runtime = initializeFirefly({
    useMsw: true,
    localModules: [registerShell, ...getActiveModules(process.env.MODULES, queryClient)],
    startMsw: async x => {
        return (await import("./mocks/browser.ts")).startMsw(x.requestHandlers);
    }
});

const root = createRoot(document.getElementById("root")!);

root.render(
    <FireflyProvider runtime={runtime}>
        <QueryClientProvider client={queryClient}>
            <App />
        </QueryClientProvider>
    </FireflyProvider>
);
