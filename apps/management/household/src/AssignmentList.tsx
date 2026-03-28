import { Pencil } from "lucide-react";

import { Button } from "@packages/components";

export interface AssignmentRow {
    id: string;
    householdId: string;
    plantId: string;
    plantName: string;
    assignmentType: "fixed" | "rotating" | "unassigned";
    assignedUserId?: string;
    assignedMemberName?: string;
}

interface AssignmentListProps {
    assignments: AssignmentRow[];
    onEdit: (assignment: AssignmentRow) => void;
}

function assignmentLabel(row: AssignmentRow): string {
    if (row.assignmentType === "fixed") {
        return row.assignedMemberName ?? row.assignedUserId ?? "Unknown";
    }
    if (row.assignmentType === "rotating") {
        return "Rotating";
    }
    return "Anyone";
}

export function AssignmentList({ assignments, onEdit }: AssignmentListProps) {
    if (assignments.length === 0) {
        return <p className="text-muted-foreground py-4 text-center text-sm">No shared plants yet.</p>;
    }

    return (
        <div className="overflow-x-auto" role="table" aria-label="Plant responsibility assignments">
            <div role="rowgroup">
                <div
                    role="row"
                    className="border-border grid grid-cols-[1fr_1fr_auto] gap-4 border-b px-4 py-2 text-xs font-semibold tracking-wide uppercase"
                >
                    <span role="columnheader">Plant</span>
                    <span role="columnheader">Assignment</span>
                    <span role="columnheader" className="sr-only">
                        Actions
                    </span>
                </div>
            </div>
            <div role="rowgroup">
                {assignments.map(assignment => (
                    <div
                        key={assignment.id}
                        role="row"
                        className="border-border grid grid-cols-[1fr_1fr_auto] items-center gap-4 border-b px-4 py-3 last:border-b-0"
                    >
                        <span role="cell" className="text-sm font-medium">
                            {assignment.plantName}
                        </span>
                        <span role="cell" className="text-sm">
                            {assignmentLabel(assignment)}
                        </span>
                        <span role="cell">
                            <Button
                                variant="outline"
                                size="sm"
                                aria-label={`Edit assignment for ${assignment.plantName}`}
                                onClick={() => onEdit(assignment)}
                            >
                                <Pencil data-icon="inline-start" aria-hidden="true" />
                                Edit
                            </Button>
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
