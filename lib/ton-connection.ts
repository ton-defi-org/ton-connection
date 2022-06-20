import { Address, Cell, StateInit, TonClient } from "ton";
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
  public _tonClient: TonClient; // Future - wrap functionality and make private

  constructor(provider: TonWalletProvider, rpcApi: string) {
    this._provider = provider;
    this._tonClient = new TonClient({ endpoint: rpcApi });
  }

  requestTransaction(request: TransactionDetails, onSuccess?: () => void): Promise<void> {
    return this._provider.requestTransaction(request, onSuccess);
  }
  connect(): Promise<Wallet> {
    return this._provider.connect();
  }
}
