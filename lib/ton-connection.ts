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

  #parseGetMethodCall(stack: [["num" | "cell", any]]) {
    return stack.map(([type, val]) => {
      switch (type) {
        case "num":
          return new BN(val.replace("0x", ""), "hex");
        case "cell":
          // console.log("Shahar1", val.bytes)
          return Cell.fromBoc(Buffer.from(val.bytes, "base64"))[0];
        default:
          throw new Error("unknown type");
      }
    });
  }

  #prepareParams(params: Cell[] = []) {
    return params.map((p) => {
      if (p instanceof Cell) {
        // TODO what's idx:false
        return ["tvm.Slice", p.toBoc({ idx: false }).toString("base64")];
      }

      throw new Error("unknown type!");
    });
  }

  // TODO support other params than Cell
  async makeGetCall<T>(
    contract: Address,
    method: string,
    params: Cell[],
    parser: (stack: (BN | Cell)[]) => T
  ): Promise<T> {
    const res = await this._tonClient.callGetMethod(contract, method, this.#prepareParams(params));
    return parser(this.#parseGetMethodCall(res.stack));
  }
}
