export type RecommendationType = "water-before-trip" | "safe-until-return" | "delegate-watering" | "already-overdue";

export type PlanningStrategy = "conservative" | "balanced" | "minimal-intervention";

export type PlanStatus = "draft" | "active" | "completed" | "cancelled";

export type RiskLevel = "low" | "medium" | "high";

export interface DelegationInfo {
    helperName: string;
    wateringDate: Date;
    notes?: string;
}

export interface PlantRecommendation {
    plantId: string;
    plantName: string;
    type: RecommendationType;
    reasoning: string;
    suggestedActionDate: Date;
    riskLevel: RiskLevel;
    override?: RecommendationType;
    delegation?: DelegationInfo;
}

export interface VacationPlan {
    id: string;
    startDate: Date;
    endDate: Date;
    strategy: PlanningStrategy;
    status: PlanStatus;
    recommendations: PlantRecommendation[];
    createdAt: Date;
    updatedAt: Date;
}
