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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TonkeeperProvider = void 0;
const sdk_1 = __importDefault(require("@tonconnect/sdk"));
const ton_1 = require("ton");
const internal_utils_1 = require("./internal_utils");
class TonkeeperProvider {
    constructor(config) {
        this.connector = new sdk_1.default({ manifestUrl: config.manifestUrl, storage: config.storage });
        this.config = config;
    }
    disconnect() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.connector.disconnect();
        });
    }
    isInjected(walletInfo) {
        return "jsBridgeKey" in walletInfo && "injected" in walletInfo && walletInfo.injected;
    }
    isRemote(walletInfo) {
        return "universalLink" in walletInfo && "bridgeUrl" in walletInfo;
    }
    connect() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.walletInfo) {
                const wallets = yield this.connector.getWallets();
                this.walletInfo = wallets.find((w) => w.name === "Tonkeeper");
                if (!this.walletInfo) {
                    throw new Error("Tonkeeper wallet not found");
                }
            }
            const getWalletP = new Promise((resolve, reject) => {
                this.connector.onStatusChange((wallet) => {
                    try {
                        if (wallet) {
                            resolve({
                                address: ton_1.Address.parse(wallet.account.address).toFriendly(),
                            });
                        }
                        else {
                            reject("No wallet received");
                        }
                    }
                    catch (e) {
                        reject(e);
                    }
                }, reject);
            });
            yield this.connector.restoreConnection();
            if (!this.connector.connected) {
                if (this.isInjected(this.walletInfo)) {
                    this.connector.connect({ jsBridgeKey: this.walletInfo.jsBridgeKey });
                }
                else if (this.isRemote(this.walletInfo)) {
                    const sessionLink = this.connector.connect({
                        universalLink: this.walletInfo.universalLink,
                        bridgeUrl: this.walletInfo.bridgeUrl,
                    });
                    this.config.onSessionLinkReady(sessionLink);
                }
                else {
                    throw new Error("Unknown wallet type");
                }
            }
            return getWalletP;
        });
    }
    requestTransaction(request, onSuccess) {
        return __awaiter(this, void 0, void 0, function* () {
            let msg = request.message;
            if (msg instanceof ton_1.Cell) {
                msg = msg.toBoc().toString("base64");
            }
            yield this.connector.sendTransaction({
                validUntil: Date.now() + 5 * 60 * 1000,
                messages: [
                    {
                        address: request.to.toFriendly(),
                        amount: request.value.toString(),
                        stateInit: request.stateInit
                            ? (0, internal_utils_1.stateInitToBuffer)(request.stateInit).toString("base64")
                            : undefined,
                        payload: msg,
                    },
                ],
            });
            onSuccess === null || onSuccess === void 0 ? void 0 : onSuccess();
        });
    }
}
exports.TonkeeperProvider = TonkeeperProvider;
