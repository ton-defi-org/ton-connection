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
  message?: Cell;
}

export class TonConnection {
  private _provider: TonWalletProvider | null = null;

  constructor(provider: TonWalletProvider | null = null) {
    this._provider = provider;
  }

  setProvider(provider: TonWalletProvider | null) {
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

  async disconnect(): Promise<void> {
    if (!this._provider) throw new Error("Cannot connect without a wallet provider");
    try {
      await this._provider.disconnect();
    } finally {
      this.setProvider(null);
    }
  }
}
