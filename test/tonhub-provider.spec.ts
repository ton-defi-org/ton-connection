import chai, { expect } from "chai";
import chaiBN from "chai-bn";
import BN from "bn.js";
import { TonhubConnector } from "ton-x";
import * as sinon from "ts-sinon";
import { TonhubProvider, PersistenceProvider } from "../lib/tonhub-provider";
import sinonChai from "sinon-chai";
import { Address, Cell, StateInit, toNano } from "ton";
import { stat } from "fs";
import { stateInitMessageCases } from "./cases";
import { zeroAddress } from "./utils";
chai.use(chaiBN(BN));
chai.use(sinonChai);

const walletStub = {
  address: "test",
  publicKey: "pk",
  walletVersion: "1",
};

describe("Tonhub Provider", () => {
  const tcStub = sinon.stubConstructor(TonhubConnector);
  tcStub.awaitSessionReady.resolves({
    state: "ready",
    wallet: { walletConfig: "pk=3" },
  });
  tcStub.getSessionState.resolves({ state: "ready" });
  tcStub.createNewSession.resolves({ link: "" });

  [
    { key: "mainnet_ton_hub_sess", isSandbox: false },
    { key: "sandbox_ton_hub_sess", isSandbox: true },
  ].forEach(({ key, isSandbox }) => {
    it(`Fetches an env-specific key for ${isSandbox ? "sandbox" : "mainnet"}`, async () => {
      const persistenceProvider = {
        getItem: sinon.default.spy((key: string): string | null => {
          return null;
        }),
        removeItem: (key: string) => {
          /*Empty*/
        },
        setItem: (key: string, value: string) => {
          /*Empty*/
        },
      };

      const prov = new TonhubProvider({
        onSessionLinkReady: (l) => {},
        onTransactionLinkReady: () => {},
        persistenceProvider,
        isSandbox,
      });

      expect(persistenceProvider.getItem).to.have.been.calledOnceWith(key);
    });
  });

  it("Generates deep link for transaction if callback is provided", async () => {
    const prov = new TonhubProvider({
      onSessionLinkReady: (l) => {},
      onTransactionLinkReady: () => {},
    });
    sinon.default.replace(prov, "_tonhubConnector", tcStub);

    const deepLinkStub = sinon.default.stub();
    const tonConnectStub = sinon.default.stub();
    sinon.default.replace(prov, "_deepLinkTransaction", deepLinkStub);
    sinon.default.replace(prov, "_tonHubConnectorTransaction", tonConnectStub);
    global["document"] = { location: {} };

    await prov.connect();
    await prov.requestTransaction({});

    expect(deepLinkStub).to.have.been.calledOnce;
    expect(tonConnectStub).to.not.have.been.called;
  });

  it("Calls tonhub connection if deeplink callback is not provided", async () => {
    const prov = new TonhubProvider({
      onSessionLinkReady: (l) => {},
    });
    sinon.default.replace(prov, "_tonhubConnector", tcStub);

    const deepLinkStub = sinon.default.stub();
    const tonConnectStub = sinon.default.stub();
    sinon.default.replace(prov, "_deepLinkTransaction", deepLinkStub);
    sinon.default.replace(prov, "_tonHubConnectorTransaction", tonConnectStub);
    global["document"] = { location: {} };

    await prov.connect();
    await prov.requestTransaction({});

    expect(deepLinkStub).to.not.have.been.called;
    expect(tonConnectStub).to.have.been.calledOnce;
  });

  stateInitMessageCases.forEach(([tst, stateInit, cell, expectedDeepLink]) => {
    it("Builds transaction deeplink correctly for " + tst, async () => {
      const txSpy = sinon.default.spy();
      const prov = new TonhubProvider({
        onSessionLinkReady: (l) => {},
        onTransactionLinkReady: txSpy,
      });
      sinon.default.replace(prov, "_tonhubConnector", tcStub);
      await prov.connect();
      await prov.requestTransaction({
        to: zeroAddress(),
        value: toNano(0.1),
        stateInit,
        message: cell,
      });
      expect(txSpy).to.have.been.calledOnceWith(expectedDeepLink);
    });
  });

  stateInitMessageCases.forEach(([tst, stateInit, message]) => {
    it("Calls transaction handler (no deeplink) correctly for " + tst, async () => {
      const prov = new TonhubProvider({
        onSessionLinkReady: (l) => {},
      });
      const tonConnectTxStub = sinon.default.stub();
      sinon.default.replace(prov, "_tonhubConnector", tcStub);
      sinon.default.replace(prov, "_tonHubConnectorTransaction", tonConnectTxStub);
      await prov.connect();
      await prov.requestTransaction({
        to: zeroAddress(),
        value: toNano(0.1),
        stateInit,
        message,
      });

      const { stateInit: actualStateInit, message: actualMessage } =
        tonConnectTxStub.getCall(0).args[0];

      expect(actualStateInit).to.equal(stateInit);
      expect(actualMessage).to.equal(message);
    });
  });
});
