import { Checkbox } from "@packages/components";

import { PLANT_LIST_GRID } from "./plantListLayout.ts";

interface PlantListHeaderProps {
    showCheckbox?: boolean | undefined;
    showActions?: boolean | undefined;
    selectAllChecked?: boolean | undefined;
    onToggleSelectAll?: (() => void) | undefined;
}

export function PlantListHeader({ showCheckbox = false, showActions = false, selectAllChecked = false, onToggleSelectAll }: PlantListHeaderProps) {
    return (
        <>
            {onToggleSelectAll && (
                <div className="bg-muted/50 border-border flex items-center gap-3 border-b px-4 py-2 md:hidden">
                    <Checkbox checked={selectAllChecked} onCheckedChange={onToggleSelectAll} aria-label="Select all plants" />
                    <span className="text-muted-foreground text-xs font-medium">Select all</span>
                </div>
            )}
            <div className="bg-muted/50 border-border hidden items-center gap-3 border-b px-4 py-2 md:flex">
                {onToggleSelectAll ? <Checkbox checked={selectAllChecked} onCheckedChange={onToggleSelectAll} aria-label="Select all plants" /> : showCheckbox && <span className="w-4 shrink-0" />}
                <div className={`min-w-0 flex-1 items-center gap-4 ${PLANT_LIST_GRID}`}>
                    <span className="text-muted-foreground text-xs font-medium">Name</span>
                    <span className="text-muted-foreground text-xs font-medium">Watering Qty</span>
                    <span className="text-muted-foreground text-xs font-medium">Watering Type</span>
                    <span className="text-muted-foreground text-xs font-medium">Location</span>
                    <span className="text-muted-foreground text-xs font-medium">Mist Leaves</span>
                </div>
                {showActions && (
                    <div className="flex shrink-0 items-center gap-1">
                        <span className="w-6" />
                        <span className="w-6" />
                    </div>
                )}
            </div>
        </>
    );
}
