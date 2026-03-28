import { useEffect, useState } from "react";

import { getAuthHeaders } from "@packages/core-module";
import type { Household } from "@packages/core-module";

export function useHouseholds(): Household[] {
    const [households, setHouseholds] = useState<Household[]>([]);

    useEffect(() => {
        fetch("/api/management/plants/households", { headers: getAuthHeaders() })
            .then(r => (r.ok ? r.json() : []))
            .then((data: Household[]) => setHouseholds(data))
            .catch(() => setHouseholds([]));
    }, []);

    return households;
}
