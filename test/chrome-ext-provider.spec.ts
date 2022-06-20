import chai, { expect } from "chai";
import chaiBN from "chai-bn";
import BN from "bn.js";
import * as sinon from "ts-sinon";
import sinonChai from "sinon-chai";
import { Address, Cell, StateInit, toNano } from "ton";
import { stat } from "fs";
import { ChromeExtensionWalletProvider } from "../lib/chrome-ext-provider";
import { stateInitMessageCases } from "./cases";
chai.use(chaiBN(BN));
chai.use(sinonChai);

const walletStub = {
  address: "test",
  publicKey: "pk",
  walletVersion: "1",
};

describe("Chrome Extension Provider", () => {
  it("connects", async () => {
    global["window"] = {};
    const chromeExtProvider = new ChromeExtensionWalletProvider();
    const tonWalletClientStub = sinon.stubObject(chromeExtProvider._tonWalletClient);
    sinon.default.replace(chromeExtProvider, "_tonWalletClient", tonWalletClientStub);
    tonWalletClientStub.ready.resolves();
    tonWalletClientStub.requestWallets.resolves([walletStub]);
    const wallet = await chromeExtProvider.connect();
    expect(wallet).to.equal(walletStub);
  });

  stateInitMessageCases.forEach(([tst, stateInit, cell, _, expectedStateInit, expectedMessage]) => {
    it("requests tx: " + tst, async () => {
      global["window"] = {};
      const chromeExtProvider = new ChromeExtensionWalletProvider();
      const tonWalletClientStub = sinon.stubObject(chromeExtProvider._tonWalletClient);
      sinon.default.replace(chromeExtProvider, "_tonWalletClient", tonWalletClientStub);
      tonWalletClientStub.ready.resolves();
      tonWalletClientStub.requestWallets.resolves([walletStub]);
      chromeExtProvider.requestTransaction({
        to: Address.parse("0:0"),
        value: toNano(0.1),
        stateInit: stateInit,
        message: cell,
      });
      // expect(tonWalletClientStub.sendTransaction.getCall(0).args[0]).to.equal("");
      const { stateInit: actualStateInit, data: actualMessage } =
        tonWalletClientStub.sendTransaction.getCall(0).args[0];

      expect(actualStateInit).to.equal(expectedStateInit);
      expect(actualMessage).to.equal(expectedMessage);
    });
  });
});
