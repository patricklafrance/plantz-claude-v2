/** Verify that the coder wrote to .adlc/implementation-notes.md for the current slice. */

const EXPECTED_FILE = ".adlc/implementation-notes.md";

export function implementationNotesCheck(changedFiles) {
    if (changedFiles.includes(EXPECTED_FILE)) {
        return [];
    }

    return [`[implementation-notes] ${EXPECTED_FILE} was not created or updated. Each slice must document its changes in this file.`];
}
