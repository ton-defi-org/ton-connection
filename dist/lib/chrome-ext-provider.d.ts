import { TonWalletProvider, TransactionDetails, Wallet } from "./ton-connection";
export declare function delay(ms: number): Promise<unknown>;
export interface _TonWindowProvider {
    isTonWallet: boolean;
    isOpenMask: boolean;
    send<T>(method: string, params?: any[]): Promise<T>;
    on(eventName: string, handler: (...data: any[]) => any): void;
}
declare global {
    interface Window {
        ton?: _TonWindowProvider;
    }
}
export declare class ChromeExtensionWalletProvider implements TonWalletProvider {
    private _tonWalletClient;
    disconnect(): Promise<void>;
    connect(): Promise<Wallet>;
    requestTransaction(request: TransactionDetails, onSuccess?: () => void): Promise<void>;
}
