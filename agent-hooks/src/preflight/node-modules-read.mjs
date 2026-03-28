import { pathIncludesNodeModules, splitCommandSegments } from "./utils.mjs";

const MESSAGE = "Blocked: don't read library source in node_modules (type definitions — .d.ts, .d.mts, .d.cts — are allowed).";
const BASH_READ_PREFIX = /^(?:rg|grep|find|fd|cat|less|more|head|tail|sed|awk|ls|tree|Get-Content|Select-String)(?:\s|$)/i;
const NODE_MODULES_ARG = /(^|\s|["'])[^"'\s]*node_modules(?:[\\/]|\\|\s|$)/;
const DTS_SUFFIX = /\.d\.[cm]?ts$/;

export default function checkNodeModulesRead(toolName, toolInput) {
    if (toolName === "Read") {
        const filePath = toolInput?.file_path ?? "";
        if (pathIncludesNodeModules(filePath) && !DTS_SUFFIX.test(filePath)) {
            return { action: "block", reason: MESSAGE };
        }

        return null;
    }

    if (toolName === "Glob") {
        const pattern = toolInput?.pattern ?? "";
        const path = toolInput?.path ?? "";
        const targetsNodeModules = pathIncludesNodeModules(pattern) || pathIncludesNodeModules(path);
        if (targetsNodeModules && !DTS_SUFFIX.test(pattern)) {
            return { action: "block", reason: MESSAGE };
        }

        return null;
    }

    if (toolName !== "Bash") {
        return null;
    }

    const command = toolInput?.command ?? "";

    for (const segment of splitCommandSegments(command)) {
        if (!BASH_READ_PREFIX.test(segment)) {
            continue;
        }

        if (NODE_MODULES_ARG.test(segment)) {
            return { action: "block", reason: MESSAGE };
        }
    }

    return null;
}
