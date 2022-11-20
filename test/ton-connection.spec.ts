import chai, { expect } from "chai";
import chaiBN from "chai-bn";
import BN from "bn.js";
import { beginCell, Cell } from "ton";
import { TonWalletProvider, TransactionDetails, TonConnection, Wallet } from "../lib";
import * as sinon from "ts-sinon";
import sinonChai from "sinon-chai";
import { randomAddress, zeroAddress } from "./utils";
chai.use(chaiBN(BN));
chai.use(sinonChai);

const walletStub = {
  address: "test",
  publicKey: "pk",
  walletVersion: "1",
};

class StubProvider implements TonWalletProvider {
  async connect(): Promise<Wallet> {
    return walletStub;
  }
  async requestTransaction(request: TransactionDetails, onSuccess?: () => void): Promise<void> {
    return;
  }
}

describe("Ton Connection", () => {
  it("Retrieves wallet details from provider", async () => {
    const con = new TonConnection(new StubProvider());
    const w = await con.connect();
    expect(w).to.deep.eq(walletStub);
  });
});
