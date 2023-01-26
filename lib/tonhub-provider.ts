/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Cell, ConfigStore } from "ton";
import { TonhubConnector, TonhubCreatedSession, TonhubSessionStateReady } from "ton-x";
import { TonWalletProvider, TransactionDetails, Wallet } from "./ton-connection";
import { stateInitToBuffer } from "./internal_utils";

export type TonHubProviderConfig = {
  isSandbox?: boolean | undefined;
  onSessionLinkReady: (link: string) => void;
  persistenceProvider?: PersistenceProvider;
  onTransactionLinkReady?: (link: string) => void;
};

export interface PersistenceProvider {
  setItem(key: string, value: string): void;
  getItem(key: string): string | null;
  removeItem(key: string): void;
}

export class TonhubProvider implements TonWalletProvider {
  private TONHUB_TIMEOUT = 5 * 60 * 1000;
  private ITEM_KEY_SUFFIX = "ton_hub_sess";

  private _tonhubConnector: TonhubConnector;
  private _config: TonHubProviderConfig;
  private _session?: TonhubCreatedSession;

  private toItemKey(): string {
    return `${this._config.isSandbox ? "sandbox" : "mainnet"}_${this.ITEM_KEY_SUFFIX}`;
  }

  constructor(config: TonHubProviderConfig) {
    this._tonhubConnector = new TonhubConnector({
      network: config.isSandbox ? "sandbox" : "mainnet",
    });
    this._config = config;
    const existingSession = this._config.persistenceProvider?.getItem(this.toItemKey());
    try {
      this._session = existingSession && JSON.parse(existingSession);
    } catch (e) {
      this._config.persistenceProvider?.removeItem(this.toItemKey());
    }
  }

  async disconnect(): Promise<void> {
    this._config.persistenceProvider?.removeItem(this.toItemKey());
  }

  private _setSession(session: TonhubCreatedSession) {
    this._session = session;
    this._config.persistenceProvider?.setItem(this.toItemKey(), JSON.stringify(session));
  }

  private _clearSession() {
    this._session = undefined;
    this._config.persistenceProvider?.removeItem(this.toItemKey());
  }

  private _deepLinkTransaction(request: TransactionDetails, initCell?: Buffer) {
    const deepLinkPrefix = this._config.isSandbox ? "ton-test" : "ton";

    let payload, text;

    if (request.message instanceof Cell) {
      payload = request.message.toBoc();
    } else if (request.message) {
      text = request.message;
    }

    function encodeBase64URL(buffer: Buffer): string {
      const ENC: any = {
        "+": "-",
        "/": "_",
        "=": ".",
      };
      return buffer.toString("base64").replace(/[+/=]/g, (m) => {
        return ENC[m];
      });
    }

    let link = `${deepLinkPrefix}://transfer/${request.to.toFriendly()}?amount=${request.value}`;

    if (initCell) {
      link = `${link}&init=${encodeBase64URL(initCell)}`;
    }

    if (payload) {
      link = `${link}&bin=${encodeBase64URL(payload)}`;
    }
    
    if (text) {
      link = `${link}&text=${encodeBase64URL(Buffer.from(text))}`;
    }

    this._config.onTransactionLinkReady!(link);
  }

  private async _tonHubConnectorTransaction(
    request: TransactionDetails,
    state: TonhubSessionStateReady,
    initCell?: Buffer,
    onSuccess?: () => void
  ) {
    let payload: string | undefined, text: string | undefined;

    if (request.message instanceof Cell) {
      payload = request.message.toBoc().toString("base64");
    } else if (request.message) {
      text = request.message;
    }

    const response = await this._tonhubConnector.requestTransaction({
      seed: this._session!.seed,
      appPublicKey: state.wallet.appPublicKey,
      to: request.to.toFriendly(),
      value: request.value.toString(),
      timeout: 5 * 60 * 1000,
      stateInit: initCell?.toString("base64"),
      text: text,
      payload: payload,
    });

    if (response.type === "rejected") {
      throw new Error("Transaction was rejected.");
    }

    if (response.type === "expired") {
      throw new Error("Transaction was expired.");
    }

    if (response.type === "invalid_session") {
      this._clearSession();
      throw new Error("Something went wrong. Refresh the page and try again.");
    }

    if (response.type === "success") {
      onSuccess && onSuccess();
      // Handle successful transaction
      // const externalMessage = response.response; // Signed external message that was sent to the network
    }
  }

  async requestTransaction(request: TransactionDetails, onSuccess?: () => void): Promise<void> {
    if (!this._session) throw new Error("No session!");

    const state = await this._tonhubConnector.getSessionState(this._session.id);

    if (state.state !== "ready") {
      this._clearSession();
      throw new Error("State is not ready");
    }

    let initCellBoc: Buffer | undefined;

    if (request.stateInit) {
      initCellBoc = stateInitToBuffer(request.stateInit);
    }

    if (this._config.onTransactionLinkReady) {
      this._deepLinkTransaction(request, initCellBoc);
    } else {
      await this._tonHubConnectorTransaction(request, state, initCellBoc, onSuccess);
    }
  }

  async connect(): Promise<Wallet> {
    const { location } = document; // TODO consider non-web if makes sense
    let session: TonhubCreatedSession;

    if (!this._session) {
      session = await this._tonhubConnector.createNewSession({
        name: `${location.protocol}//${location.host}`,
        url: `${location.protocol}//${location.host}`,
      });

      this._config.onSessionLinkReady(session.link);
    } else {
      session = this._session;
    }

    const state = await this._tonhubConnector.awaitSessionReady(session.id, this.TONHUB_TIMEOUT, 0);

    if (state.state === "revoked") {
      this._clearSession();
      throw new Error("Connection was cancelled.");
    }

    if (state.state === "expired") {
      this._clearSession();
      throw new Error("Connection was not confirmed.");
    }

    session && this._setSession(session);

    return {
      address: state.wallet.address,
    };
  }
}
