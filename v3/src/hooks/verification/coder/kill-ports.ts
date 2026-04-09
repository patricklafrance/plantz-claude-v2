/** Kill processes on dev server ports (6006, 8080). */

import { execSync } from "node:child_process";

export function killPorts(): void {
    for (const port of [6006, 8080]) {
        try {
            if (process.platform === "win32") {
                execSync(
                    `powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort ${port} -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"`,
                    { stdio: "ignore", timeout: 3000 }
                );
            } else {
                execSync(`lsof -ti:${port} | xargs kill -9`, { stdio: "ignore", timeout: 3000 });
            }
        } catch {
            // Port not in use or command timed out -- ignore.
        }
    }
}
