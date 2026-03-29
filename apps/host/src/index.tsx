import "./styles/globals.css";
import { FireflyProvider, initializeFirefly } from "@squide/firefly";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRoot } from "react-dom/client";

import {
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
