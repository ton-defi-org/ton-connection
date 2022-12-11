import chai, { expect } from "chai";
import chaiBN from "chai-bn";
import BN from "bn.js";
import * as sinon from "ts-sinon";
import sinonChai from "sinon-chai";
import { Address, Cell, StateInit, toNano } from "ton";
import { stat } from "fs";
import { stateInitMessageCases } from "./cases";
import { zeroAddress } from "./utils";
import { OpenMaskWalletProvider } from "../lib/open-mask-provider";
chai.use(chaiBN(BN));
chai.use(sinonChai);

const walletStub = {
  address: "test",
};

describe("Openmask Provider", () => {
  it("connects", async () => {
    global["window"] = {};
    const openMaskProvider = new OpenMaskWalletProvider();
    const tonWalletClientStub = sinon.stubObject(openMaskProvider._tonWalletClient);
    sinon.default.replace(openMaskProvider, "_tonWalletClient", tonWalletClientStub);
    tonWalletClientStub.ready.resolves();
    tonWalletClientStub.requestWallets.resolves([walletStub]);
    const wallet = await openMaskProvider.connect();
    expect(wallet).to.equal(walletStub);
  });
});
