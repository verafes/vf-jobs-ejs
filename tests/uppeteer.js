const puppeteer = require("puppeteer");
const { expect } = require("chai");
const Story = require("../models/Story");
const User = require("../models/User");
const { seed_db, testUserPassword, availableTags } = require("../utils/seed_db");
const { login } = require('../utils/helpers');

describe("Story Management Application Tests", function () {
  let browser;
  let page;
  let testUser;
  let testStory;
  
  before(async function () {
    this.timeout(10000);
    
    // Launch browser
    browser = await puppeteer.launch({
      headless: false,
      slowMo: 50,
      args: ['--start-maximized']
    });
    
    page = await browser.newPage();
    await page.setViewport({ width: 1366, height: 768 });
    
    // Seed test data
    testUser = await seed_db();
    testStory = await Story.findOne({ createdBy: testUser._id });
    
    await page.goto("/");
  });
  
  after(async function () {
    await browser.close();
  });
  
  describe("Authentication Flow", function () {
    it("should display login and register links when not authenticated", async function () {
      const loginLink = await page.$('a[href="/sessions/logon"]');
      const registerLink = await page.$('a[href="/sessions/register"]');
      
      expect(loginLink).to.exist;
      expect(registerLink).to.exist;
    });
    
    it("should successfully log in with test credentials", async function () {
      await page.click('a[href="/sessions/logon"]');
      await page.waitForNavigation();
      
      await page.type('input[name="email"]', testUser.email);
      await page.type('input[name="password"]', testUserPassword);
      await page.click('button[type="submit"]');
      await page.waitForNavigation();
      
      const welcomeText = await page.$eval('p', el => el.textContent);
      expect(welcomeText).to.include(`${testUser.name} is logged on.`);
    });
    
    it("should display stories and secret word links after login", async function () {
      await login(page, testUser.email, testUserPassword);
      const storiesLink = await page.$('a[href="/stories"]');
      const secretWordLink = await page.$('a[href="/secretWord"]');
      
      expect(storiesLink).to.exist;
      expect(secretWordLink).to.exist;
    });
  });
  
  describe("Story List View", function () {
    before(async () => {
      await login(page, testUser.email, testUserPassword);
    });
    it("should display the stories table with correct columns", async function () {
      await page.click('a[href="/stories"]');
      await page.waitForSelector('#stories-table');
      
      const headers = await page.$$eval('#story-table-header th', ths =>
        ths.map(th => th.textContent.trim())
      );
      
      expect(headers).to.deep.equal([
        'Title', 'Description', 'Tags', 'StoryDate', 'Favorite', '', ''
      ]);
    });
    
    it("should display seeded stories in the table", async function () {
      const storiesCount = await page.$$eval('#stories-table tr', rows => rows.length - 1); // minus header
      expect(storiesCount).to.be.at.least(1);
      
      const firstStoryTitle = await page.$eval('#stories-table tr:nth-child(2) td:first-child', el => el.textContent);
      expect(firstStoryTitle).to.equal(testStory.title);
    });
    
    it("should have working action buttons for each story", async function () {
      const editButtons = await page.$$('#stories-table a button');
      const deleteButtons = await page.$$('#stories-table form button');
      
      expect(editButtons.length).to.equal(await Story.countDocuments());
      expect(deleteButtons.length).to.equal(await Story.countDocuments());
    });
    
    it("should navigate to create story page", async function () {
      await page.click('a[href="/stories/new"]');
      await page.waitForSelector('form[method="POST"]');
      
      const formTitle = await page.$eval('h2', el => el.textContent);
      expect(formTitle).to.equal('Add Story');
    });
  });
  
  describe("Story Creation", function () {
    before(async () => {
      await login(page, testUser.email, testUserPassword);
    });
    const newStory = {
      title: "My Puppeteer Testing Adventure",
      description: "How I wrote tests for this application",
      tags: "testing, puppeteer, e2e"
    };
    
    it("should validate required fields", async function () {
      await page.click('button[type="submit"]');
      
      const titleError = await page.$eval('#storyTitle:invalid', el => el.validationMessage);
      const descError = await page.$eval('#description:invalid', el => el.validationMessage);
      
      expect(titleError).to.equal('Please fill out this field.');
      expect(descError).to.equal('Please fill out this field.');
    });
    
    it("should create a new story successfully", async function () {
      await page.type('#storyTitle', newStory.title);
      await page.type('#description', newStory.description);
      await page.type('#tags', newStory.tags);
      await page.click('button[type="submit"]');
      await page.waitForNavigation();
      // on UI
      const storyTitles = await page.$$eval('#stories-table tr td:first-child', tds =>
        tds.map(td => td.textContent)
      );
      expect(storyTitles).to.include(newStory.title);
      // in db
      const dbStory = await Story.findOne({ title: newStory.title });
      expect(dbStory).to.exist;
      expect(dbStory.tags).to.deep.equal(newStory.tags.split(', '));
    });
  });
  
  describe("Story Editing", function () {
    before(async () => {
      await login(page, testUser.email, testUserPassword);
    });
    it("should navigate to edit page", async function () {
      await page.click('#stories-table tr:nth-child(2) a button');
      await page.waitForSelector('form[method="POST"]');
      
      const formTitle = await page.$eval('h2', el => el.textContent);
      expect(formTitle).to.equal('Edit Story');
    });
    
    it("should update story details", async function () {
      const updatedTitle = "Updated: " + testStory.title;
      await page.evaluate(() => document.getElementById('storyTitle').value = '');
      await page.type('#storyTitle', updatedTitle);
      await page.click('button[type="submit"]');
      await page.waitForNavigation();
      
      const firstStoryTitle = await page.$eval('#stories-table tr:nth-child(2) td:first-child', el => el.textContent);
      expect(firstStoryTitle).to.equal(updatedTitle);
    });
  });
  
  describe("Story Deletion", function () {
    before(async () => {
      await login(page, testUser.email, testUserPassword);
    });
    it("should delete a story", async function () {
      const initialCount = await page.$$eval('#stories-table tr', rows => rows.length - 1);
      
      await page.click('#stories-table tr:nth-child(2) form button');
      await page.waitForNavigation();
      
      const newCount = await page.$$eval('#stories-table tr', rows => rows.length - 1);
      expect(newCount).to.equal(initialCount - 1);
    });
  });
  
  describe("Tag Suggestions", function () {
    before(async () => {
      await login(page, testUser.email, testUserPassword);
    });
    it("should display tag suggestions on story form", async function () {
      await page.click('a[href="/stories/new"]');
      await page.waitForSelector('#tag-hints');
      
      const suggestionsText = await page.$eval('#tag-hints', el => el.textContent);
      availableTags.forEach(tag => {
        expect(suggestionsText).to.include(tag);
      });
    });
  });
});