/**
 * _adlc-document handler
 *
 * Post-completion pipeline:
 *   1 — oxfmt autofix
 */

import { oxfmtAutofix } from "../coder/oxfmt-autofix.mjs";

export default async function handleDocument(cwd) {
    return oxfmtAutofix(cwd);
}
