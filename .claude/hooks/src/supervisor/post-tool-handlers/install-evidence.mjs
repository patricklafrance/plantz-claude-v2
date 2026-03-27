import { recordInstallBypassFromResult } from "../policies/install-gate.mjs";

export default function handleInstallEvidence(context) {
    const evidence = recordInstallBypassFromResult(context.state, context.toolName, context.toolInput, {
        toolResponse: context.input.tool_response,
        error: context.input.error
    });

    if (!evidence) {
        return null;
    }

    return {
        action: "allow",
        outcome: "install-bypass-granted",
        reason: evidence.matchedPattern,
        evidenceSource: evidence.source
    };
}
