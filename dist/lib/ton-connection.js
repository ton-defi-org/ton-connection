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
exports.TonConnection = void 0;
class TonConnection {
    constructor(provider = null) {
        this._provider = null;
        this._provider = provider;
    }
    setProvider(provider) {
        this._provider = provider;
    }
    requestTransaction(request, onSuccess) {
        if (!this._provider)
            throw new Error("Cannot request transactions without a wallet provider");
        return this._provider.requestTransaction(request, onSuccess);
    }
    connect() {
        if (!this._provider)
            throw new Error("Cannot connect without a wallet provider");
        return this._provider.connect();
    }
    disconnect() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this._provider)
                throw new Error("Cannot connect without a wallet provider");
            try {
                yield this._provider.disconnect();
            }
            finally {
                this.setProvider(null);
            }
        });
    }
}
exports.TonConnection = TonConnection;
