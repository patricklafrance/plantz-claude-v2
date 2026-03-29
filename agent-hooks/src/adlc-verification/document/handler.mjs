/**
 * _adlc-document handler
 *
 * Post-completion pipeline:
 *   1 — oxfmt autofix
 */

import { oxfmtAutofix } from "../shared/oxfmt-autofix.mjs";

export default async function handleDocument(cwd) {
    return oxfmtAutofix(cwd);
}
