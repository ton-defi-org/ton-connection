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

  confirmSeqno(seqNo: number): Promise<void> {
    return this.ton!.send("ton_confirmWalletSeqNo", [seqNo]);
  }
}

export class OpenMaskWalletProvider implements TonWalletProvider {
  private _tonWalletClient = new OpenMaskClient(window);

  async connect(): Promise<Wallet> {
    try {
      if (!this._tonWalletClient.isAvailable) {
        throw new Error("TON Wallet is not available.");
      }
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
      if (!this._tonWalletClient.isAvailable) {
        throw new Error("TON Wallet is not available.");
      }
      let seqNo: number;
      const { stateInit } = request;
      if (stateInit) {
        const { walletSeqNo } = await this._tonWalletClient.deployContract({
          initCodeCell: stateInit.code?.toBoc().toString("hex"),
          initDataCell: stateInit.data?.toBoc().toString("hex"),
          initMessageCell: request.message?.toBoc().toString("hex"),
          amount: request.value.toString(),
        });
        seqNo = walletSeqNo;
      } else {
        seqNo = await this._tonWalletClient.sendTransaction({
          to: request.to.toFriendly(),
          value: request.value.toString(),
          dataType: "hex",
          data: request.message?.toBoc().toString("hex"),
        });
      }

      await this._tonWalletClient.confirmSeqno(seqNo);

      onSuccess && onSuccess();
    } catch (error: any) {
      throw new Error(error.message);
    }
  }
}
