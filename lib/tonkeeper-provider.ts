import TonConnect from "@tonconnect/sdk";
import { Address } from "ton";
import { stateInitToBuffer } from "./internal_utils";
import { TonWalletProvider, TransactionDetails, Wallet } from "./ton-connection";

export type TonkeeperProviderConfig = {
  connectionDetails: { bridgeUrl: string; universalLink: string };
  dappMetaData: Partial<{
    name: string;
    icon: string;
    url: string;
  }>; // TODO - add type
  onSessionLinkReady: (link: string) => void;
};

export class TonkeeperProvider implements TonWalletProvider {
  connector: TonConnect;
  config: TonkeeperProviderConfig;

  // todo should be type DappMetaData, WalletConnectionSourceHTTP
  constructor(config: TonkeeperProviderConfig) {
    this.connector = new TonConnect({ dappMetedata: config.dappMetaData });
    this.config = config;
  }

  connect(): Promise<Wallet> {
    const getWalletP = new Promise<Wallet>((resolve, reject) => {
      this.connector.onStatusChange((wallet) => {
        if (wallet) {
          resolve({
            address: Address.parse(wallet.account.address).toFriendly(),
          });
        } else {
          reject();
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
      valid_until: Date.now() + 5 * 60 * 1000,
      messages: [
        {
          address: request.to.toFriendly(),
          amount: request.value.toString(),
          initState: request.stateInit
            ? stateInitToBuffer(request.stateInit).toString("base64")
            : undefined,
          payload: request.message ? request.message.toBoc().toString("base64") : undefined,
        },
      ],
    });

    onSuccess?.();
  }
}
