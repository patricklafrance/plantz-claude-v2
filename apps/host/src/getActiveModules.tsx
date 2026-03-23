import type { ModuleRegisterFunction, FireflyRuntime } from "@squide/firefly";
import type { QueryClient } from "@tanstack/react-query";

import { registerManagementPlants } from "@modules/management-plants";
import { registerManagementUser } from "@modules/management-user";
import { registerTodayLandingPage } from "@modules/today-landing-page";
import { registerTodayVacationPlanner } from "@modules/today-vacation-planner";

interface ModuleEntry {
    register: (runtime: FireflyRuntime, queryClient: QueryClient) => Promise<void>;
}

const ModuleRegistry: Record<string, ModuleEntry> = {
    "management/plants": { register: registerManagementPlants },
    "management/user": { register: registerManagementUser },
    "today/landing-page": { register: registerTodayLandingPage },
    "today/vacation-planner": { register: registerTodayVacationPlanner },
};

export function getActiveModules(filter: string | undefined, queryClient: QueryClient): ModuleRegisterFunction<FireflyRuntime>[] {
    const keys = filter
        ? filter
              .split(",")
              .map((m) => m.trim())
              .filter((m) => {
                  if (!ModuleRegistry[m]) {
                      // oxlint-disable-next-line eslint/no-console -- Runtime warning for misconfigured MODULES env var
                      console.warn(`[host] Unknown module "${m}". Available: ${Object.keys(ModuleRegistry).join(", ")}`);
                      return false;
                  }
                  return true;
              })
        : Object.keys(ModuleRegistry);

    return keys.map((key) => {
        const entry = ModuleRegistry[key];

        return ((runtime: FireflyRuntime) => entry.register(runtime, queryClient)) as ModuleRegisterFunction<FireflyRuntime>;
    });
}
