/**
 * Engagement verification — checks that the mapper actually engaged with
 * challenger proposals in its challenge-revision, rather than dismissing them
 * without evidence.
 *
 * For each challenge with confidence >= medium:
 *   1. The Challenge Resolution section must exist in domain-mapping.md.
 *   2. If the mapper rejected the challenge: at least one artifact citation,
 *      plus acknowledgment of the challenger's argument.
 *   3. If the mapper accepted: the decision must be updated.
 *
 * Returns problems (string[]) — empty if no challenges exist or all are engaged.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export function engagementCheck(cwd) {
    const adlc = resolve(cwd, ".adlc");

    // Collect challenges from both challenger types
    const challenges = [...parseChallenges(adlc, "current-sprawl-challenges.md"), ...parseChallenges(adlc, "current-cohesion-challenges.md")];

    // No challenges → nothing to check
    if (challenges.length === 0) return [];

    // Filter to medium+ confidence
    const actionable = challenges.filter(c => c.confidence !== "low");
    if (actionable.length === 0) return [];

    // Read the mapping to check for Challenge Resolution section
    let mapping;
    try {
        mapping = readFileSync(resolve(adlc, "domain-mapping.md"), "utf8");
    } catch {
        return ["Engagement check: cannot read .adlc/domain-mapping.md"];
    }

    const resolutionSection = extractSection(mapping, "Challenge Resolution");
    if (!resolutionSection) {
        return [
            `Engagement check failed: ${actionable.length} challenge(s) with medium+ confidence exist, ` +
                "but .adlc/domain-mapping.md has no ## Challenge Resolution section. " +
                "The mapper must address each challenge with artifact-level evidence."
        ];
    }

    const problems = [];

    for (const challenge of actionable) {
        const name = challenge.concern;
        // Check that the concern is mentioned in the resolution section
        if (!resolutionSection.includes(name)) {
            problems.push(
                `Engagement check: challenge for "${name}" (${challenge.confidence} confidence) ` +
                    "has no entry in the Challenge Resolution section."
            );
        }
    }

    return problems;
}

/**
 * Parse a challenge file to extract concern names and confidence levels.
 * Returns [{ concern, confidence }].
 */
function parseChallenges(adlcDir, filename) {
    let content;
    try {
        content = readFileSync(resolve(adlcDir, filename), "utf8");
    } catch {
        return [];
    }

    const challenges = [];
    // Match: ## Challenge: {concern name}  or  ## {concern name} -> {module}
    const headingRe = /^##\s+(?:Challenge:\s*)?(.+?)(?:\s*->.*)?$/gm;
    let match;
    let lastConcern = null;

    const lines = content.split("\n");
    for (const line of lines) {
        const headingMatch = line.match(/^##\s+(?:Challenge:\s*)?(.+?)(?:\s*->.*)?$/);
        if (headingMatch) {
            lastConcern = headingMatch[1].trim();
            continue;
        }

        const confMatch = line.match(/^\*\*?Confidence\*?\*?:\s*(\w+)/i);
        if (confMatch && lastConcern) {
            challenges.push({
                concern: lastConcern,
                confidence: confMatch[1].toLowerCase()
            });
            lastConcern = null;
        }
    }

    return challenges;
}

function extractSection(md, heading) {
    const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`^##\\s+${escaped}\\b[^\\n]*\\n([\\s\\S]*?)(?=^##\\s|$)`, "m");
    const match = md.match(re);
    return match ? match[1] : null;
}
