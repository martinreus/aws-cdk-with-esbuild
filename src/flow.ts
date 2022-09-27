// if loops
export const consumer = async (event: { nextId: number }, context: any) => {
  console.log(`received ${JSON.stringify(event)}`);
  await sleep(1000);
  if (!event || !event.nextId) {
    console.log(`entered return with 1`);
    return { nextId: 1 };
  }
  if (event.nextId < 10) {
    console.log(`entered return with < 10`);
    return { nextId: ++event.nextId };
  }
  return {};
};

export const sleep = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};
