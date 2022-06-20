import { Cell, StateInit } from "ton";
export function stateInitToBuffer(s: StateInit): Buffer {
  const INIT_CELL = new Cell();
  s.writeTo(INIT_CELL);
  return INIT_CELL.toBoc();
}
