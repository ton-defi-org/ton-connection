import { Cell, CellMessage, CommonMessageInfo, InternalMessage, SendMode, TonClient } from "ton";
import { WalletV4Contract, WalletV4Source } from "ton-contracts";
import { mnemonicToWalletKey } from "ton-crypto";
import { TonWalletProvider, TransactionDetails, Wallet } from "./ton-connection";
import { stateInitToBuffer } from "./utils";

// TODO - fix wallet version handling
export class MnemonicProvider implements TonWalletProvider {
  private _mnemonic: string[];
  private _tonClient: TonClient;
  constructor(mnemonic: string[], rpcApi: string) {
    this._mnemonic = mnemonic;
    this._tonClient = new TonClient({ endpoint: rpcApi });
  }
  async requestTransaction(request: TransactionDetails, onSuccess?: () => void): Promise<void> {
    const wk = await mnemonicToWalletKey(this._mnemonic);

    const walletContract = WalletV4Contract.create(
      WalletV4Source.create({
        publicKey: wk.publicKey,
        workchain: 0,
      })
    );

    // const walletContract = WalletContract.create(
    //   this._tonClient,
    //   //TODO VER
    //   WalletV4Source.create({
    //     publicKey: wk.publicKey,
    //     workchain: 0,
    //   })
    // );
    const seqno = await walletContract.getSeqNo(this._tonClient);

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

    const transfer = await walletContract.createTransfer({
      walletId: 698983191,
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

    await this._tonClient.sendExternalMessage(walletContract, transfer);
  }
  async connect(): Promise<Wallet> {
    const wk = await mnemonicToWalletKey(this._mnemonic);

    const walletContract = WalletV4Contract.create(
      WalletV4Source.create({
        publicKey: wk.publicKey,
        workchain: 0,
      })
    );

    // const walletContract = WalletContract.create(
    //   this._tonClient,
    //   //TODO VER
    //   WalletV3R2Source.create({
    //     publicKey: wk.publicKey,
    //     workchain: 0,
    //   })
    // );

    return {
      address: walletContract.address.toFriendly(),
      publicKey: wk.publicKey.toString("hex"),
      walletVersion: "PROBLEM",
    };
  }
}
