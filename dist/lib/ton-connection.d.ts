import { Address, Cell, StateInit } from "ton";
import BN from "bn.js";
export interface Wallet {
    address: string;
}
export interface TonWalletProvider {
    connect(): Promise<Wallet>;
    requestTransaction(request: TransactionDetails, onSuccess?: () => void): Promise<void>;
    disconnect(): Promise<void>;
}
export interface TransactionDetails {
    to: Address;
    value: BN;
    stateInit?: StateInit;
    message?: Cell | string;
}
export declare class TonConnection {
    private _provider;
    constructor(provider?: TonWalletProvider | null);
    setProvider(provider: TonWalletProvider | null): void;
    requestTransaction(request: TransactionDetails, onSuccess?: () => void): Promise<void>;
    connect(): Promise<Wallet>;
    disconnect(): Promise<void>;
}
