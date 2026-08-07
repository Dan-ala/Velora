export interface NotificationParams {
    orderId: string;
    event: 'order_created' | 'payment_confirmed' | 'preparing' | 'packed' | 'guide_generated' | 'handed_to_carrier' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'returned';
    recipientEmail?: string;
    recipientPhone?: string;
    metadata?: Record<string, unknown>;
}
export interface INotificationChannel {
    send(params: {
        recipient: string;
        subject: string;
        content: string;
        html?: string;
        attachments?: Array<{
            filename: string;
            url: string;
        }>;
    }): Promise<{
        success: boolean;
        messageId?: string;
        error?: string;
    }>;
}
export declare const notificationService: {
    sendEmail(params: NotificationParams): Promise<void>;
    sendWhatsApp(params: NotificationParams): Promise<void>;
    notifyOrderEvent(params: NotificationParams): Promise<void>;
};
