import { splitCommandSegments } from "./utils.mjs";

const RULES = [
    { pattern: /^npm(?:\s|$)/, message: "Blocked: use pnpm instead of npm." },
    { pattern: /^npx(?:\s|$)/, message: "Blocked: use pnpm exec instead of npx." },
    { pattern: /^pnpx(?:\s|$)/, message: "Blocked: pnpx is not allowed. Use pnpm exec instead." },
    { pattern: /^pnpm\s+dlx(?:\s|$)/, message: "Blocked: pnpm dlx is not allowed. Use pnpm exec instead." }
];

export default function checkPackageManager(toolName, toolInput) {
    if (toolName !== "Bash") {
        return null;
    }

    const command = toolInput?.command ?? "";

    for (const segment of splitCommandSegments(command)) {
        for (const rule of RULES) {
            if (rule.pattern.test(segment)) {
                return { action: "block", reason: rule.message };
            }
        }
    }

    return null;
}
