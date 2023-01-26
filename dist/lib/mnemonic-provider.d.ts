import { TonClient } from "ton";
import { TonWalletProvider, TransactionDetails, Wallet } from "./ton-connection";
export declare class MnemonicProvider implements TonWalletProvider {
    private _mnemonic;
    private _tonClient;
    walletType: "v3r2" | "v4r2";
    constructor(mnemonic: string[], tonClient: TonClient, walletType: "v3r2" | "v4r2");
    disconnect(): Promise<void>;
    requestTransaction(request: TransactionDetails, onSuccess?: () => void): Promise<void>;
    connect(): Promise<Wallet>;
}
