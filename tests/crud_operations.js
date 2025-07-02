const server = require("./test_server");
const Story = require("../models/Story")
const { seed_db, testUserPassword, buildStory } = require("../utils/seed_db");
const get_chai = require("../utils/get_chai");

describe("CRUD operation 1", function () {
  before(async () => {
    const { expect, request } = await get_chai();
    this.test_user = await seed_db();
    let req = request(server).get("/sessions/logon").send();
    let res = await req;
    const textNoLineEnd = res.text.replaceAll("\n", "");
    this.csrfToken = /_csrf\" value=\"(.*?)\"/.exec(textNoLineEnd)[1];
    let cookies = res.headers["set-cookie"];
    this.csrfCookie = cookies.find((element) =>
      element.startsWith("csrfToken"),
    );
    const dataToPost = {
      email: this.test_user.email,
      password: testUserPassword,
      _csrf: this.csrfToken,
    };
    req = request(server)
      .post("/sessions/logon")
      .set("Cookie", this.csrfCookie)
      .set("content-type", "application/x-www-form-urlencoded")
      .redirects(0)
      .send(dataToPost);
    res = await req;
    cookies = res.headers["set-cookie"];
    this.sessionCookie = cookies.find((element) =>
      element.startsWith("connect.sid"),
    );
    expect(this.csrfToken).to.not.be.undefined;
    expect(this.sessionCookie).to.not.be.undefined;
    expect(this.csrfCookie).to.not.be.undefined;
  });
  
    it('should get index page', async () => {
      const { expect, request } = await get_chai();
      const req = request(server)
          .get("/")
          .set("Cookie", this.sessionCookie)
          .send();
      const res = await req;
      expect(res).to.have.status(200);
      expect(res).to.have.property("text");
    });
  
  it('should get the story items page',  async () => {
    const { expect, request } = await get_chai();
    
    const req = request(server)
      .get('/stories')
      .set("Cookie", this.sessionCookie)
      .send()
    
    const res = await req;
    expect(res).to.have.status(200);
    expect(res).to.have.property('text');
    const pageParts = res.text.split("<tr>")
    expect(pageParts.length).to.equal(21)
  });
  
  it('should add a story item', async () => {
    
    const { _doc: dataToPost } = await buildStory({ createdBy: this.test_user.id });
    delete dataToPost._id;
    dataToPost._csrf = this.csrfToken;
    console.log("Generated CSRF Token:", this.csrfToken);
    console.log("Data to Post:", dataToPost);
    
    const { expect, request } = await get_chai();
    const req = request(server)
      .post('/stories')
      .set("Cookie", [this.csrfCookie, this.sessionCookie])
      .set('content-type', 'application/x-www-form-urlencoded')
      .redirects(0)
      .send(dataToPost);
    
    const res = await req;
    expect(res).to.have.status(302);
    
    const stories = Story.find({createdBy: this.test_user._id})
    expect((await stories).length).to.equal(1);
    
    const addedStory = Story.find({name: dataToPost.name});
    expect(addedStory).to.not.be.undefined;
  });
  
})