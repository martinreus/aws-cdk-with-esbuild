const handler = async (event: any, _: any) => {
  console.log(JSON.stringify(event));
  return event;
};
