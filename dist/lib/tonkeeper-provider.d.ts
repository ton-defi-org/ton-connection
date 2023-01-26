import TonConnect, { IStorage, WalletInfo } from "@tonconnect/sdk";
import { TonWalletProvider, TransactionDetails, Wallet } from "./ton-connection";
export declare type TonkeeperProviderConfig = {
    manifestUrl: string;
    onSessionLinkReady: (link: string) => void;
    storage?: IStorage;
};
export declare class TonkeeperProvider implements TonWalletProvider {
    connector: TonConnect;
    config: TonkeeperProviderConfig;
    walletInfo?: WalletInfo;
    constructor(config: TonkeeperProviderConfig);
    disconnect(): Promise<void>;
    private isInjected;
    private isRemote;
    connect(): Promise<Wallet>;
    requestTransaction(request: TransactionDetails, onSuccess?: (() => void) | undefined): Promise<void>;
}
