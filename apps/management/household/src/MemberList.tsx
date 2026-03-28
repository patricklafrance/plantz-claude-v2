import { UserMinus } from "lucide-react";

import { Badge, Button } from "@packages/components";

export interface MemberRow {
    id: string;
    name: string;
    email: string;
    joinedAt: Date;
    isOwner: boolean;
}

interface MemberListProps {
    members: MemberRow[];
    onRemove: (member: MemberRow) => void;
}

function formatDate(date: Date): string {
    return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

export function MemberList({ members, onRemove }: MemberListProps) {
    if (members.length === 0) {
        return <p className="text-muted-foreground py-4 text-center text-sm">No members yet.</p>;
    }

    return (
        <div className="overflow-x-auto" role="table" aria-label="Household members">
            <div role="rowgroup">
                <div
                    role="row"
                    className="border-border grid grid-cols-[1fr_1fr_1fr_auto] gap-4 border-b px-4 py-2 text-xs font-semibold tracking-wide uppercase"
                >
                    <span role="columnheader">Name</span>
                    <span role="columnheader">Email</span>
                    <span role="columnheader">Joined</span>
                    <span role="columnheader" className="sr-only">
                        Actions
                    </span>
                </div>
            </div>
            <div role="rowgroup">
                {members.map(member => (
                    <div
                        key={member.id}
                        role="row"
                        className="border-border grid grid-cols-[1fr_1fr_1fr_auto] items-center gap-4 border-b px-4 py-3 last:border-b-0"
                    >
                        <span role="cell" className="flex items-center gap-2 text-sm font-medium">
                            {member.name}
                            {member.isOwner && (
                                <Badge variant="secondary" className="text-xs">
                                    Owner
                                </Badge>
                            )}
                        </span>
                        <span role="cell" className="text-sm">
                            {member.email}
                        </span>
                        <span role="cell" className="text-sm">
                            {formatDate(member.joinedAt)}
                        </span>
                        <span role="cell">
                            {member.isOwner ? null : (
                                <Button variant="destructive" size="sm" aria-label={`Remove ${member.name}`} onClick={() => onRemove(member)}>
                                    <UserMinus data-icon="inline-start" aria-hidden="true" />
                                    Remove
                                </Button>
                            )}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
