import chai, { expect } from "chai";
import chaiBN from "chai-bn";
import BN from "bn.js";
import * as sinon from "ts-sinon";
import sinonChai from "sinon-chai";
import { zeroAddress } from "./utils";
import { TonkeeperProvider } from "../lib/tonkeeper-provider";
import { IStorage } from "@tonconnect/sdk";
chai.use(chaiBN(BN));
chai.use(sinonChai);

class LocalStorageStub implements IStorage {
  storage: Record<string, string> = {};

  async setItem(key: string, value: string): Promise<void> {
    this.storage[key] = value;
  }
  async getItem(key: string): Promise<string | null> {
    return this.storage[key];
  }
  async removeItem(key: string): Promise<void> {
    delete this.storage[key];
  }
}

describe("Tonkeeper Provider", () => {
  it("connects", async () => {
    const tk = new TonkeeperProvider({
      manifestUrl: "manifest.com/1.json",
      onSessionLinkReady: (link: string) => {
        console.log(link);
      },
      storage: new LocalStorageStub(),
    });
    const tonConnectStub = sinon.stubObject(tk.connector);
    sinon.default.replace(tk, "connector", tonConnectStub);
    tonConnectStub.connect.resolves("kk");
    tonConnectStub.onStatusChange.callsFake((func, _) => {
      func({ account: { address: zeroAddress().toFriendly() } });
    });
    tonConnectStub.getWallets.resolves([{ name: "Tonkeeper", bridgeUrl: "-", universalLink: "-" }]);
    const wallet = await tk.connect();
    expect(wallet.address).to.equal(zeroAddress().toFriendly());
  });
});
