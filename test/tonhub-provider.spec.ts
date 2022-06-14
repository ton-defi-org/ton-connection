import chai, { expect } from "chai";
import chaiBN from "chai-bn";
import BN from "bn.js";
import { TonhubConnector } from "ton-x";
import * as sinon from "ts-sinon";
import { TonhubProvider } from "../lib/tonhub-provider";
import sinonChai from "sinon-chai";
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
});
