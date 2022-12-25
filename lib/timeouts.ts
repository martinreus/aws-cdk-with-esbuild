export const promiseTimeout = async <T>(
  func: () => Promise<T>,
  ms: number
): Promise<T> => {
  return new Promise((accept, reject) => {
    setTimeout(async () => {
      try {
        const rslt = await func();
        accept(rslt);
      } catch (e) {
        reject(e);
      }
    }, ms);
  });
};

export const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};
