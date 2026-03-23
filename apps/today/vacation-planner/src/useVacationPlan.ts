import { useReducer, useCallback } from "react";

import { getAuthHeaders } from "@packages/core-module";
import type { Plant } from "@packages/core-plants";
import { generateForecast, type PlanningStrategy, type PlantRecommendation, type RecommendationType, type DelegationInfo, type VacationPlan } from "@packages/core-plants/vacation";

interface VacationPlanState {
    plan: VacationPlan | null;
    recommendations: PlantRecommendation[];
    isSaving: boolean;
}

type VacationPlanAction =
    | { type: "GENERATE_COMPLETE"; plan: VacationPlan; recommendations: PlantRecommendation[] }
    | { type: "SAVE_START" }
    | { type: "SAVE_COMPLETE"; plan: VacationPlan }
    | { type: "CANCEL_COMPLETE" }
    | { type: "OVERRIDE_RECOMMENDATION"; plantId: string; newType: RecommendationType }
    | { type: "SET_DELEGATION"; plantId: string; delegation: DelegationInfo }
    | { type: "LOAD_PLAN"; plan: VacationPlan; recommendations: PlantRecommendation[] };

function reducer(state: VacationPlanState, action: VacationPlanAction): VacationPlanState {
    switch (action.type) {
        case "GENERATE_COMPLETE":
            return { ...state, plan: action.plan, recommendations: action.recommendations };
        case "SAVE_START":
            return { ...state, isSaving: true };
        case "SAVE_COMPLETE":
            return { ...state, isSaving: false, plan: action.plan };
        case "CANCEL_COMPLETE":
            return { plan: null, recommendations: [], isSaving: false };
        case "OVERRIDE_RECOMMENDATION":
            return {
                ...state,
                recommendations: state.recommendations.map((r) => (r.plantId === action.plantId ? { ...r, override: action.newType } : r)),
            };
        case "SET_DELEGATION":
            return {
                ...state,
                recommendations: state.recommendations.map((r) => (r.plantId === action.plantId ? { ...r, delegation: action.delegation } : r)),
            };
        case "LOAD_PLAN":
            return { ...state, plan: action.plan, recommendations: action.recommendations, isSaving: false };
        default:
            return state;
    }
}

const initialState: VacationPlanState = {
    plan: null,
    recommendations: [],
    isSaving: false,
};

export function useVacationPlan() {
    const [state, dispatch] = useReducer(reducer, initialState);

    const createPlan = useCallback((plants: Plant[], startDate: Date, endDate: Date, strategy: PlanningStrategy, today?: Date) => {
        const recommendations = generateForecast(plants, startDate, endDate, strategy, today);
        const plan: VacationPlan = {
            id: crypto.randomUUID(),
            startDate,
            endDate,
            strategy,
            status: "draft",
            recommendations,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        dispatch({ type: "GENERATE_COMPLETE", plan, recommendations });

        return plan;
    }, []);

    const savePlan = useCallback(async () => {
        if (!state.plan) return;

        dispatch({ type: "SAVE_START" });

        const response = await fetch("/api/today/vacation-planner/plans", {
            method: "POST",
            headers: { "Content-Type": "application/json", ...getAuthHeaders() },
            body: JSON.stringify({
                ...state.plan,
                status: "active",
                recommendations: state.recommendations,
            }),
        });

        if (response.ok) {
            const savedPlan = { ...state.plan, status: "active" as const, updatedAt: new Date() };
            dispatch({ type: "SAVE_COMPLETE", plan: savedPlan });
            window.dispatchEvent(new CustomEvent("vacation-plan-changed", { detail: { active: true } }));
        }
    }, [state.plan, state.recommendations]);

    const cancelPlan = useCallback(async () => {
        if (!state.plan) return;

        await fetch(`/api/today/vacation-planner/plans/${state.plan.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", ...getAuthHeaders() },
            body: JSON.stringify({ status: "cancelled" }),
        });

        dispatch({ type: "CANCEL_COMPLETE" });
        window.dispatchEvent(new CustomEvent("vacation-plan-changed", { detail: { active: false } }));
    }, [state.plan]);

    const overrideRecommendation = useCallback((plantId: string, newType: RecommendationType) => {
        dispatch({ type: "OVERRIDE_RECOMMENDATION", plantId, newType });
    }, []);

    const setDelegation = useCallback((plantId: string, delegation: DelegationInfo) => {
        dispatch({ type: "SET_DELEGATION", plantId, delegation });
    }, []);

    const loadPlan = useCallback((plan: VacationPlan, recommendations: PlantRecommendation[]) => {
        dispatch({ type: "LOAD_PLAN", plan, recommendations });
    }, []);

    return {
        plan: state.plan,
        recommendations: state.recommendations,
        isSaving: state.isSaving,
        createPlan,
        savePlan,
        cancelPlan,
        overrideRecommendation,
        setDelegation,
        loadPlan,
    };
}
