/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { TonWalletProvider, TransactionDetails, Wallet } from "./ton-connection";
import { _TonWindowProvider } from "./chrome-ext-provider";

const TON_WALLET_EXTENSION_URL =
  "https://chrome.google.com/webstore/detail/openmask/penjlddjkjgpnkllboccdgccekpkcbin";

class OpenMaskClient {
  constructor(private readonly window: Window) {}

  private get ton(): _TonWindowProvider | undefined {
    return this.window.ton;
  }

  get isAvailable(): boolean {
    return !!this.ton?.isOpenMask;
  }

  ready(timeout = 5000): Promise<void> {
    return new Promise((resolve, reject) => {
      const timerId = setInterval(() => {
        if (this.isAvailable) {
          clearInterval(timerId);
          resolve();
        }
      }, 50);

      setTimeout(() => reject(new Error("TON Wallet cannot be initialized")), timeout);
    });
  }

  requestWallets(): Promise<Wallet[]> {
    return this.ton!.send("ton_requestWallets");
  }

  sendTransaction(options: {
    to: string;
    value: string;
    data?: string;
    dataType?: "boc" | "hex" | "base64" | "text";
  }): Promise<any> {
    return this.ton!.send("ton_sendTransaction", [options]);
  }

  deployContract(options: {
    initCodeCell?: string;
    initDataCell?: string;
    initMessageCell?: string;
    amount: string;
  }): Promise<any> {
    return this.ton!.send("ton_deployContract", [options]);
  }
}

export class OpenMaskWalletProvider implements TonWalletProvider {
  private _tonWalletClient = new OpenMaskClient(window);

  async connect(): Promise<Wallet> {
    try {
      await this._tonWalletClient.ready();
      const [wallet] = await this._tonWalletClient.requestWallets();

      if (!wallet) {
        throw new Error("TON Wallet is not configured.");
      }

      return wallet;
    } catch (error) {
      window.open?.(TON_WALLET_EXTENSION_URL, "_blank");
      throw error;
    }
  }

  async requestTransaction(request: TransactionDetails, onSuccess?: () => void): Promise<void> {
    try {
      await this._tonWalletClient.ready();
      const { stateInit } = request;
      if (stateInit) {
        const res = await this._tonWalletClient.deployContract({
          initCodeCell: stateInit.code?.toBoc().toString("hex"),
          initDataCell: stateInit.data?.toBoc().toString("hex"),
          initMessageCell: request.message?.toBoc().toString("hex"),
          amount: request.value.toString(),
        });
        console.log(JSON.stringify(res ?? {}), "Openamask deployContract");
      } else {
        const res = await this._tonWalletClient.sendTransaction({
          to: request.to.toFriendly(),
          value: request.value.toString(),
          dataType: "hex",
          data: request.message?.toBoc().toString("hex"),
        });
        console.log(JSON.stringify(res ?? {}), "Openamask sendtxn");
      }

      // await this.provider!.send("ton_confirmWalletSeqNo", [seqNo]);

      onSuccess && onSuccess();
    } catch (error: any) {
      throw new Error(error.message);
    }
  }
}
