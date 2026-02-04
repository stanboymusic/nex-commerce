/**
* This file contains type definitions for the PocketBase collections.
* It matches the schema defined in the PocketBase dashboard.
*/

import PocketBase, { RecordModel } from 'pocketbase';

export interface BaseRecord extends RecordModel {
    id: string;
    created: string;
    updated: string;
}

export interface User extends BaseRecord {
    name?: string;
    email: string;
    avatar?: string;
    role?: 'ADMIN' | 'USER'; // Assuming role field exists or will be added, otherwise accessible via authStore
}

export interface Category extends BaseRecord {
    name: string;
}

export interface Product extends BaseRecord {
    name: string;
    slug: string;
    description?: string;
    price: number;
    priceUSD?: number;
    isPreorder: boolean;
    stock: number;
    arrivalDate?: string;
    estimatedArrivalDate?: string;
    estimatedDeliveryDate?: string;
    category: string; // Relation ID
    images?: string[];
    expand?: {
        category?: Category;
    };
}

export interface Order extends BaseRecord {
    user: string; // Relation ID
    status: 'PENDING_PAYMENT' | 'PAYMENT_REPORTED' | 'CONFIRMED' | 'PREPARING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
    paymentMethod: 'KONTIGO' | 'CASH_COP' | 'CASH_USD' | 'CASH_ON_DELIVERY';
    currency: 'COP' | 'USD';
    total: number;
    isPreorder: boolean;
    address: string;
    notes?: string;
    paymentReference?: string;
    paymentReportedAt?: string;
    binanceTxHash?: string;
    expand?: {
        user?: User;
        'order_items(order)'?: OrderItem[]; // Reverse relation
    };
}

export interface OrderItem extends BaseRecord {
    order: string; // Relation ID
    product: string; // Relation ID
    name: string;
    quantity: number;
    price: number;
    expand?: {
        product?: Product;
    };
}

export interface CartItem extends BaseRecord {
    user: string; // Relation ID
    product: string; // Relation ID
    quantity: number;
    expand?: {
        product?: Product;
    };
}

export interface Review extends BaseRecord {
    product: string; // Relation ID
    user: string; // Relation ID
    rating: number;
    comment?: string;
}

export interface StockAlert extends BaseRecord {
    product: string; // Relation ID
    email?: string;
    phone?: string;
}

export interface StockRequest extends BaseRecord {
    product: string; // Relation ID
    user: string; // Relation ID
    message?: string;
    status: 'PENDING' | 'FULFILLED';
}

export interface OrderStatusEvent extends BaseRecord {
    order: string; // Relation ID
    status: 'PENDING_PAYMENT' | 'PAYMENT_REPORTED' | 'CONFIRMED' | 'PREPARING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REJECTED';
    message?: string;
    visibleToUser?: boolean;
    actorRole?: 'ADMIN' | 'USER' | 'SYSTEM';
    actorId?: string;
}
