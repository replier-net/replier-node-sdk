export const VERSION = '1.0.0';
export const DEFAULT_BASE_URL = 'https://api.replier.net';

export interface ReplierConfig {
  /** Instance id shown in the Replier user panel. */
  instanceId?: string | number;
  /** Instance token shown in the Replier user panel. */
  token?: string;
  /** Account email, needed only for listInstances / newInstance / renewInstance. */
  email?: string;
  /** Account API key, needed only for listInstances / newInstance / renewInstance. */
  apiKey?: string;
  /** Defaults to https://api.replier.net. Point it at your own proxy if needed. */
  baseUrl?: string;
  /** Request timeout in milliseconds. Defaults to 70000. */
  timeout?: number;
  /** Custom fetch implementation (defaults to globalThis.fetch). */
  fetch?: typeof fetch;
}

/** Raw API response. Shape varies per endpoint. */
export type ReplierResponse = Record<string, any>;

export interface SendResult extends ReplierResponse {
  sent?: boolean;
  id?: string;
  from?: string;
  to?: string;
  timestamp?: number;
  type?: string;
}

export class ReplierError extends Error {
  constructor(
    message: string,
    public readonly errorCode?: string,
    public readonly response?: ReplierResponse,
    public readonly httpStatus?: number,
  ) {
    super(message);
    this.name = 'ReplierError';
  }
}

type Params = Record<string, unknown>;

const joinPhones = (phones: string | string[]) => (Array.isArray(phones) ? phones.join(',') : phones);

export class Replier {
  private readonly baseUrl: string;
  private readonly timeout: number;
  private readonly fetchImpl: typeof fetch;

  constructor(private readonly config: ReplierConfig = {}) {
    this.baseUrl = (config.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, '');
    this.timeout = config.timeout ?? 70_000;
    const f = config.fetch ?? globalThis.fetch;
    if (!f) throw new Error('No fetch implementation found. Use Node 18+ or pass config.fetch.');
    this.fetchImpl = f.bind(globalThis);
  }

  // ------------------------------------------------------------------ core

  /** Call any instance endpoint; instanceid and token are added automatically. */
  call<T = ReplierResponse>(method: string, params: Params = {}): Promise<T> {
    const auth: Params = {};
    if (this.config.instanceId != null) auth.instanceid = String(this.config.instanceId);
    if (this.config.token != null) auth.token = this.config.token;
    return this.request<T>(method, { ...auth, ...params });
  }

  /** Call an account endpoint; email and apikey are added automatically. */
  callAccount<T = ReplierResponse>(method: string, params: Params = {}): Promise<T> {
    const auth: Params = {};
    if (this.config.email != null) auth.email = this.config.email;
    if (this.config.apiKey != null) auth.apikey = this.config.apiKey;
    return this.request<T>(method, { ...auth, ...params });
  }

