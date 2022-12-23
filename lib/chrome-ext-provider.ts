import { TonWalletProvider, TransactionDetails, Wallet } from "./ton-connection";
import { stateInitToBuffer } from "./internal_utils";

export function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// TODO: refactor this redundant class

const TON_WALLET_EXTENSION_URL =
  "https://chrome.google.com/webstore/detail/ton-wallet/nphplpgoakhhjchkkhmiggakijnkhfnd";

export interface _TonWindowProvider {
  isTonWallet: boolean;
  isOpenMask: boolean;
  send<T>(method: string, params?: any[]): Promise<T>;
  on(eventName: string, handler: (...data: any[]) => any): void;
}

declare global {
  interface Window {
    ton?: _TonWindowProvider;
  }
}

class TonWalletClient {
  constructor(private readonly window: Window) {}

  private get ton(): _TonWindowProvider | undefined {
    return this.window.ton;
  }

  get isAvailable(): boolean {
    return !!this.ton?.isTonWallet;
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

  watchAccounts(callback: (accounts: string[]) => void): void {
    this.ton!.on("ton_requestAccounts", callback);
  }

  sign(hexData: string): Promise<string> {
    return this.ton!.send("ton_rawSign", [{ data: hexData }]);
  }

  sendTransaction(options: {
    to: string;
    value: string;
    data?: string;
    dataType?: "boc" | "hex" | "base64" | "text";
    stateInit?: string;
  }): Promise<void> {
    return this.ton!.send("ton_sendTransaction", [options]);
  }
}

if (!globalThis["window"]) {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  globalThis["window"] = null;
}

export class ChromeExtensionWalletProvider implements TonWalletProvider {
  private _tonWalletClient = new TonWalletClient(window);

  async connect(): Promise<Wallet> {
    try {
      await this._tonWalletClient.ready();

      const [[wallet]] = await Promise.all([this._tonWalletClient.requestWallets(), delay(150)]);

      if (!wallet) {
        throw new Error("TON Wallet is not configured.");
      }

      return wallet;
    } catch (error) {
      window.open(TON_WALLET_EXTENSION_URL, "_blank");
      throw error;
    }
  }
  async requestTransaction(request: TransactionDetails, onSuccess?: () => void): Promise<void> {
    try {
      const res: any = await this._tonWalletClient.sendTransaction({
        to: request.to.toFriendly(),
        value: request.value.toString(),
        dataType: "boc",
        data: request.message?.toBoc().toString("base64"),
        stateInit: request.stateInit
          ? stateInitToBuffer(request.stateInit).toString("base64")
          : undefined,
      });

      if (!res) {
        throw new Error("Something went wrong");
      } else {
        onSuccess && onSuccess();
      }
    } catch (error: any) {
      throw new Error(error.message);
    }
  }
}
