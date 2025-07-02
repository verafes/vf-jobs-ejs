const server = require("./test_server");
const get_chai = require("../utils/get_chai");

describe("test getting a page", function () {
  it("should get the index page", async () => {
    const { expect, request } = await get_chai();
    const res = await request(server).get("/").send();
    expect(res).to.have.status(200);
    expect(res).to.have.property("text");
    expect(res.text).to.include("Click this link");
  });
});