  private async request<T>(method: string, params: Params): Promise<T> {
    const body: Params = {};
    for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null) body[k] = v;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeout);
    let res: Response;
    try {
      res = await this.fetchImpl(`${this.baseUrl}/${method}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } catch (err: any) {
      throw new ReplierError(`Request failed: ${err?.message ?? err}`);
    } finally {
      clearTimeout(timer);
    }

    let data: any;
    try {
      data = await res.json();
    } catch {
      throw new ReplierError(`Invalid JSON response (HTTP ${res.status})`, undefined, undefined, res.status);
    }
    if (data === null || typeof data !== 'object') {
      throw new ReplierError(`Invalid JSON response (HTTP ${res.status})`, undefined, undefined, res.status);
    }
    if (!res.ok || data.success === false || data.success === 'false') {
      throw new ReplierError(reasonOf(data, res.ok ? 'Request failed' : `HTTP ${res.status}`),
        data.errorCode != null ? String(data.errorCode) : undefined, data, res.status);
    }
    return data as T;
  }

  // ------------------------------------------------------------------ instance

  status() { return this.call('status'); }
  qrCode() { return this.call('qr_code'); }
  pairCode(phone: string) { return this.call('pair_code', { phone }); }
  logout() { return this.call('logout'); }
  takeover() { return this.call('takeover'); }
  expiry() { return this.call('expiry'); }
  retry() { return this.call('retry'); }
  reboot() { return this.call('reboot'); }
  getSettings() { return this.call('getSettings'); }
  setSettings(settings: Params) { return this.call('settings', settings); }
  me() { return this.call('me'); }
  version() { return this.call('version'); }
  screenshot() { return this.call('screenshot'); }

  // ------------------------------------------------------------------ messages

  sendMessage(phone: string, body: string, options?: Params) {
    return this.call<SendResult>('sendMessage', { phone, body, options });
  }
  /** @param body file URL or base64 data URI */
  sendFile(phone: string, body: string, filename: string, caption?: string) {
    return this.call<SendResult>('sendFile', { phone, body, filename, caption });
  }
  sendPTT(phone: string, audio: string) { return this.call<SendResult>('sendPTT', { phone, audio }); }
  sendLink(phone: string, body: string) { return this.call<SendResult>('sendLink', { phone, body }); }
  sendContact(phone: string, contactId: string) { return this.call<SendResult>('sendContact', { phone, contactId }); }
  sendLocation(phone: string, lat: number, lng: number, address?: string) {
    return this.call<SendResult>('sendLocation', { phone, lat, lng, address });
  }
  sendVCard(phone: string, vcard: string) { return this.call<SendResult>('sendVCard', { phone, vcard }); }
  sendButton(phone: string, body: string, buttons: unknown, header?: string, footer?: string) {
    return this.call<SendResult>('sendButton', { phone, body, buttons, header, footer });
  }
  sendList(phone: string, body: string, title: string, list: unknown, header?: string, footer?: string) {
    return this.call<SendResult>('sendList', { phone, body, title, list, header, footer });
  }
  forwardMessage(phone: string, messageId: string) { return this.call<SendResult>('forwardMessage', { phone, messageId }); }
  deleteMessage(phone: string, messageId: string) { return this.call('deleteMessage', { phone, messageId }); }
  sendSeen(phone: string) { return this.call('sendSeen', { phone }); }
  messages(phone: string, limit?: number, lastMessageNumber?: number) {
    return this.call('messages', { phone, limit, lastMessageNumber });
  }
  showMessagesQueue() { return this.call('showMessagesQueue'); }
  clearMessagesQueue() { return this.call('clearMessagesQueue'); }
  showActionsQueue() { return this.call('showActionsQueue'); }
  clearActionsQueue() { return this.call('clearActionsQueue'); }

  // ------------------------------------------------------------------ chats

  dialogs() { return this.call('dialogs'); }
  chats() { return this.call('chats'); }
  contacts() { return this.call('contacts'); }

  // ------------------------------------------------------------------ groups

  createGroup(groupName: string, phones: string | string[]) {
    return this.call('group', { groupName, phones: joinPhones(phones) });
  }
  leaveGroup(groupId: string) { return this.call('leaveGroup', { groupId }); }
  addGroupParticipant(groupId: string, phones: string | string[]) {
    return this.call('addGroupParticipant', { groupId, phones: joinPhones(phones) });
  }
  removeGroupParticipant(groupId: string, phones: string | string[]) {
    return this.call('removeGroupParticipant', { groupId, phones: joinPhones(phones) });
  }
  promoteGroupParticipant(groupId: string, phones: string | string[]) {
    return this.call('promoteGroupParticipant', { groupId, phones: joinPhones(phones) });
  }
  demoteGroupParticipant(groupId: string, phones: string | string[]) {
    return this.call('demoteGroupParticipant', { groupId, phones: joinPhones(phones) });
  }

  // ------------------------------------------------------------------ channels

  createChannel(name: string, description?: string, picture?: string) {
    return this.call('channel', { name, description, picture });
  }
  followChannel(channelId: string) { return this.call('channelFollow', { channelId }); }
  unfollowChannel(channelId: string) { return this.call('channelUnfollow', { channelId }); }
  channelInfo(channelId: string) { return this.call('channelInfo', { channelId }); }

  // ------------------------------------------------------------------ webhook / bot / ban

  setWebhook(webhookUrl: string) { return this.call('webhook', { webhookUrl }); }
  getWebhookStatus() { return this.call('getWebhookStatus'); }
  getBanSettings() { return this.call('getBanSettings'); }
  botSettings() { return this.call('botSettings'); }
  getBotSettings() { return this.call('getbotSettings'); }

  // ------------------------------------------------------------------ account

  listInstances() { return this.callAccount('listInstances'); }
  newInstance(packageId: number, voucher?: string) {
    return this.callAccount('newInstance', { packageid: packageId, voucher });
  }
  renewInstance(instanceId: string | number, packageId: number, voucher?: string) {
    return this.callAccount('renewInstance', { instanceid: String(instanceId), packageid: packageId, voucher });
  }
}

function reasonOf(data: any, fallback: string): string {
  if (data.reason) return String(data.reason);
  if (data.msg) return Array.isArray(data.msg) ? data.msg.join(', ') : String(data.msg);
  return fallback;
}

export default Replier;
