const server = require("./test_server");
const assert = require('assert');
const get_chai = require("../utils/get_chai");

describe('Sanity', function () {
  let expect, request;
  before(async () => {
    ({ expect, request } = await get_chai());
  });
  it('works', function () {
    assert.strictEqual(1 + 1, 2);
  });
  it("should get the home page", async () => {
    const res = await request(server)
      .get("/")
      .send();
    expect(res).to.have.status(200);
  });
});