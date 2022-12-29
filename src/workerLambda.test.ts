import "jest";

describe("test JSON ", () => {
  it("test parse", () => {
    const rslt = JSON.parse(
      '{"context":{"stateMachineName":"processParallelWithRateLimit","token":"AQCkAAAAKgAAAAMAAAAAAAAAAVettWgxnIASwGLgDqeSJi2Mv3ALXixlok1H3r6BqVq0DBkTOqd6av86QisTdfP2qPETTbor53p05ek9ejRVUn7sxMXl7tDX1vlcHFqmj8Jdg2rI9JgOkR90YZQ+VIbU+uJsnowr4+5glQ==0PdAcPKTad9WUHRQ4ksmBddEV79jiaB7gacZ/3ywNaysojbfpDIacT85OuAPRuNR9SaciywNV248R6Pa7aIy+2qNesSkxq533mCrERt6mhB5KZpt/BWwtcLptydVBwU71X4Xwbo/GWh2GK/lS/wuPLBEbWr1XY+tSQD1biXOHwDKf3vYm7m5gz4yULqNS55M+FzDQ9joS5QmYWqLpnBs5wKegMDiamUl/M39HnCgnLVcHeS1LnL1Q6eIX2CswFMv82bQtd50i3Xoz6ZyOA8Ps4qHbXQdYF+UDMSky98oG1BBkz/i1ZGHyvm9W2oBYv3pgyHJVbt15hM1th8qoOB1LIbRNmkTQQf8nDj/hU2DmZKxtLvUT9mirskTytkUHaIqO08eFh10QDKViwZlmRRCNlinPdZOr6qLwLikbzPBVzgIEMrLg4YCG9B627ux44pGWiIZ38QfPBnBaRHUurgh7KVdxX9S7gibx4tYr0N1YbYboAT7Tl8dGV9+AW2ko4dx05fkKGLK/3AWS6vbbQk0"},"payload":{"id":"0","uuid":"7e01e429-189b-4b5a-b372-d27624b2a99f"}}'
    );

    console.log(JSON.stringify(rslt));
  });
});
