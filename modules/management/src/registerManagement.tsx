import type { FireflyRuntime } from "@squide/firefly";
import type { QueryClient } from "@tanstack/react-query";

import { registerManagementUser } from "../account/src/registerManagementUser.tsx";
import { registerManagementPlants } from "../inventory/src/registerManagementPlants.tsx";

export async function registerManagement(runtime: FireflyRuntime, queryClient: QueryClient) {
    await registerManagementPlants(runtime, queryClient);
    await registerManagementUser(runtime);
}
