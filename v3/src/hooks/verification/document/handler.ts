/**
 * document handler
 *
 * Post-completion pipeline:
 *   1 -- oxfmt autofix
 */

import { oxfmtAutofix } from "../oxfmt-autofix.js";

export async function handleDocument(cwd: string): Promise<string[]> {
    return oxfmtAutofix(cwd);
}
