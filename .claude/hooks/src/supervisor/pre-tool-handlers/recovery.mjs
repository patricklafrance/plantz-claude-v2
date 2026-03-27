import { applyRecoveryProgress, enforceRecovery, isRecoveryComplete, resetStateAfterRecovery } from "../recovery.mjs";

export function handleRecoveryGate(context) {
    if (!context.recovery?.active) {
        return null;
    }

    const block = enforceRecovery(context.event, context.recovery);
    if (!block) {
        return null;
    }

    return block;
}

export function finalizeRecovery(context) {
    if (!context.recovery?.active) {
        return null;
    }

    context.recovery = applyRecoveryProgress(context.recovery, context.event);
    if (isRecoveryComplete(context.recovery)) {
        resetStateAfterRecovery(context.nextState, context.recovery);
        context.recovery = null;
    }

    return { action: "allow" };
}

export default handleRecoveryGate;
