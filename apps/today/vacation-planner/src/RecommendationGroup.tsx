import { Badge } from "@packages/components";
import type { PlantRecommendation, RecommendationType } from "@packages/core-plants/vacation";

import { RecommendationCard } from "./RecommendationCard.tsx";
import { recommendationLabels } from "./recommendationLabels.ts";

interface RecommendationGroupProps {
    type: RecommendationType;
    recommendations: PlantRecommendation[];
    onDelegate?: (plantId: string) => void;
    onOverride?: (plantId: string) => void;
}

export function RecommendationGroup({ type, recommendations, onDelegate, onOverride }: RecommendationGroupProps) {
    if (recommendations.length === 0) {
        return null;
    }

    return (
        <section className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold">{recommendationLabels[type]}</h2>
                <Badge variant="secondary" aria-live="polite">
                    {recommendations.length}
                </Badge>
            </div>
            <div className="flex flex-col gap-2">
                {recommendations.map((rec) => (
                    <RecommendationCard key={rec.plantId} recommendation={rec} onDelegate={onDelegate} onOverride={onOverride} />
                ))}
            </div>
        </section>
    );
}
