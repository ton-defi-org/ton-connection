import { Address, Cell, StateInit } from "ton";
import BN from "bn.js";

export interface Wallet {
  address: string;
  publicKey: string;
  walletVersion: string;
}

export interface TonWalletProvider {
  connect(): Promise<Wallet>;
  requestTransaction(request: TransactionDetails, onSuccess?: () => void): Promise<void>;
}

export interface TransactionDetails {
  to: Address;
  value: BN;
  stateInit?: StateInit;
  message?: Cell;
}

export class TonConnection {
  private _provider: TonWalletProvider;

  constructor(provider: TonWalletProvider) {
    this._provider = provider;
  }

  requestTransaction(request: TransactionDetails, onSuccess?: () => void): Promise<void> {
    if (!this._provider) throw new Error("Cannot request transactions without a wallet provider");
    return this._provider.requestTransaction(request, onSuccess);
  }
  connect(): Promise<Wallet> {
    if (!this._provider) throw new Error("Cannot connect without a wallet provider");
    return this._provider.connect();
  }
}
