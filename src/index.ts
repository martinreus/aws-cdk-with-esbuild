import { v4 } from "uuid";

export const test = () => {
  const random = v4();
  console.log(`hello world ${random}`);
};
