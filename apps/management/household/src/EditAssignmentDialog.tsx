import { useEffect, useState } from "react";

import {
    Button,
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    Label,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@packages/components";
import { getAuthHeaders } from "@packages/core-module";

import type { AssignmentRow } from "./AssignmentList.tsx";

interface MemberOption {
    id: string;
    userId: string;
    name: string;
}

interface EditAssignmentDialogProps {
    assignment: AssignmentRow | null;
    members: MemberOption[];
    householdId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSaved: (updated: AssignmentRow) => void;
}

type AssignmentType = "fixed" | "rotating" | "unassigned";

export function EditAssignmentDialog({ assignment, members, householdId, open, onOpenChange, onSaved }: EditAssignmentDialogProps) {
    const [assignmentType, setAssignmentType] = useState<AssignmentType>("unassigned");
    const [assignedUserId, setAssignedUserId] = useState<string>("");
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (assignment) {
            setAssignmentType(assignment.assignmentType);
            setAssignedUserId(assignment.assignedUserId ?? "");
            setError(null);
        }
    }, [assignment]);

    function handleOpenChange(nextOpen: boolean) {
        if (!nextOpen && isPending) {
            return;
        }
        if (!nextOpen) {
            setError(null);
        }
        onOpenChange(nextOpen);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (!assignment || isPending) {
            return;
        }

        if (assignmentType === "fixed" && !assignedUserId) {
            setError("Please select a member for a fixed assignment.");
            return;
        }

        setIsPending(true);
        setError(null);

        try {
            const response = await fetch(`/api/management/households/${householdId}/assignments/${assignment.plantId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    ...getAuthHeaders()
                },
                body: JSON.stringify({
                    assignmentType,
                    assignedUserId: assignmentType === "fixed" ? assignedUserId : undefined
                })
            });

            if (!response.ok) {
                setError("An error occurred. Please try again.");
                setIsPending(false);
                return;
            }

            const selectedMember = members.find(m => m.userId === assignedUserId);

            const updated: AssignmentRow = {
                ...assignment,
                assignmentType,
                assignedUserId: assignmentType === "fixed" ? assignedUserId : undefined,
                assignedMemberName: assignmentType === "fixed" ? selectedMember?.name : undefined
            };

            setIsPending(false);
            setError(null);
            onOpenChange(false);
            onSaved(updated);
        } catch {
            setError("An error occurred. Please try again.");
            setIsPending(false);
        }
    }

    const isSubmitDisabled = isPending || (assignmentType === "fixed" && !assignedUserId);
    const selectedMemberName = assignedUserId ? (members.find(m => m.userId === assignedUserId)?.name ?? assignedUserId) : undefined;

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Edit assignment{assignment ? ` — ${assignment.plantName}` : ""}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} id="edit-assignment-form" noValidate>
                    <div className="flex flex-col gap-4">
                        <fieldset className="flex flex-col gap-2">
                            <legend className="text-sm font-medium">Assignment type *</legend>
                            <div className="flex flex-col gap-2">
                                {(["fixed", "rotating", "unassigned"] as const).map(type => (
                                    <label key={type} className="flex cursor-pointer items-center gap-2 text-sm">
                                        <input
                                            type="radio"
                                            name="assignmentType"
                                            value={type}
                                            checked={assignmentType === type}
                                            onChange={() => {
                                                setAssignmentType(type);
                                                if (type !== "fixed") {
                                                    setAssignedUserId("");
                                                }
                                            }}
                                            disabled={isPending}
                                            className="accent-primary size-4 cursor-pointer"
                                        />
                                        <span className="capitalize">
                                            {type === "unassigned" ? "Unassigned (anyone)" : type.charAt(0).toUpperCase() + type.slice(1)}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </fieldset>

                        {assignmentType === "fixed" && (
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="assigned-member">Member *</Label>
                                <Select value={assignedUserId} onValueChange={v => setAssignedUserId(v ?? "")} disabled={isPending}>
                                    <SelectTrigger id="assigned-member" className="w-full" aria-invalid={error && !assignedUserId ? true : undefined}>
                                        <SelectValue placeholder="Select a member">{selectedMemberName}</SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {members.map(m => (
                                            <SelectItem key={m.userId} value={m.userId}>
                                                {m.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {error && (
                            <p role="alert" className="text-destructive text-sm">
                                {error}
                            </p>
                        )}
                    </div>
                </form>
                <DialogFooter>
                    <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isPending}>
                        Cancel
                    </Button>
                    <Button type="submit" form="edit-assignment-form" disabled={isSubmitDisabled} aria-busy={isPending}>
                        {isPending ? "Saving..." : "Save"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
