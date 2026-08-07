import type { IShippingProvider, ShipmentParams, ShipmentResult } from '../services/shipping.service';
export declare class InterrapidisimoProvider implements IShippingProvider {
    createShipment(params: ShipmentParams): Promise<ShipmentResult>;
    getTracking(guideNumber: string): Promise<{
        status: string;
        events: {
            date: string;
            description: string;
            location: string;
        }[];
        estimatedDelivery?: undefined;
    } | {
        status: any;
        events: any;
        estimatedDelivery: any;
    }>;
    cancelShipment(guideNumber: string): Promise<boolean>;
    getRates(destination: string, weight: number): Promise<{
        service: string;
        cost: number;
        estimatedDays: string;
    }[]>;
}
