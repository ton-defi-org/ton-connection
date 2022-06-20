import { StateInit, Cell } from "ton";

export const stateInitMessageCases = [
  [
    "state init and message",
    new StateInit({}),
    new Cell(),
    "ton://transfer/EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c?amount=100000000&init=te6ccsEBAQEAAwAAAAEEpsa17g..&bin=te6ccsEBAQEAAgAAAAC1U5ck",
    "te6ccsEBAQEAAwAAAAEEpsa17g==",
    "te6ccsEBAQEAAgAAAAC1U5ck",
  ],
  [
    "only state init",
    new StateInit({}),
    undefined,
    "ton://transfer/EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c?amount=100000000&init=te6ccsEBAQEAAwAAAAEEpsa17g..",
    "te6ccsEBAQEAAwAAAAEEpsa17g==",
    undefined,
  ],
  [
    "only message",
    undefined,
    new Cell(),
    "ton://transfer/EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c?amount=100000000&bin=te6ccsEBAQEAAgAAAAC1U5ck",
    undefined,
    "te6ccsEBAQEAAgAAAAC1U5ck",
  ],
  [
    "only value",
    undefined,
    undefined,
    "ton://transfer/EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c?amount=100000000",
    undefined,
    undefined,
  ],
];
