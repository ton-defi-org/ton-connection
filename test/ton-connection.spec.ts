import chai, { expect } from "chai";
import chaiBN from "chai-bn";
import BN from "bn.js";
import { Address, Cell, Wallet } from "ton";
import { TonWalletProvider, TransactionDetails, TonConnection } from "../lib";
import * as sinon from "ts-sinon";
import sinonChai from "sinon-chai";
import { randomAddress } from "./utils";
import exp from "constants";
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
    const con = new TonConnection(new StubProvider(), "some_api");
    const w = await con.connect();
    expect(w).to.deep.eq(walletStub);
  });

  it("Parses get methods", async () => {
    const con = new TonConnection(new StubProvider(), "some_api");
    const w = await con.connect();
    expect(w).to.deep.eq(walletStub);
    sinon.default.replace(con, "_tonClient", sinon.stubObject(con._tonClient));

    const myCellThing = new Cell();
    myCellThing.bits.writeAddress(randomAddress("0"));

    con._tonClient.callGetMethod.resolves({
      stack: [
        ["cell", { bytes: myCellThing.toBoc().toString("base64") }],
        ["num", "0x1999"],
      ],
    });

    const parsedResult = await con.makeGetCall(Address.parse("0:0"), "meth", [new Cell()], (d) => {
      return {
        address: (d[0] as Cell).beginParse().readAddress(),
        num: d[1] as BN,
      };
    });

    expect(parsedResult.address?.toFriendly()).to.equal(randomAddress("0").toFriendly());
    expect(parsedResult.num).to.bignumber.equal(new BN("1999", "hex"));
  });
});
