const server = require("./test_server");
const { createUser, testUserPassword  } = require("../utils/seed_db");
const faker = require("@faker-js/faker").fakerEN_US;
const get_chai = require("../utils/get_chai");
const User = require("../models/User");

describe("tests for registration and logon", function () {
  
  before(async function () {
    const { expect, request } = await get_chai();
    this.expect = expect;
    this.request = request;
    this.password = testUserPassword;
    this.user = await createUser({ password: this.password });
  });
  
  
  it("should get the registration page", async () => {
    const expect = this.expect;
    const res = await this.request(server).get("/sessions/register").send();
    expect(res).to.have.status(200);
    expect(res).to.have.property("text");
    expect(res.text).to.include("Enter your name");
    const textNoLineEnd = res.text.replaceAll("\n", "");
    const csrfToken = /_csrf\" value=\"(.*?)\"/.exec(textNoLineEnd);
    expect(csrfToken).to.not.be.null;
    this.csrfToken = csrfToken[1];
    expect(res).to.have.property("headers");
    expect(res.headers).to.have.property("set-cookie");
    const cookies = res.headers["set-cookie"];
    this.csrfCookie = cookies.find((element) =>
      element.startsWith("csrfToken"),
    );
    expect(this.csrfCookie).to.not.be.undefined;
  });
  
  it("should register the user", async () => {
    this.password = testUserPassword;
    this.user = await createUser( { password: this.password });
    const expect = this.expect;
    const userData = {
      name: this.user.name,
      email: this.user.email,
      password: this.password,
      password1: this.password,
      _csrf: this.csrfToken,
    };
    
    const res = await this.request(server)
      .post("/sessions/register")
      .set("Cookie", this.csrfCookie)
      .set("content-type", "application/x-www-form-urlencoded")
      .send(userData);
    
    expect(res).to.have.status(200);
    expect(res).to.have.property("text");
    expect(res.text).to.include("Stories List");
    this.user = await User.findOne({ email: userData.email });
    expect(this.user).to.not.be.null;
  });
  
  it("should log the user on", async () => {
    const expect = this.expect;
    const dataToPost = {
      email: this.user.email,
      password: this.password,
      _csrf: this.csrfToken,
    };
    const res = this.request(server)
      .post("/sessions/logon")
      .set("Cookie", this.csrfCookie)
      .set("content-type", "application/x-www-form-urlencoded")
      .redirects(0)
      .send(dataToPost);
    
    expect(res).to.have.status(302);
    expect(res.headers.location).to.equal("/");
    const cookies = res.headers["set-cookie"];
    this.sessionCookie = cookies.find((element) =>
      element.startsWith("connect.sid"),
    );
    expect(this.sessionCookie).to.not.be.undefined;
  });
  
  it("should get the index page", async () => {
    const expect = this.expect;
    const res = await this.request(server)
      .get("/")
      .set("Cookie", this.csrfCookie)
      .set("Cookie", this.sessionCookie)
      .send();
    expect(res).to.have.status(200);
    expect(res).to.have.property("text");
    expect(res.text).to.include(this.user.name);
  });
  
  it("should log the user off", async () => {
    const dataToPost = {
      _csrf: this.csrfToken,
    };
  
    const res = await this.request(server)
      .post("/sessions/logoff")
      .set("Cookie", [this.csrfCookie, this.sessionCookie])
      .set("content-type", "application/x-www-form-urlencoded")
      .redirects(1)
      .send(dataToPost)
    
    const expect = this.expect;
    expect(res).to.have.status(200);
    expect(res.text).to.include("The Stories EJS Application");
    
    const getIndex = this.request(server)
      .get("/")
      .set("Cookie", this.csrfCookie)
      .send();
    
    const indexRes = await getIndex;
    expect(indexRes).to.have.status(200);
    expect(indexRes.text).to.include("link to logon");
  });
});
