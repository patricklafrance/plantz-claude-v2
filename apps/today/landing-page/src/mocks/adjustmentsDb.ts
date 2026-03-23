import type { AdjustmentEvent } from "@packages/core-plants/care-event";

interface DismissedRecord {
    plantId: string;
    dismissedAt: Date;
    eventCountAtDismissal: number;
}

const eventStore = new Map<string, AdjustmentEvent>();
const dismissedStore = new Map<string, DismissedRecord>();

export const adjustmentsDb = {
    getAllByPlant(plantId: string): AdjustmentEvent[] {
        return [...eventStore.values()].filter((e) => e.plantId === plantId).toSorted((a, b) => b.adjustmentDate.getTime() - a.adjustmentDate.getTime());
    },

    insert(event: AdjustmentEvent): AdjustmentEvent {
        eventStore.set(event.id, event);

        return event;
    },

    isDismissed(plantId: string, currentEventCount: number): boolean {
        const record = dismissedStore.get(plantId);

        if (!record) return false;

        // If 3+ new watered events have occurred since dismissal, show again
        if (currentEventCount - record.eventCountAtDismissal >= 3) {
            dismissedStore.delete(plantId);

            return false;
        }

        return true;
    },

    dismiss(plantId: string, currentEventCount: number): void {
        dismissedStore.set(plantId, {
            plantId,
            dismissedAt: new Date(),
            eventCountAtDismissal: currentEventCount,
        });
    },

    reset(events: AdjustmentEvent[]): void {
        eventStore.clear();
        dismissedStore.clear();

        for (const event of events) {
            eventStore.set(event.id, event);
        }
    },
};
