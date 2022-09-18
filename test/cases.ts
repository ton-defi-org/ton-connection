import { StateInit, Cell } from "ton";

export const stateInitMessageCases = [
  [
    "state init and message",
    new StateInit({}),
    new Cell(),
    "ton://transfer/EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c?amount=100000000&init=te6ccsEBAQEAAwADAAEEn0-XjA..&bin=te6ccsEBAQEAAgACAAC4Afhr",
    "te6ccsEBAQEAAwADAAEEn0+XjA==",
    "te6ccsEBAQEAAgACAAC4Afhr",
  ],
  [
    "only state init",
    new StateInit({}),
    undefined,
    "ton://transfer/EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c?amount=100000000&init=te6ccsEBAQEAAwADAAEEn0-XjA..",
    "te6ccsEBAQEAAwADAAEEn0+XjA==",
    undefined,
  ],
  [
    "only message",
    undefined,
    new Cell(),
    "ton://transfer/EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c?amount=100000000&bin=te6ccsEBAQEAAgACAAC4Afhr",
    undefined,
    "te6ccsEBAQEAAgACAAC4Afhr",
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
