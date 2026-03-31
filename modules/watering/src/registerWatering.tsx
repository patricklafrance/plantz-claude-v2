import type { FireflyRuntime } from "@squide/firefly";
import type { QueryClient } from "@tanstack/react-query";

import { registerTodayLandingPage } from "../today/src/registerTodayLandingPage.tsx";
import { registerTodayVacationPlanner } from "../vacation-planner/src/registerTodayVacationPlanner.tsx";

export async function registerWatering(runtime: FireflyRuntime, queryClient: QueryClient) {
    await registerTodayLandingPage(runtime, queryClient);
    await registerTodayVacationPlanner(runtime, queryClient);
}
