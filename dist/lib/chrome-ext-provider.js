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
exports.ChromeExtensionWalletProvider = exports.delay = void 0;
const internal_utils_1 = require("./internal_utils");
const ton_1 = require("ton");
function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
exports.delay = delay;
// TODO: refactor this redundant class
const TON_WALLET_EXTENSION_URL = "https://chrome.google.com/webstore/detail/ton-wallet/nphplpgoakhhjchkkhmiggakijnkhfnd";
class TonWalletClient {
    constructor(window) {
        this.window = window;
    }
    get ton() {
        return this.window.ton;
    }
    get isAvailable() {
        var _a;
        return !!((_a = this.ton) === null || _a === void 0 ? void 0 : _a.isTonWallet);
    }
    ready(timeout = 5000) {
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
    requestWallets() {
        return this.ton.send("ton_requestWallets");
    }
    watchAccounts(callback) {
        this.ton.on("ton_requestAccounts", callback);
    }
    sign(hexData) {
        return this.ton.send("ton_rawSign", [{ data: hexData }]);
    }
    sendTransaction(options) {
        return this.ton.send("ton_sendTransaction", [options]);
    }
}
if (!globalThis["window"]) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    globalThis["window"] = null;
}
class ChromeExtensionWalletProvider {
    constructor() {
        this._tonWalletClient = new TonWalletClient(window);
    }
    disconnect() {
        return Promise.resolve();
    }
    connect() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this._tonWalletClient.ready();
                const [[wallet]] = yield Promise.all([this._tonWalletClient.requestWallets(), delay(150)]);
                if (!wallet) {
                    throw new Error("TON Wallet is not configured.");
                }
                return wallet;
            }
            catch (error) {
                window.open(TON_WALLET_EXTENSION_URL, "_blank");
                throw error;
            }
        });
    }
    requestTransaction(request, onSuccess) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let payload, text;
                if (request.message instanceof ton_1.Cell) {
                    payload = request.message.toBoc().toString("base64");
                }
                else if (request.message) {
                    text = request.message;
                }
                const res = yield this._tonWalletClient.sendTransaction({
                    to: request.to.toFriendly(),
                    value: request.value.toString(),
                    dataType: text ? "text" : "boc",
                    data: text !== null && text !== void 0 ? text : payload,
                    stateInit: request.stateInit
                        ? (0, internal_utils_1.stateInitToBuffer)(request.stateInit).toString("base64")
                        : undefined,
                });
                if (!res) {
                    throw new Error("Something went wrong");
                }
                else {
                    onSuccess && onSuccess();
                }
            }
            catch (error) {
                throw new Error(error.message);
            }
        });
    }
}
exports.ChromeExtensionWalletProvider = ChromeExtensionWalletProvider;
