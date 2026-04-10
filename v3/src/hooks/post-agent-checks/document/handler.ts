/**
 * document handler
 *
 * Post-completion pipeline:
 *   1 -- format autofix
 */

import { formatAutofix } from "../format-autofix.js";

export async function handleDocument(cwd: string): Promise<string[]> {
    return formatAutofix(cwd);
}
