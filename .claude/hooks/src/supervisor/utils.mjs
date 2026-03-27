export const RECENT_EVENT_WINDOW = 12;
export const RECOVERY_DIAGNOSIS_PATH = ".adlc/supervisor-recovery.md";

export function normalizePath(filePath) {
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

export function isBrowserCommand(command) {
    return /pnpm\s+exec\s+agent-browser\b/.test(command);
}

export function isScreenshotCommand(command) {
    return isBrowserCommand(command) && /\bscreenshot\b/.test(command);
}
