export const VERSION = '1.0.0';
export const DEFAULT_BASE_URL = 'https://api.replier.net';
export class ReplierError extends Error {
    constructor(message, errorCode, response, httpStatus) {
        super(message);
        this.errorCode = errorCode;
        this.response = response;
        this.httpStatus = httpStatus;
        this.name = 'ReplierError';
    }
}
const joinPhones = (phones) => (Array.isArray(phones) ? phones.join(',') : phones);
export class Replier {
    constructor(config = {}) {
        this.config = config;
        this.baseUrl = (config.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, '');
        this.timeout = config.timeout ?? 70000;
        const f = config.fetch ?? globalThis.fetch;
        if (!f)
            throw new Error('No fetch implementation found. Use Node 18+ or pass config.fetch.');
        this.fetchImpl = f.bind(globalThis);
    }
    // ------------------------------------------------------------------ core
    /** Call any instance endpoint; instanceid and token are added automatically. */
    call(method, params = {}) {
        const auth = {};
        if (this.config.instanceId != null)
            auth.instanceid = String(this.config.instanceId);
        if (this.config.token != null)
            auth.token = this.config.token;
        return this.request(method, { ...auth, ...params });
    }
    /** Call an account endpoint; email and apikey are added automatically. */
    callAccount(method, params = {}) {
        const auth = {};
        if (this.config.email != null)
            auth.email = this.config.email;
        if (this.config.apiKey != null)
            auth.apikey = this.config.apiKey;
        return this.request(method, { ...auth, ...params });
    }
    async request(method, params) {
        const body = {};
        for (const [k, v] of Object.entries(params))
            if (v !== undefined && v !== null)
                body[k] = v;
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), this.timeout);
        let res;
        try {
            res = await this.fetchImpl(`${this.baseUrl}/${method}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify(body),
                signal: controller.signal,
            });
        }
        catch (err) {
            throw new ReplierError(`Request failed: ${err?.message ?? err}`);
        }
        finally {
            clearTimeout(timer);
        }
        let data;
        try {
            data = await res.json();
        }
        catch {
            throw new ReplierError(`Invalid JSON response (HTTP ${res.status})`, undefined, undefined, res.status);
        }
        if (data === null || typeof data !== 'object') {
            throw new ReplierError(`Invalid JSON response (HTTP ${res.status})`, undefined, undefined, res.status);
        }
        if (!res.ok || data.success === false || data.success === 'false') {
            throw new ReplierError(reasonOf(data, res.ok ? 'Request failed' : `HTTP ${res.status}`), data.errorCode != null ? String(data.errorCode) : undefined, data, res.status);
        }
        return data;
    }
    // ------------------------------------------------------------------ instance
    status() { return this.call('status'); }
    qrCode() { return this.call('qr_code'); }
    pairCode(phone) { return this.call('pair_code', { phone }); }
    logout() { return this.call('logout'); }
    takeover() { return this.call('takeover'); }
    expiry() { return this.call('expiry'); }
    retry() { return this.call('retry'); }
    reboot() { return this.call('reboot'); }
    getSettings() { return this.call('getSettings'); }
    setSettings(settings) { return this.call('settings', settings); }
    me() { return this.call('me'); }
    version() { return this.call('version'); }
    screenshot() { return this.call('screenshot'); }
    // ------------------------------------------------------------------ messages
    sendMessage(phone, body, options) {
        return this.call('sendMessage', { phone, body, options });
    }
    /** @param body file URL or base64 data URI */
    sendFile(phone, body, filename, caption) {
        return this.call('sendFile', { phone, body, filename, caption });
    }
    sendPTT(phone, audio) { return this.call('sendPTT', { phone, audio }); }
    sendLink(phone, body) { return this.call('sendLink', { phone, body }); }
    sendContact(phone, contactId) { return this.call('sendContact', { phone, contactId }); }
    sendLocation(phone, lat, lng, address) {
        return this.call('sendLocation', { phone, lat, lng, address });
    }
    sendVCard(phone, vcard) { return this.call('sendVCard', { phone, vcard }); }
    sendButton(phone, body, buttons, header, footer) {
        return this.call('sendButton', { phone, body, buttons, header, footer });
    }
    sendList(phone, body, title, list, header, footer) {
        return this.call('sendList', { phone, body, title, list, header, footer });
    }
    forwardMessage(phone, messageId) { return this.call('forwardMessage', { phone, messageId }); }
    deleteMessage(phone, messageId) { return this.call('deleteMessage', { phone, messageId }); }
    sendSeen(phone) { return this.call('sendSeen', { phone }); }
    messages(phone, limit, lastMessageNumber) {
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
    createGroup(groupName, phones) {
        return this.call('group', { groupName, phones: joinPhones(phones) });
    }
    leaveGroup(groupId) { return this.call('leaveGroup', { groupId }); }
    addGroupParticipant(groupId, phones) {
        return this.call('addGroupParticipant', { groupId, phones: joinPhones(phones) });
    }
    removeGroupParticipant(groupId, phones) {
        return this.call('removeGroupParticipant', { groupId, phones: joinPhones(phones) });
    }
    promoteGroupParticipant(groupId, phones) {
        return this.call('promoteGroupParticipant', { groupId, phones: joinPhones(phones) });
    }
    demoteGroupParticipant(groupId, phones) {
        return this.call('demoteGroupParticipant', { groupId, phones: joinPhones(phones) });
    }
    // ------------------------------------------------------------------ channels
    createChannel(name, description, picture) {
        return this.call('channel', { name, description, picture });
    }
    followChannel(channelId) { return this.call('channelFollow', { channelId }); }
    unfollowChannel(channelId) { return this.call('channelUnfollow', { channelId }); }
    channelInfo(channelId) { return this.call('channelInfo', { channelId }); }
    // ------------------------------------------------------------------ webhook / bot / ban
    setWebhook(webhookUrl) { return this.call('webhook', { webhookUrl }); }
    getWebhookStatus() { return this.call('getWebhookStatus'); }
    getBanSettings() { return this.call('getBanSettings'); }
    botSettings() { return this.call('botSettings'); }
    getBotSettings() { return this.call('getbotSettings'); }
    // ------------------------------------------------------------------ account
    listInstances() { return this.callAccount('listInstances'); }
    newInstance(packageId, voucher) {
        return this.callAccount('newInstance', { packageid: packageId, voucher });
    }
    renewInstance(instanceId, packageId, voucher) {
        return this.callAccount('renewInstance', { instanceid: String(instanceId), packageid: packageId, voucher });
    }
}
function reasonOf(data, fallback) {
    if (data.reason)
        return String(data.reason);
    if (data.msg)
        return Array.isArray(data.msg) ? data.msg.join(', ') : String(data.msg);
    return fallback;
}
export default Replier;
