import { formatDistanceToNow } from "date-fns";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle
} from "@packages/components";

interface DuplicateWateringDialogProps {
    open: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    actorName: string;
    wateredAt: Date;
}

export function DuplicateWateringDialog({ open, onConfirm, onCancel, actorName, wateredAt }: DuplicateWateringDialogProps) {
    const timeAgo = formatDistanceToNow(wateredAt, { addSuffix: true });

    return (
        <AlertDialog
            open={open}
            onOpenChange={openState => {
                if (!openState) {
                    onCancel();
                }
            }}
        >
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Already watered</AlertDialogTitle>
                    <AlertDialogDescription>
                        {actorName} already watered this plant {timeAgo}. Water anyway?
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={onConfirm}>Water anyway</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
