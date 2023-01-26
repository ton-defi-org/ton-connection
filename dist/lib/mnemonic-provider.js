"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MnemonicProvider = void 0;
const ton_1 = require("ton");
const ton_contracts_1 = require("ton-contracts");
const ton_crypto_1 = require("ton-crypto");
const internal_utils_1 = require("./internal_utils");
// TODO - fix wallet version handling
class MnemonicProvider {
    constructor(mnemonic, tonClient, walletType) {
        this._mnemonic = mnemonic;
        this._tonClient = tonClient;
        this.walletType = walletType;
    }
    disconnect() {
        return Promise.resolve();
    }
    requestTransaction(request, onSuccess) {
        return __awaiter(this, void 0, void 0, function* () {
            const wk = yield (0, ton_crypto_1.mnemonicToWalletKey)(this._mnemonic);
            const ENC = {
                "+": "-",
                "/": "_",
                "=": ".",
            };
            const stateInitMessage = request.stateInit
                ? new ton_1.CellMessage(ton_1.Cell.fromBoc(Buffer.from((0, internal_utils_1.stateInitToBuffer)(request.stateInit)
                    .toString("base64")
                    .replace(/[+/=]/g, (m) => {
                    return ENC[m];
                })))[0])
                : undefined;
            const baseTransfer = (seqno) => ({
                secretKey: wk.secretKey,
                seqno: seqno,
                sendMode: ton_1.SendMode.PAY_GAS_SEPARATLY,
                order: new ton_1.InternalMessage({
                    to: request.to,
                    value: request.value,
                    bounce: true,
                    body: new ton_1.CommonMessageInfo({
                        stateInit: stateInitMessage,
                        body: request.message instanceof ton_1.Cell ? new ton_1.CellMessage(request.message) : null,
                    }),
                }),
            });
            let transfer;
            let walletContract;
            if (this.walletType === "v3r2") {
                walletContract = ton_1.WalletContract.create(this._tonClient, ton_1.WalletV3R2Source.create({
                    publicKey: wk.publicKey,
                    workchain: 0,
                }));
                const seqno = yield walletContract.getSeqNo();
                transfer = walletContract.createTransfer(baseTransfer(seqno));
            }
            else if (this.walletType === "v4r2") {
                walletContract = ton_contracts_1.WalletV4Contract.create(ton_contracts_1.WalletV4Source.create({
                    publicKey: wk.publicKey,
                    workchain: 0,
                }));
                const seqno = yield walletContract.getSeqNo(this._tonClient);
                transfer = yield walletContract.createTransfer(Object.assign({ walletId: 698983191 }, baseTransfer(seqno)));
            }
            else {
                throw new Error("unknown wallet type");
            }
            yield this._tonClient.sendExternalMessage(walletContract, transfer);
        });
    }
    connect() {
        return __awaiter(this, void 0, void 0, function* () {
            const wk = yield (0, ton_crypto_1.mnemonicToWalletKey)(this._mnemonic);
            if (this.walletType === "v4r2") {
                return {
                    address: ton_contracts_1.WalletV4Contract.create(ton_contracts_1.WalletV4Source.create({
                        publicKey: wk.publicKey,
                        workchain: 0,
                    })).address.toFriendly(),
                };
            }
            else if (this.walletType === "v3r2") {
                return {
                    address: ton_1.WalletContract.create(this._tonClient, ton_1.WalletV3R2Source.create({
                        publicKey: wk.publicKey,
                        workchain: 0,
                    })).address.toFriendly(),
                };
            }
            else {
                throw new Error("Unknown wallet");
            }
        });
    }
}
exports.MnemonicProvider = MnemonicProvider;
