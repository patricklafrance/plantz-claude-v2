const SEGMENT_SPLIT = /\s*(?:&&|\|\||;)\s*/;

function normalizePath(filePath) {
    return String(filePath ?? "").replaceAll("\\", "/");
}

export function getTargetPath(toolName, toolInput = {}) {
    if (toolName === "Read" || toolName === "Write" || toolName === "Edit") {
        return normalizePath(toolInput.file_path);
    }

    return "";
}

export function fingerprintCommand(command) {
    return String(command ?? "")
        .replace(/\s+/g, " ")
        .trim();
}

export function splitCommandSegments(command) {
    return String(command ?? "")
        .split(SEGMENT_SPLIT)
        .map(segment => segment.trim())
        .filter(Boolean);
}

export function isBrowserCommand(command) {
    return /pnpm\s+exec\s+agent-browser\b/.test(command);
}

export function isScreenshotCommand(command) {
    return isBrowserCommand(command) && /\bscreenshot\b/.test(command);
}

export function isTestCommand(command) {
    return /\b(pnpm\s+(--filter\s+\S+\s+)?test\b|pnpm\s+turbo\s+run\s+test\b|vitest\b)/.test(command);
}
