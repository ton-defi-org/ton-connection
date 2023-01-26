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
exports.OpenMaskWalletProvider = void 0;
const ton_1 = require("ton");
const TON_WALLET_EXTENSION_URL = "https://chrome.google.com/webstore/detail/openmask/penjlddjkjgpnkllboccdgccekpkcbin";
class OpenMaskClient {
    constructor(window) {
        this.window = window;
    }
    get ton() {
        return this.window.ton;
    }
    get isAvailable() {
        var _a;
        return !!((_a = this.ton) === null || _a === void 0 ? void 0 : _a.isOpenMask);
    }
    requestWallets() {
        return this.ton.send("ton_requestWallets");
    }
    sendTransaction(options) {
        return this.ton.send("ton_sendTransaction", [options]);
    }
    deployContract(options) {
        return this.ton.send("ton_deployContract", [options]);
    }
    confirmSeqno(seqNo) {
        return this.ton.send("ton_confirmWalletSeqNo", [seqNo]);
    }
}
class OpenMaskWalletProvider {
    constructor() {
        this._tonWalletClient = new OpenMaskClient(window);
    }
    disconnect() {
        return Promise.resolve();
    }
    connect() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!this._tonWalletClient.isAvailable) {
                    throw new Error("TON Wallet is not available.");
                }
                const [wallet] = yield this._tonWalletClient.requestWallets();
                if (!wallet) {
                    throw new Error("TON Wallet is not configured.");
                }
                return wallet;
            }
            catch (error) {
                (_a = window.open) === null || _a === void 0 ? void 0 : _a.call(window, TON_WALLET_EXTENSION_URL, "_blank");
                throw error;
            }
        });
    }
    requestTransaction(request, onSuccess) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            let payload, text;
            if (request.message instanceof ton_1.Cell) {
                payload = request.message.toBoc().toString("hex");
            }
            else if (request.message) {
                text = request.message;
            }
            try {
                if (!this._tonWalletClient.isAvailable) {
                    throw new Error("TON Wallet is not available.");
                }
                let seqNo;
                const { stateInit } = request;
                if (stateInit) {
                    const { walletSeqNo } = yield this._tonWalletClient.deployContract({
                        initCodeCell: (_a = stateInit.code) === null || _a === void 0 ? void 0 : _a.toBoc().toString("hex"),
                        initDataCell: (_b = stateInit.data) === null || _b === void 0 ? void 0 : _b.toBoc().toString("hex"),
                        initMessageCell: payload !== null && payload !== void 0 ? payload : text,
                        amount: request.value.toString(),
                    });
                    seqNo = walletSeqNo;
                }
                else {
                    seqNo = yield this._tonWalletClient.sendTransaction({
                        to: request.to.toFriendly(),
                        value: request.value.toString(),
                        dataType: text ? "text" : "hex",
                        data: text !== null && text !== void 0 ? text : payload,
                    });
                }
                yield this._tonWalletClient.confirmSeqno(seqNo);
                onSuccess && onSuccess();
            }
            catch (error) {
                throw new Error(error.message);
            }
        });
    }
}
exports.OpenMaskWalletProvider = OpenMaskWalletProvider;
