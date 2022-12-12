import TonConnect, { IStorage } from "@tonconnect/sdk";
import { Address } from "ton";
import { stateInitToBuffer } from "./internal_utils";
import { TonWalletProvider, TransactionDetails, Wallet } from "./ton-connection";

export type TonkeeperProviderConfig = {
  connectionDetails: { bridgeUrl: string; universalLink: string };
  manifestUrl: string;
  onSessionLinkReady: (link: string) => void;
  storage?: IStorage;
};

export class TonkeeperProvider implements TonWalletProvider {
  connector: TonConnect;
  config: TonkeeperProviderConfig;

  // todo should be type DappMetaData, WalletConnectionSourceHTTP
  constructor(config: TonkeeperProviderConfig) {
    this.connector = new TonConnect({ manifestUrl: config.manifestUrl, storage: config.storage });
    this.config = config;
  }

  connect(): Promise<Wallet> {
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

    this.connector.restoreConnection();
    if (!this.connector.connected) {
      const sessionLink = this.connector.connect(this.config.connectionDetails);
      this.config.onSessionLinkReady(sessionLink);
    }

    return getWalletP;
  }

  async requestTransaction(
    request: TransactionDetails,
    onSuccess?: (() => void) | undefined
  ): Promise<void> {
    console.log(
      JSON.stringify({
        address: request.to.toFriendly(),
        amount: request.value.toString(),
        initState: request.stateInit
          ? stateInitToBuffer(request.stateInit).toString("base64")
          : undefined,
        payload: request.message ? request.message.toBoc().toString("base64") : undefined,
      })
    );

    await this.connector.sendTransaction({
      validUntil: Date.now() + 5 * 60 * 1000,
      messages: [
        {
          address: request.to.toFriendly(),
          amount: request.value.toString(),
          stateInit: request.stateInit
            ? stateInitToBuffer(request.stateInit).toString("base64")
            : undefined,
          payload: request.message ? request.message.toBoc().toString("base64") : undefined,
        },
      ],
    });

    onSuccess?.();
  }
}
