import { checkInstallGate } from "../policies/install-gate.mjs";

export default function handleInstallGate(context) {
    return checkInstallGate(context.event, context.nextState, context.cwd);
}
