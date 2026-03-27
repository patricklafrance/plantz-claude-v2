import { pathIncludesNodeModules, splitCommandSegments, stripRtkPrefix } from "./utils.mjs";

const MESSAGE = "Blocked: don't read library source in node_modules. Check TypeScript types or API docs instead.";
const BASH_READ_PREFIX = /^(?:rg|grep|find|fd|cat|less|more|head|tail|sed|awk|ls|tree|Get-Content|Select-String)(?:\s|$)/i;
const NODE_MODULES_ARG = /(^|\s|["'])[^"'\\s]*node_modules(?:[\\/]|\\|\s|$)/;

export default function checkNodeModulesRead(toolName, toolInput) {
    if (toolName === "Read") {
        const filePath = toolInput?.file_path ?? "";
        if (pathIncludesNodeModules(filePath)) {
            return { action: "block", reason: MESSAGE };
        }

        return null;
    }

    if (toolName !== "Bash") {
        return null;
    }

    const command = toolInput?.command ?? "";

    for (const segment of splitCommandSegments(command)) {
        const bare = stripRtkPrefix(segment);
        if (!BASH_READ_PREFIX.test(bare)) {
            continue;
        }

        if (NODE_MODULES_ARG.test(bare)) {
            return { action: "block", reason: MESSAGE };
        }
    }

    return null;
}
