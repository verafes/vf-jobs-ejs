const Story = require("../models/Story");
const User = require("../models/User");
const faker = require("@faker-js/faker").fakerEN_US;
const { generateSecurePassword } = require("../utils/helpers");
require("dotenv").config();

const testUserPassword = generateSecurePassword();

const availableTags = [
  "lifestory", "home", "memory", "romance", "family", "childhood",
  "dream", "travel", "adventure", "fun", "friends", "pets", "hobby",
  "health", "inspiring", "celebrate", "achievement"
];

function randomTags() {
  const count = faker.number.int({ min: 1, max: 3 });
  return faker.helpers.arrayElements(availableTags, count);
}

// Manual user factory
async function createUser(overrides = {}) {
  const userData = {
    name: faker.person.fullName(),
    email: faker.internet.email(),
    password: testUserPassword,
    ...overrides,
  };
  const user = new User(userData);
  await user.save();
  return user;
}

// Manual story factory
function buildStory(userId, overrides = {}) {
  return {
    title: `${faker.word.adjective()} ${faker.word.noun()}`,
    description: faker.lorem.paragraphs(3),
    tags: randomTags().join(','),
    isFavorite: faker.datatype.boolean(),
    imageUrl: faker.datatype.boolean() ? faker.image.urlLoremFlickr({ category: 'nature' }) : null,
    storyDate: faker.date.past({ years: 2 }),
    createdBy: userId,
    ...overrides,
  };
}

async function seed_db() {
  await Story.deleteMany({});
  await User.deleteMany({});
  
  const testUser = await createUser();
  
  const storyDocs = [];
  for (let i = 0; i < 10; i++) {
    const storyData = buildStory(testUser._id, {
      isFavorite: i < 3, // first 3 are favorite
    });
    storyDocs.push(new Story(storyData));
  }
  
  await Story.insertMany(storyDocs);
  
  return testUser;
}

module.exports = {
  testUserPassword,
  seed_db,
  createUser,
  buildStory,
  randomTags
};
