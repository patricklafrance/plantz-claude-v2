export interface CareEvent {
    id: string;
    plantId: string;
    actorId: string;
    actorName: string;
    eventType: "watered";
    timestamp: Date;
}

export function parseCareEvent(data: Record<string, unknown>): CareEvent {
    return {
        id: data.id,
        plantId: data.plantId,
        actorId: data.actorId,
        actorName: data.actorName,
        eventType: data.eventType,
        timestamp: new Date(data.timestamp as string | number)
    } as CareEvent;
}
