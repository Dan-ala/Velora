export interface TimelineEvent {
    orderId: string;
    event: 'order_created' | 'payment_confirmed' | 'preparing' | 'packed' | 'guide_generated' | 'handed_to_carrier' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'returned' | 'note_added';
    metadata?: Record<string, unknown>;
}
export declare const orderTimelineService: {
    record(event: TimelineEvent): Promise<{
        id: string;
        createdAt: Date;
        orderId: string;
        event: import("@prisma/client").$Enums.OrderEvent;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    findByOrder(orderId: string): Promise<{
        id: string;
        createdAt: Date;
        orderId: string;
        event: import("@prisma/client").$Enums.OrderEvent;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
    }[]>;
    findRecentByOrder(orderId: string, limit?: number): Promise<{
        id: string;
        createdAt: Date;
        orderId: string;
        event: import("@prisma/client").$Enums.OrderEvent;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
    }[]>;
};
