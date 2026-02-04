import { request } from 'https';

const appId = process.env.ONE_SIGNAL_APP_ID || '';
const apiKey = process.env.ONE_SIGNAL_REST_API_KEY || '';

export function isOneSignalConfigured() {
  return Boolean(appId && apiKey);
}

type OneSignalPayload = {
  title: string;
  body: string;
  url?: string;
};

function send(body: any) {
  return new Promise<void>((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = request('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${apiKey}`,
        'Content-Length': Buffer.byteLength(data)
      }
    }, (res) => {
      let response = '';
      res.on('data', (chunk) => (response += chunk));
      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          resolve();
        } else {
          reject(new Error(response || `OneSignal error ${res.statusCode}`));
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

export async function sendOneSignalToUser(userId: string, payload: OneSignalPayload) {
  if (!isOneSignalConfigured()) return;
  try {
    await send({
      app_id: appId,
      include_external_user_ids: [userId],
      headings: { en: payload.title },
      contents: { en: payload.body },
      url: payload.url
    });
  } catch (error) {
    console.error('ONESIGNAL_SEND_USER_ERROR:', (error as any)?.message || error);
  }
}

export async function sendOneSignalToRole(role: 'ADMIN' | 'USER', payload: OneSignalPayload) {
  if (!isOneSignalConfigured()) return;
  try {
    await send({
      app_id: appId,
      filters: [
        { field: 'tag', key: 'role', relation: '=', value: role }
      ],
      headings: { en: payload.title },
      contents: { en: payload.body },
      url: payload.url
    });
  } catch (error) {
    console.error('ONESIGNAL_SEND_ROLE_ERROR:', (error as any)?.message || error);
  }
}
