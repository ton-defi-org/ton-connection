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
exports.TonhubProvider = void 0;
/* eslint-disable @typescript-eslint/no-non-null-assertion */
const ton_1 = require("ton");
const ton_x_1 = require("ton-x");
const internal_utils_1 = require("./internal_utils");
class TonhubProvider {
    constructor(config) {
        var _a, _b;
        this.TONHUB_TIMEOUT = 5 * 60 * 1000;
        this.ITEM_KEY_SUFFIX = "ton_hub_sess";
        this._tonhubConnector = new ton_x_1.TonhubConnector({
            network: config.isSandbox ? "sandbox" : "mainnet",
        });
        this._config = config;
        const existingSession = (_a = this._config.persistenceProvider) === null || _a === void 0 ? void 0 : _a.getItem(this.toItemKey());
        try {
            this._session = existingSession && JSON.parse(existingSession);
        }
        catch (e) {
            (_b = this._config.persistenceProvider) === null || _b === void 0 ? void 0 : _b.removeItem(this.toItemKey());
        }
    }
    toItemKey() {
        return `${this._config.isSandbox ? "sandbox" : "mainnet"}_${this.ITEM_KEY_SUFFIX}`;
    }
    disconnect() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            (_a = this._config.persistenceProvider) === null || _a === void 0 ? void 0 : _a.removeItem(this.toItemKey());
        });
    }
    _setSession(session) {
        var _a;
        this._session = session;
        (_a = this._config.persistenceProvider) === null || _a === void 0 ? void 0 : _a.setItem(this.toItemKey(), JSON.stringify(session));
    }
    _clearSession() {
        var _a;
        this._session = undefined;
        (_a = this._config.persistenceProvider) === null || _a === void 0 ? void 0 : _a.removeItem(this.toItemKey());
    }
    _deepLinkTransaction(request, initCell) {
        const deepLinkPrefix = this._config.isSandbox ? "ton-test" : "ton";
        let payload, text;
        if (request.message instanceof ton_1.Cell) {
            payload = request.message.toBoc();
        }
        else if (request.message) {
            text = request.message;
        }
        function encodeBase64URL(buffer) {
            const ENC = {
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
        this._config.onTransactionLinkReady(link);
    }
    _tonHubConnectorTransaction(request, state, initCell, onSuccess) {
        return __awaiter(this, void 0, void 0, function* () {
            let payload, text;
            if (request.message instanceof ton_1.Cell) {
                payload = request.message.toBoc().toString("base64");
            }
            else if (request.message) {
                text = request.message;
            }
            const response = yield this._tonhubConnector.requestTransaction({
                seed: this._session.seed,
                appPublicKey: state.wallet.appPublicKey,
                to: request.to.toFriendly(),
                value: request.value.toString(),
                timeout: 5 * 60 * 1000,
                stateInit: initCell === null || initCell === void 0 ? void 0 : initCell.toString("base64"),
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
        });
    }
    requestTransaction(request, onSuccess) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this._session)
                throw new Error("No session!");
            const state = yield this._tonhubConnector.getSessionState(this._session.id);
            if (state.state !== "ready") {
                this._clearSession();
                throw new Error("State is not ready");
            }
            let initCellBoc;
            if (request.stateInit) {
                initCellBoc = (0, internal_utils_1.stateInitToBuffer)(request.stateInit);
            }
            if (this._config.onTransactionLinkReady) {
                this._deepLinkTransaction(request, initCellBoc);
            }
            else {
                yield this._tonHubConnectorTransaction(request, state, initCellBoc, onSuccess);
            }
        });
    }
    connect() {
        return __awaiter(this, void 0, void 0, function* () {
            const { location } = document; // TODO consider non-web if makes sense
            let session;
            if (!this._session) {
                session = yield this._tonhubConnector.createNewSession({
                    name: `${location.protocol}//${location.host}`,
                    url: `${location.protocol}//${location.host}`,
                });
                this._config.onSessionLinkReady(session.link);
            }
            else {
                session = this._session;
            }
            const state = yield this._tonhubConnector.awaitSessionReady(session.id, this.TONHUB_TIMEOUT, 0);
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
        });
    }
}
exports.TonhubProvider = TonhubProvider;
