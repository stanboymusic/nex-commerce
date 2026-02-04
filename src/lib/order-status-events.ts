import { sendPushToRole, sendPushToUser } from './push';
import { sendOneSignalToRole, sendOneSignalToUser } from './onesignal';

export type OrderStatus =
  | 'PENDING_PAYMENT'
  | 'PAYMENT_REPORTED'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REJECTED';

const STATUS_DEFAULT_MESSAGES: Record<OrderStatus, string> = {
  PENDING_PAYMENT: 'Tu pedido fue recibido y está siendo revisado.',
  PAYMENT_REPORTED: 'Pago reportado. Estamos validando la transacción.',
  CONFIRMED: 'Pedido confirmado. Comenzamos el proceso.',
  PREPARING: 'Tu pedido está en preparación.',
  SHIPPED: 'Tu pedido fue enviado y va en camino.',
  DELIVERED: 'Pedido entregado con éxito.',
  CANCELLED: 'Pedido cancelado.',
  REJECTED: 'Pago rechazado. Revisa los datos y vuelve a intentarlo.'
};

export function getDefaultStatusMessage(status: OrderStatus) {
  return STATUS_DEFAULT_MESSAGES[status] || 'Estado actualizado.';
}

type RecordStatusEventInput = {
  pb: any;
  orderId: string;
  status: OrderStatus;
  message?: string | null;
  visibleToUser?: boolean;
  actorRole?: 'ADMIN' | 'USER' | 'SYSTEM';
  actorId?: string | null;
  notifyUserId?: string | null;
  notifyAdmins?: boolean;
};

export async function recordOrderStatusEvent({
  pb,
  orderId,
  status,
  message,
  visibleToUser = true,
  actorRole = 'SYSTEM',
  actorId = null,
  notifyUserId = null,
  notifyAdmins = true
}: RecordStatusEventInput) {
  try {
    await pb.collection('order_status_events').create({
      order: orderId,
      status,
      message: message || getDefaultStatusMessage(status),
      visibleToUser,
      actorRole,
      actorId
    });
    const text = message || getDefaultStatusMessage(status);
    if (notifyUserId && visibleToUser) {
      await sendPushToUser(notifyUserId, {
        title: 'Actualización de pedido',
        body: text,
        data: { orderId, url: '/orders' }
      });
      await sendOneSignalToUser(notifyUserId, {
        title: 'Actualización de pedido',
        body: text,
        url: '/orders'
      });
    }
    if (notifyAdmins) {
      await sendPushToRole('ADMIN', {
        title: 'Actualización de pedido',
        body: text,
        data: { orderId, url: '/orders' }
      });
      await sendOneSignalToRole('ADMIN', {
        title: 'Actualización de pedido',
        body: text,
        url: '/orders'
      });
    }
  } catch (error) {
    console.error('ORDER_STATUS_EVENT_CREATE_ERROR:', error);
  }
}
