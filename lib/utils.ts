import { Address, Cell } from "ton";
import { GetResponseValue } from "./ton-connection";

export function cellToAddress(s: GetResponseValue): Address {
  return (s as Cell).beginParse().readAddress() as Address;
}
