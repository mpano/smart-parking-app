export type Lot = {
    lng: number;
    lat: number;
    id: string;
    name: string;
    capacity: number;
    available: number;
    price_per_hour: number;
    coords: { lat: number; lng: number };
};

export type Payment = {
    status: 'pending' | 'paid' | 'failed';
    amount_cents: number;
    currency: string;
    payment_url?: string;
    reference?: string;
};

export type Session = {
    payment_status: string;
    id: string;
    lot_id: string;
    lot_name?: string;
    plate: string;
    started_at: string;
    ended_at?: string;
    status: 'active' | 'completed';
    amount_cents?: number;
    currency: string;
    payment: Payment;
    receipt_pdf_url?: string;
};
