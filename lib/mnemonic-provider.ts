import {
  Cell,
  CellMessage,
  CommonMessageInfo,
  Contract,
  InternalMessage,
  SendMode,
  TonClient,
  WalletContract,
  WalletV3R2Source,
} from "ton";
import { WalletV4Contract, WalletV4Source } from "ton-contracts";
import { mnemonicToWalletKey } from "ton-crypto";
import { TonWalletProvider, TransactionDetails, Wallet } from "./ton-connection";
import { stateInitToBuffer } from "./internal_utils";

// TODO - fix wallet version handling
export class MnemonicProvider implements TonWalletProvider {
  private _mnemonic: string[];
  private _tonClient: TonClient;
  walletType: "v3r2" | "v4r2";

  constructor(mnemonic: string[], rpcApi: string, walletType: "v3r2" | "v4r2") {
    this._mnemonic = mnemonic;
    this._tonClient = new TonClient({ endpoint: rpcApi });
    this.walletType = walletType;
  }

  disconnect(): Promise<void> {
    return Promise.resolve();
  }

  async requestTransaction(request: TransactionDetails, onSuccess?: () => void): Promise<void> {
    const wk = await mnemonicToWalletKey(this._mnemonic);

    const ENC: any = {
      "+": "-",
      "/": "_",
      "=": ".",
    };

    const stateInitMessage = request.stateInit
      ? new CellMessage(
          Cell.fromBoc(
            Buffer.from(
              stateInitToBuffer(request.stateInit)
                .toString("base64")
                .replace(/[+/=]/g, (m) => {
                  return ENC[m];
                })
            )
          )[0]
        )
      : undefined;

    const baseTransfer = (seqno: number) => ({
      secretKey: wk.secretKey,
      seqno: seqno,
      sendMode: SendMode.PAY_GAS_SEPARATLY, //+ SendMode.IGNORE_ERRORS,
      order: new InternalMessage({
        to: request.to,
        value: request.value,
        bounce: true,
        body: new CommonMessageInfo({
          stateInit: stateInitMessage,
          body: request.message && new CellMessage(request.message),
        }),
      }),
    });

    let transfer: Cell;
    let walletContract: Contract;

    if (this.walletType === "v3r2") {
      walletContract = WalletContract.create(
        this._tonClient,
        WalletV3R2Source.create({
          publicKey: wk.publicKey,
          workchain: 0,
        })
      );

      const seqno = await (walletContract as WalletContract).getSeqNo();
      transfer = (walletContract as WalletContract).createTransfer(baseTransfer(seqno));
    } else if (this.walletType === "v4r2") {
      walletContract = WalletV4Contract.create(
        WalletV4Source.create({
          publicKey: wk.publicKey,
          workchain: 0,
        })
      );
      const seqno = await (walletContract as WalletV4Contract).getSeqNo(this._tonClient);
      transfer = await (walletContract as WalletV4Contract).createTransfer({
        walletId: 698983191,
        ...baseTransfer(seqno),
      });
    } else {
      throw new Error("unknown wallet type");
    }

    await this._tonClient.sendExternalMessage(walletContract, transfer);
  }

  async connect(): Promise<Wallet> {
    const wk = await mnemonicToWalletKey(this._mnemonic);

    if (this.walletType === "v4r2") {
      return {
        address: WalletV4Contract.create(
          WalletV4Source.create({
            publicKey: wk.publicKey,
            workchain: 0,
          })
        ).address.toFriendly(),
      };
    } else if (this.walletType === "v3r2") {
      return {
        address: WalletContract.create(
          this._tonClient,
          WalletV3R2Source.create({
            publicKey: wk.publicKey,
            workchain: 0,
          })
        ).address.toFriendly(),
      };
    } else {
      throw new Error("Unknown wallet");
    }
  }
}
