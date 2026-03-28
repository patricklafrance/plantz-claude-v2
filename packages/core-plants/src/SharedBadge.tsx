import { Badge, cn } from "@packages/components";

interface SharedBadgeProps {
    className?: string;
}

export function SharedBadge({ className }: SharedBadgeProps) {
    return (
        <Badge
            variant="outline"
            className={cn("border-transparent bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300", className)}
        >
            Shared
        </Badge>
    );
}
