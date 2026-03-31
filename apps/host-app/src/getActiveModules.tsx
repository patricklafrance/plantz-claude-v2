import type { ModuleRegisterFunction, FireflyRuntime } from "@squide/firefly";
import type { QueryClient } from "@tanstack/react-query";

import { registerManagement } from "@modules/management";
import { registerWatering } from "@modules/watering";

interface ModuleEntry {
    register: (runtime: FireflyRuntime, queryClient: QueryClient) => Promise<void>;
}

const ModuleRegistry: Record<string, ModuleEntry> = {
    management: { register: registerManagement },
    watering: { register: registerWatering }
};

export function getActiveModules(filter: string | undefined, queryClient: QueryClient): ModuleRegisterFunction<FireflyRuntime>[] {
    const keys = filter
        ? filter
              .split(",")
              .map(m => m.trim())
              .filter(m => {
                  if (!ModuleRegistry[m]) {
                      // oxlint-disable-next-line eslint/no-console -- Runtime warning for misconfigured MODULES env var
                      console.warn(`[host] Unknown module "${m}". Available: ${Object.keys(ModuleRegistry).join(", ")}`);
                      return false;
                  }
                  return true;
              })
        : Object.keys(ModuleRegistry);

    return keys.map(key => {
        const entry = ModuleRegistry[key];

        return ((runtime: FireflyRuntime) => entry.register(runtime, queryClient)) as ModuleRegisterFunction<FireflyRuntime>;
    });
}
