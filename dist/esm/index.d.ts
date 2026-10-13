export declare const VERSION = "1.0.0";
export declare const DEFAULT_BASE_URL = "https://api.replier.net";
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
export declare class ReplierError extends Error {
    readonly errorCode?: string | undefined;
    readonly response?: ReplierResponse | undefined;
    readonly httpStatus?: number | undefined;
    constructor(message: string, errorCode?: string | undefined, response?: ReplierResponse | undefined, httpStatus?: number | undefined);
}
type Params = Record<string, unknown>;
export declare class Replier {
    private readonly config;
    private readonly baseUrl;
    private readonly timeout;
    private readonly fetchImpl;
    constructor(config?: ReplierConfig);
    /** Call any instance endpoint; instanceid and token are added automatically. */
    call<T = ReplierResponse>(method: string, params?: Params): Promise<T>;
    /** Call an account endpoint; email and apikey are added automatically. */
    callAccount<T = ReplierResponse>(method: string, params?: Params): Promise<T>;
    private request;
    status(): Promise<ReplierResponse>;
    qrCode(): Promise<ReplierResponse>;
    pairCode(phone: string): Promise<ReplierResponse>;
    logout(): Promise<ReplierResponse>;
    takeover(): Promise<ReplierResponse>;
    expiry(): Promise<ReplierResponse>;
    retry(): Promise<ReplierResponse>;
    reboot(): Promise<ReplierResponse>;
    getSettings(): Promise<ReplierResponse>;
    setSettings(settings: Params): Promise<ReplierResponse>;
    me(): Promise<ReplierResponse>;
    version(): Promise<ReplierResponse>;
    screenshot(): Promise<ReplierResponse>;
    sendMessage(phone: string, body: string, options?: Params): Promise<SendResult>;
    /** @param body file URL or base64 data URI */
    sendFile(phone: string, body: string, filename: string, caption?: string): Promise<SendResult>;
    sendPTT(phone: string, audio: string): Promise<SendResult>;
    sendLink(phone: string, body: string): Promise<SendResult>;
    sendContact(phone: string, contactId: string): Promise<SendResult>;
    sendLocation(phone: string, lat: number, lng: number, address?: string): Promise<SendResult>;
    sendVCard(phone: string, vcard: string): Promise<SendResult>;
    sendButton(phone: string, body: string, buttons: unknown, header?: string, footer?: string): Promise<SendResult>;
    sendList(phone: string, body: string, title: string, list: unknown, header?: string, footer?: string): Promise<SendResult>;
    forwardMessage(phone: string, messageId: string): Promise<SendResult>;
    deleteMessage(phone: string, messageId: string): Promise<ReplierResponse>;
    sendSeen(phone: string): Promise<ReplierResponse>;
    messages(phone: string, limit?: number, lastMessageNumber?: number): Promise<ReplierResponse>;
    showMessagesQueue(): Promise<ReplierResponse>;
    clearMessagesQueue(): Promise<ReplierResponse>;
    showActionsQueue(): Promise<ReplierResponse>;
    clearActionsQueue(): Promise<ReplierResponse>;
    dialogs(): Promise<ReplierResponse>;
    chats(): Promise<ReplierResponse>;
    contacts(): Promise<ReplierResponse>;
    createGroup(groupName: string, phones: string | string[]): Promise<ReplierResponse>;
    leaveGroup(groupId: string): Promise<ReplierResponse>;
    addGroupParticipant(groupId: string, phones: string | string[]): Promise<ReplierResponse>;
    removeGroupParticipant(groupId: string, phones: string | string[]): Promise<ReplierResponse>;
    promoteGroupParticipant(groupId: string, phones: string | string[]): Promise<ReplierResponse>;
    demoteGroupParticipant(groupId: string, phones: string | string[]): Promise<ReplierResponse>;
    createChannel(name: string, description?: string, picture?: string): Promise<ReplierResponse>;
    followChannel(channelId: string): Promise<ReplierResponse>;
    unfollowChannel(channelId: string): Promise<ReplierResponse>;
    channelInfo(channelId: string): Promise<ReplierResponse>;
    setWebhook(webhookUrl: string): Promise<ReplierResponse>;
    getWebhookStatus(): Promise<ReplierResponse>;
    getBanSettings(): Promise<ReplierResponse>;
    botSettings(): Promise<ReplierResponse>;
    getBotSettings(): Promise<ReplierResponse>;
    listInstances(): Promise<ReplierResponse>;
    newInstance(packageId: number, voucher?: string): Promise<ReplierResponse>;
    renewInstance(instanceId: string | number, packageId: number, voucher?: string): Promise<ReplierResponse>;
}
export default Replier;
