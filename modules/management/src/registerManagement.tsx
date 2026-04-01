import type { FireflyRuntime } from "@squide/firefly";
import type { QueryClient } from "@tanstack/react-query";

import { registerManagementUser } from "./account/registerManagementUser.tsx";
import { registerManagementHousehold } from "./household/registerManagementHousehold.tsx";
import { registerManagementPlants } from "./inventory/registerManagementPlants.tsx";

export async function registerManagement(runtime: FireflyRuntime, queryClient: QueryClient) {
    await registerManagementPlants(runtime, queryClient);
    await registerManagementHousehold(runtime, queryClient);
    await registerManagementUser(runtime);
}
