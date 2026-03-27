import checkBareTypecheck from "./bare-typecheck.mjs";
import checkNoCmd from "./no-cmd.mjs";
import checkNodeModulesRead from "./node-modules-read.mjs";
import checkPackageManager from "./package-manager.mjs";

const checks = [checkPackageManager, checkNoCmd, checkBareTypecheck, checkNodeModulesRead];

export function evaluate(toolName, toolInput = {}) {
    for (const check of checks) {
        const result = check(toolName, toolInput);
        if (result) {
            return result;
        }
    }

    return { action: "allow" };
}
