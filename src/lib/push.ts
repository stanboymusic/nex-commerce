import webpush from 'web-push';
import { getAdminPocketBase } from '@/lib/admin';

const publicKey = process.env.VAPID_PUBLIC_KEY || '';
const privateKey = process.env.VAPID_PRIVATE_KEY || '';
const subject = process.env.VAPID_SUBJECT || 'mailto:admin@nexcommerce.com';

if (publicKey && privateKey) {
  webpush.setVapidDetails(subject, publicKey, privateKey);
}

export function isPushConfigured() {
  return Boolean(publicKey && privateKey);
}

async function removeSubscriptionById(id: string) {
  try {
    const pb = await getAdminPocketBase();
    await pb.collection('push_subscriptions').delete(id);
  } catch (error) {
    console.error('PUSH_SUB_DELETE_ERROR:', error);
  }
}

export async function sendPushToUser(userId: string, payload: any) {
  if (!isPushConfigured()) return;
  try {
    const pb = await getAdminPocketBase();
    const subs = await pb.collection('push_subscriptions').getFullList({
      filter: `user = "${userId}"`
    });

    await Promise.all(subs.map(async (sub: any) => {
      try {
        const subscription = typeof sub.subscription === 'string'
          ? JSON.parse(sub.subscription)
          : sub.subscription;
        await webpush.sendNotification(subscription, JSON.stringify(payload));
      } catch (error: any) {
        const status = error?.statusCode || error?.status;
        if (status === 404 || status === 410) {
          await removeSubscriptionById(sub.id);
        }
      }
    }));
  } catch (error) {
    console.error('PUSH_SEND_USER_ERROR:', error);
  }
}

export async function sendPushToRole(role: 'ADMIN' | 'USER', payload: any) {
  if (!isPushConfigured()) return;
  try {
    const pb = await getAdminPocketBase();
    const subs = await pb.collection('push_subscriptions').getFullList({
      filter: `role = "${role}"`
    });

    await Promise.all(subs.map(async (sub: any) => {
      try {
        const subscription = typeof sub.subscription === 'string'
          ? JSON.parse(sub.subscription)
          : sub.subscription;
        await webpush.sendNotification(subscription, JSON.stringify(payload));
      } catch (error: any) {
        const status = error?.statusCode || error?.status;
        if (status === 404 || status === 410) {
          await removeSubscriptionById(sub.id);
        }
      }
    }));
  } catch (error) {
    console.error('PUSH_SEND_ROLE_ERROR:', error);
  }
}

export function getVapidPublicKey() {
  return publicKey;
}
