import TonConnect, {
  IStorage,
  WalletInfo,
  WalletInfoInjected,
  WalletInfoRemote,
} from "@tonconnect/sdk";
import { Address, Cell } from "ton";
import { stateInitToBuffer } from "./internal_utils";
import { TonWalletProvider, TransactionDetails, Wallet } from "./ton-connection";

export type TonkeeperProviderConfig = {
  manifestUrl: string;
  onSessionLinkReady: (link: string) => void;
  storage?: IStorage;
};

export class TonkeeperProvider implements TonWalletProvider {
  connector: TonConnect;
  config: TonkeeperProviderConfig;
  walletInfo?: WalletInfo;

  constructor(config: TonkeeperProviderConfig) {
    this.connector = new TonConnect({ manifestUrl: config.manifestUrl, storage: config.storage });
    this.config = config;
  }

  async disconnect(): Promise<void> {
    await this.connector.disconnect();
  }

  private isInjected(walletInfo: WalletInfo): walletInfo is WalletInfoInjected {
    return "jsBridgeKey" in walletInfo && "injected" in walletInfo && walletInfo.injected;
  }

  private isRemote(walletInfo: WalletInfo): walletInfo is WalletInfoRemote {
    return "universalLink" in walletInfo && "bridgeUrl" in walletInfo;
  }

  async connect(): Promise<Wallet> {
    if (!this.walletInfo) {
      const wallets = await this.connector.getWallets();
      this.walletInfo = wallets.find((w) => w.name === "Tonkeeper");
      if (!this.walletInfo) {
        throw new Error("Tonkeeper wallet not found");
      }
    }
    const getWalletP = new Promise<Wallet>((resolve, reject) => {
      this.connector.onStatusChange((wallet) => {
        try {
          if (wallet) {
            resolve({
              address: Address.parse(wallet.account.address).toFriendly(),
            });
          } else {
            reject("No wallet received");
          }
        } catch (e) {
          reject(e);
        }
      }, reject);
    });

    await this.connector.restoreConnection();

    if (!this.connector.connected) {
      if (this.isInjected(this.walletInfo)) {
        this.connector.connect({ jsBridgeKey: this.walletInfo.jsBridgeKey });
      } else if (this.isRemote(this.walletInfo)) {
        const sessionLink = this.connector.connect({
          universalLink: this.walletInfo.universalLink,
          bridgeUrl: this.walletInfo.bridgeUrl,
        });
        this.config.onSessionLinkReady(sessionLink);
      } else {
        throw new Error("Unknown wallet type");
      }
    }

    return getWalletP;
  }

  async requestTransaction(
    request: TransactionDetails,
    onSuccess?: (() => void) | undefined
  ): Promise<void> {
    let msg = request.message;

    if (msg instanceof Cell) {
      msg = msg.toBoc().toString("base64");
    }

    await this.connector.sendTransaction({
      validUntil: Date.now() + 5 * 60 * 1000,
      messages: [
        {
          address: request.to.toFriendly(),
          amount: request.value.toString(),
          stateInit: request.stateInit
            ? stateInitToBuffer(request.stateInit).toString("base64")
            : undefined,
          payload: msg,
        },
      ],
    });

    onSuccess?.();
  }
}
