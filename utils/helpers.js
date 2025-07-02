import {fakerEN_US as faker} from "@faker-js/faker";

export async function login(page, email, password) {
  await page.goto("/sessions/logon");
  await page.type('input[name="email"]', email);
  await page.type('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForNavigation();
}

export const generateSecurePassword = () => {
  const lower = faker.string.alpha({ casing: 'lower' });
  const upper = faker.string.alpha({ casing: 'upper' });
  const digit = faker.string.numeric();
  const special = faker.helpers.arrayElement(['!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '_', '+']);
  const rest = faker.string.alpha({ length: 6 });
  const allChars = [lower, upper, digit, special, ...rest].join('');
  return faker.helpers.shuffle([...allChars]).join('').slice(0, 12);
};

// module.exports = { login };