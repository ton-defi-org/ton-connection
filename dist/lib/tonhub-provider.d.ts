import { TonWalletProvider, TransactionDetails, Wallet } from "./ton-connection";
export declare type TonHubProviderConfig = {
    isSandbox?: boolean | undefined;
    onSessionLinkReady: (link: string) => void;
    persistenceProvider?: PersistenceProvider;
    onTransactionLinkReady?: (link: string) => void;
};
export interface PersistenceProvider {
    setItem(key: string, value: string): void;
    getItem(key: string): string | null;
    removeItem(key: string): void;
}
export declare class TonhubProvider implements TonWalletProvider {
    private TONHUB_TIMEOUT;
    private ITEM_KEY_SUFFIX;
    private _tonhubConnector;
    private _config;
    private _session?;
    private toItemKey;
    constructor(config: TonHubProviderConfig);
    disconnect(): Promise<void>;
    private _setSession;
    private _clearSession;
    private _deepLinkTransaction;
    private _tonHubConnectorTransaction;
    requestTransaction(request: TransactionDetails, onSuccess?: () => void): Promise<void>;
    connect(): Promise<Wallet>;
}
