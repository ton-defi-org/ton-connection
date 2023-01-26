import { TonWalletProvider, TransactionDetails, Wallet } from "./ton-connection";
export declare class OpenMaskWalletProvider implements TonWalletProvider {
    private _tonWalletClient;
    disconnect(): Promise<void>;
    connect(): Promise<Wallet>;
    requestTransaction(request: TransactionDetails, onSuccess?: () => void): Promise<void>;
}
