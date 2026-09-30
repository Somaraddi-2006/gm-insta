const { Builder, By, until } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");
const fs = require("fs");
const path = require("path");

const BASE_URL = "http://localhost:3000";
const screenshotDir = path.resolve(__dirname, "screenshots");

if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir);
}

async function capture(driver, filename) {
  const image = await driver.takeScreenshot();
  const filePath = path.join(screenshotDir, filename);
  fs.writeFileSync(filePath, image, "base64");
  console.log(`Saved screenshot: ${filePath}`);
}

async function run() {
  console.log("Initializing headless Chrome for screenshots...");
  const options = new chrome.Options();
  options.addArguments("--headless");
  options.addArguments("--disable-gpu");
  options.addArguments("--no-sandbox");
  options.addArguments("--window-size=1280,900");

  const driver = await new Builder()
    .forBrowser("chrome")
    .setChromeOptions(options)
    .build();

  try {
    // 1. Capture Login Page
    console.log("Navigating to Login Page...");
    await driver.get(BASE_URL);
    await driver.wait(until.elementLocated(By.id("loginForm")), 10000);
    await capture(driver, "1_login.png");

    // 2. Capture Register Page
    console.log("Navigating to Register Page...");
    await driver.get(`${BASE_URL}/register`);
    await driver.wait(until.elementLocated(By.id("registerForm")), 10000);
    await capture(driver, "2_register.png");

    // Register a temp user for screenshots
    const uniqueId = Date.now();
    const username = `pic_user_${uniqueId}`;
    const email = `pic_${uniqueId}@example.com`;
    const password = "Password123!";
    
    await driver.findElement(By.id("username")).sendKeys(username);
    await driver.findElement(By.id("email")).sendKeys(email);
    await driver.findElement(By.id("password")).sendKeys(password);
    await driver.findElement(By.id("confirmPassword")).sendKeys(password);
    await driver.findElement(By.id("registerForm")).submit();
    
    await driver.wait(until.elementTextContains(driver.findElement(By.id("message")), "Registration successful"), 10000);

    // 3. Log in
    console.log("Logging in...");
    await driver.get(BASE_URL);
    await driver.wait(until.elementLocated(By.id("loginForm")), 10000);
    await driver.findElement(By.id("email")).sendKeys(email);
    await driver.findElement(By.id("password")).sendKeys(password);
    await driver.findElement(By.id("loginForm")).submit();
    await driver.wait(until.urlContains("/home"), 10000);
    await driver.sleep(1500); // Wait for load

    // 4. Create a dummy post so feed is not empty
    console.log("Creating a test post...");
    await driver.wait(until.elementLocated(By.id("toggleCreate")), 10000);
    await driver.findElement(By.id("toggleCreate")).click();
    await driver.wait(until.elementIsVisible(driver.findElement(By.id("createPanel"))), 10000);
    await driver.findElement(By.id("content")).sendKeys("Welcome to GMinsta! Active testing in progress...");
    await driver.findElement(By.id("imageUrl")).sendKeys("https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800");
    await driver.findElement(By.id("postForm")).submit();
    await driver.sleep(2000); // Wait for render

    // 5. Capture Home Feed
    console.log("Capturing Home Feed...");
    await capture(driver, "3_home.png");

    // 6. Capture Profile Page
    console.log("Navigating to Profile Page...");
    await driver.get(`${BASE_URL}/profile`);
    await driver.wait(until.elementLocated(By.id("displayName")), 10000);
    await driver.sleep(1500); // Wait for load
    await capture(driver, "4_profile.png");

    // 7. Capture Chat Page
    console.log("Navigating to Chat Page...");
    await driver.get(`${BASE_URL}/chat`);
    await driver.wait(until.elementLocated(By.id("receiverSelect")), 10000);
    await driver.sleep(1500); // Wait for load
    await capture(driver, "5_chat.png");

    // 8. Capture Reels Page
    console.log("Navigating to Reels Page...");
    await driver.get(`${BASE_URL}/reels`);
    await driver.wait(until.elementLocated(By.id("reelForm")), 10000);
    await driver.sleep(1500); // Wait for load
    await capture(driver, "6_reels.png");

    console.log("All screenshots successfully captured!");
  } catch (err) {
    console.error("Error during screenshots capture:", err);
  } finally {
    await driver.quit();
  }
}

run();
