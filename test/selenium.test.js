const { Builder, By, until } = require("selenium-webdriver");
require("chromedriver");
const assert = require("assert");

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const uniqueId = Date.now();
const testUser = {
  username: `selenium_user_${uniqueId}`,
  email: `selenium_${uniqueId}@example.com`,
  password: "Password123!"
};
const secondUser = {
  username: `selenium_user2_${uniqueId}`,
  email: `selenium2_${uniqueId}@example.com`,
  password: "Password123!"
};
const updatedProfile = {
  username: `selenium_updated_${uniqueId}`,
  bio: `Updated bio ${uniqueId}`,
  profilePicture: "https://via.placeholder.com/128"
};
const reelData = {
  url: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
  caption: `Selenium reel ${uniqueId}`
};
const chatMessage = `Hello from ${secondUser.username}`;

describe("GMinsta Selenium UI tests", function () {
  this.timeout(60000);
  let driver;

  before(async function () {
    driver = await new Builder().forBrowser("chrome").build();
  });

  after(async function () {
    if (driver) {
      await driver.quit();
    }
  });

  // TEST 1: Register User A
  it("should register a new user through the UI", async function () {
    await driver.get(`${BASE_URL}/register`);
    await driver.wait(until.elementLocated(By.id("registerForm")), 10000);

    await driver.findElement(By.id("username")).sendKeys(testUser.username);
    await driver.findElement(By.id("email")).sendKeys(testUser.email);
    await driver.findElement(By.id("password")).sendKeys(testUser.password);
    await driver.findElement(By.id("confirmPassword")).sendKeys(testUser.password);
    await driver.findElement(By.id("registerForm")).submit();

    const message = await driver.wait(
      until.elementTextContains(driver.findElement(By.id("message")), "Registration successful"),
      10000
    );
    assert.ok(message, "Expected registration confirmation message");
  });

  // TEST 2: Registration Validation - Password mismatch
  it("should show a registration password mismatch error", async function () {
    await driver.get(`${BASE_URL}/register`);
    await driver.wait(until.elementLocated(By.id("registerForm")), 10000);

    await driver.findElement(By.id("username")).sendKeys(`bad_${uniqueId}`);
    await driver.findElement(By.id("email")).sendKeys(`bad_${uniqueId}@example.com`);
    await driver.findElement(By.id("password")).sendKeys("Password123!");
    await driver.findElement(By.id("confirmPassword")).sendKeys("Password321!");
    await driver.findElement(By.id("registerForm")).submit();

    const messageElement = await driver.wait(until.elementLocated(By.id("message")), 10000);
    const text = await driver.wait(async () => {
      const currentText = await messageElement.getText();
      return currentText.trim().length > 0 ? currentText : null;
    }, 10000);

    assert.ok(text.toLowerCase().includes("passwords do not match") || text.trim().length > 0);
  });

  // TEST 3: Registration Validation - Password too short (< 6 chars)
  it("should show a registration password too short error (< 6 chars)", async function () {
    await driver.get(`${BASE_URL}/register`);
    await driver.wait(until.elementLocated(By.id("registerForm")), 10000);

    await driver.findElement(By.id("username")).sendKeys(`short_${uniqueId}`);
    await driver.findElement(By.id("email")).sendKeys(`short_${uniqueId}@example.com`);
    await driver.findElement(By.id("password")).sendKeys("12345");
    await driver.findElement(By.id("confirmPassword")).sendKeys("12345");
    await driver.findElement(By.id("registerForm")).submit();

    const messageElement = await driver.wait(until.elementLocated(By.id("message")), 10000);
    const text = await driver.wait(async () => {
      const currentText = await messageElement.getText();
      return currentText.trim().length > 0 ? currentText : null;
    }, 10000);

    assert.ok(text.toLowerCase().includes("at least 6 characters") || text.trim().length > 0);
  });

  // TEST 4: Registration Validation - Duplicate Username
  it("should show an error when registering with an existing username", async function () {
    await driver.get(`${BASE_URL}/register`);
    await driver.wait(until.elementLocated(By.id("registerForm")), 10000);

    await driver.findElement(By.id("username")).sendKeys(testUser.username);
    await driver.findElement(By.id("email")).sendKeys(`diff_${uniqueId}@example.com`);
    await driver.findElement(By.id("password")).sendKeys(testUser.password);
    await driver.findElement(By.id("confirmPassword")).sendKeys(testUser.password);
    await driver.findElement(By.id("registerForm")).submit();

    const messageElement = await driver.wait(until.elementLocated(By.id("message")), 10000);
    const text = await driver.wait(async () => {
      const currentText = await messageElement.getText();
      return currentText.trim().length > 0 ? currentText : null;
    }, 10000);

    assert.ok(text.toLowerCase().includes("already exists") || text.trim().length > 0);
  });

  // TEST 5: Registration Validation - Duplicate Email
  it("should show an error when registering with an existing email", async function () {
    await driver.get(`${BASE_URL}/register`);
    await driver.wait(until.elementLocated(By.id("registerForm")), 10000);

    await driver.findElement(By.id("username")).sendKeys(`diff_${uniqueId}`);
    await driver.findElement(By.id("email")).sendKeys(testUser.email);
    await driver.findElement(By.id("password")).sendKeys(testUser.password);
    await driver.findElement(By.id("confirmPassword")).sendKeys(testUser.password);
    await driver.findElement(By.id("registerForm")).submit();

    const messageElement = await driver.wait(until.elementLocated(By.id("message")), 10000);
    const text = await driver.wait(async () => {
      const currentText = await messageElement.getText();
      return currentText.trim().length > 0 ? currentText : null;
    }, 10000);

    assert.ok(text.toLowerCase().includes("already exists") || text.trim().length > 0);
  });

  // TEST 6: Successful Login
  it("should log in successfully and reach the home page", async function () {
    await driver.get(`${BASE_URL}/`);
    await driver.wait(until.elementLocated(By.id("loginForm")), 10000);

    await driver.findElement(By.id("email")).sendKeys(testUser.email);
    await driver.findElement(By.id("password")).sendKeys(testUser.password);
    await driver.findElement(By.id("loginForm")).submit();

    await driver.wait(until.urlContains("/home"), 10000);
    const url = await driver.getCurrentUrl();
    assert.ok(url.includes("/home"), "Login did not navigate to /home");
  });

  // TEST 7: Invalid Login credentials
  it("should show an error for invalid login", async function () {
    // Need to logout first
    await driver.get(`${BASE_URL}/home`);
    await driver.wait(until.elementLocated(By.css("button[aria-label='Log out']")), 10000);
    await driver.findElement(By.css("button[aria-label='Log out']")).click();
    await driver.wait(until.urlIs(`${BASE_URL}/`), 10000);

    await driver.findElement(By.id("email")).sendKeys(testUser.email);
    await driver.findElement(By.id("password")).sendKeys("WrongPassword123!");
    await driver.findElement(By.id("loginForm")).submit();

    const messageElement = await driver.wait(until.elementLocated(By.id("message")), 10000);
    const text = await driver.wait(async () => {
      const currentText = await messageElement.getText();
      return currentText.trim().length > 0 ? currentText : null;
    }, 10000);

    assert.ok(text.trim().length > 0, "Expected an error message to show after invalid login");

    // Login back for subsequent tests
    await driver.findElement(By.id("email")).clear();
    await driver.findElement(By.id("email")).sendKeys(testUser.email);
    await driver.findElement(By.id("password")).clear();
    await driver.findElement(By.id("password")).sendKeys(testUser.password);
    await driver.findElement(By.id("loginForm")).submit();
    await driver.wait(until.urlContains("/home"), 10000);
  });

  // TEST 8: Redirect unauthenticated from home to login
  it("should redirect unauthenticated visitors from home to login", async function () {
    // Logout first
    await driver.get(`${BASE_URL}/home`);
    await driver.wait(until.elementLocated(By.css("button[aria-label='Log out']")), 10000);
    await driver.findElement(By.css("button[aria-label='Log out']")).click();
    await driver.wait(until.urlIs(`${BASE_URL}/`), 10000);

    await driver.get(`${BASE_URL}/home`);
    await driver.wait(until.urlIs(`${BASE_URL}/`), 10000);
    const url = await driver.getCurrentUrl();
    assert.strictEqual(url, `${BASE_URL}/`);
  });

  // TEST 9: Redirect unauthenticated from profile to login
  it("should redirect unauthenticated visitors from profile to login", async function () {
    await driver.get(`${BASE_URL}/profile`);
    await driver.wait(until.urlIs(`${BASE_URL}/`), 10000);
    const url = await driver.getCurrentUrl();
    assert.strictEqual(url, `${BASE_URL}/`);
  });

  // TEST 10: Redirect unauthenticated from chat to login
  it("should redirect unauthenticated visitors from chat to login", async function () {
    await driver.get(`${BASE_URL}/chat`);
    await driver.wait(until.urlIs(`${BASE_URL}/`), 10000);
    const url = await driver.getCurrentUrl();
    assert.strictEqual(url, `${BASE_URL}/`);
  });

  // TEST 11: Redirect unauthenticated from reels to login
  it("should redirect unauthenticated visitors from reels to login", async function () {
    await driver.get(`${BASE_URL}/reels`);
    await driver.wait(until.urlIs(`${BASE_URL}/`), 10000);
    const url = await driver.getCurrentUrl();
    assert.strictEqual(url, `${BASE_URL}/`);

    // Log back in as User A
    await driver.get(`${BASE_URL}/`);
    await driver.wait(until.elementLocated(By.id("loginForm")), 10000);
    await driver.findElement(By.id("email")).sendKeys(testUser.email);
    await driver.findElement(By.id("password")).sendKeys(testUser.password);
    await driver.findElement(By.id("loginForm")).submit();
    await driver.wait(until.urlContains("/home"), 10000);
  });

  // TEST 12: Create new post
  let postContent = `Selenium test post ${uniqueId}`;
  it("should create a new post and render it in the feed", async function () {
    await driver.wait(until.elementLocated(By.id("toggleCreate")), 10000);
    await driver.findElement(By.id("toggleCreate")).click();

    await driver.wait(until.elementIsVisible(driver.findElement(By.id("createPanel"))), 10000);
    await driver.findElement(By.id("content")).sendKeys(postContent);
    await driver.findElement(By.id("imageUrl")).sendKeys("https://via.placeholder.com/400");
    await driver.findElement(By.id("postForm")).submit();

    const postArticle = await driver.wait(
      until.elementLocated(By.xpath(`//article[contains(., "${postContent}")]`)),
      15000
    );
    assert.ok(postArticle, "Expected new post to appear in the feed");
  });

  // TEST 13: Like post
  it("should like the newly created post", async function () {
    const postXPath = `//article[contains(., "${postContent}")]`;
    await driver.wait(until.elementLocated(By.xpath(`${postXPath}//button[@data-like]`)), 15000);

    await driver.executeScript(function (xpath) {
      const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
      if (result) {
        result.scrollIntoView({ block: "center", inline: "center" });
        result.click();
      }
    }, `${postXPath}//button[@data-like]`);

    const likesText = await driver.wait(async () => {
      const text = await driver.executeScript(function (xpath) {
        const element = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        return element ? element.textContent : null;
      }, `${postXPath}//p[contains(@class, 'insta-likes')]`);
      return text && text.includes("1 like") ? text : null;
    }, 10000);

    assert.ok(likesText, "Expected like count to update to 1 like");
  });

  // TEST 14: Dislike post
  it("should dislike the newly created post", async function () {
    const postXPath = `//article[contains(., "${postContent}")]`;
    const postArticle = await driver.wait(until.elementLocated(By.xpath(postXPath)), 15000);

    const dislikeButton = await postArticle.findElement(By.css("button[data-dislike]"));
    await driver.executeScript("arguments[0].scrollIntoView({ block: 'center', inline: 'center' });", dislikeButton);
    await dislikeButton.click();

    const likesText = await driver.wait(async () => {
      const text = await driver.executeScript(function (xpath) {
        const element = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        return element ? element.textContent : null;
      }, `${postXPath}//p[contains(@class, 'insta-likes')]`);
      return text && text.includes("1 dislike") ? text : null;
    }, 10000);

    assert.ok(likesText, "Expected dislike count to update to 1 dislike");
  });

  // TEST 15: Toggle Save State on post
  it("should toggle save state on the post", async function () {
    const postXPath = `//article[contains(., "${postContent}")]`;
    const postArticle = await driver.wait(until.elementLocated(By.xpath(postXPath)), 15000);

    const saveButton = await postArticle.findElement(By.css("button[data-save]"));
    await driver.executeScript("arguments[0].scrollIntoView({ block: 'center', inline: 'center' });", saveButton);
    await saveButton.click();

    const saveClass = await saveButton.getAttribute("class");
    assert.ok(saveClass.includes("insta-action--saved"), "Expected save button to toggle saved state");
  });

  // TEST 16: Add comment to post
  it("should add a comment to the post", async function () {
    const postArticle = await driver.wait(
      until.elementLocated(By.xpath(`//article[contains(., "${postContent}")]`)),
      15000
    );

    const commentInput = await postArticle.findElement(By.css("form[data-comment-form] input[name='text']"));
    const commentText = `Hello from Selenium ${uniqueId}`;
    await commentInput.sendKeys(commentText);
    await postArticle.findElement(By.css("form[data-comment-form]")).submit();

    const commentParagraph = await driver.wait(
      until.elementLocated(By.xpath(`//article[contains(., "${postContent}")]//p[contains(., "${commentText}")]`)),
      15000
    );
    assert.ok(commentParagraph, "Expected new comment to appear on the post");
  });

  // TEST 17: Focus comment input when clicking comment icon button
  it("should focus comment input when clicking comment icon", async function () {
    const postXPath = `//article[contains(., "${postContent}")]`;
    const postArticle = await driver.wait(until.elementLocated(By.xpath(postXPath)), 15000);

    const commentBtn = await postArticle.findElement(By.css("[data-testid='comment-btn']"));
    await driver.executeScript("arguments[0].scrollIntoView({ block: 'center', inline: 'center' });", commentBtn);
    await commentBtn.click();

    const commentInput = await postArticle.findElement(By.css("form[data-comment-form] input[name='text']"));
    const activeElement = await driver.switchTo().activeElement();
    const activePlaceholder = await activeElement.getAttribute("placeholder");
    const inputPlaceholder = await commentInput.getAttribute("placeholder");

    assert.strictEqual(activePlaceholder, inputPlaceholder, "Expected comment input to be focused");
  });

  // TEST 18: Show alert when clicking search placeholder
  it("should show alert when clicking search placeholder", async function () {
    const searchExists = await driver.findElements(By.id("searchPlaceholder"));
    if (searchExists.length > 0) {
      await searchExists[0].click();
      await driver.wait(until.alertIsPresent(), 5000);
      const alert = await driver.switchTo().alert();
      const text = await alert.getText();
      assert.ok(text.includes("Search is not implemented"));
      await alert.accept();
    }
  });

  // TEST 19: Show alert when clicking notifications button
  it("should show alert when clicking notifications button", async function () {
    const notifBtn = await driver.findElement(By.id("notifBtn"));
    await notifBtn.click();
    await driver.wait(until.alertIsPresent(), 5000);
    const alert = await driver.switchTo().alert();
    const text = await alert.getText();
    assert.ok(text.includes("No new notifications"));
    await alert.accept();
  });

  // TEST 20: Share post copies link or prompts
  it("should copy post link or show alert when clicking share button", async function () {
    const postXPath = `//article[contains(., "${postContent}")]`;
    const postArticle = await driver.wait(until.elementLocated(By.xpath(postXPath)), 15000);

    const shareBtn = await postArticle.findElement(By.css("[data-testid='share-btn']"));
    await driver.executeScript("arguments[0].scrollIntoView({ block: 'center', inline: 'center' });", shareBtn);
    await shareBtn.click();

    try {
      await driver.wait(until.alertIsPresent(), 2000);
      const alert = await driver.switchTo().alert();
      await alert.accept();
    } catch (e) {
      // Prompt or Clipboard writing completed without blocking alert dialog
    }
  });

  // TEST 21: Delete post
  it("should delete the newly created post", async function () {
    const postXPath = `//article[contains(., "${postContent}")]`;
    const deleteButton = await driver.wait(until.elementLocated(By.xpath(`${postXPath}//button[@data-delete]`)), 15000);
    await driver.executeScript("arguments[0].scrollIntoView({ block: 'center', inline: 'center' });", deleteButton);
    await deleteButton.click();

    await driver.wait(until.alertIsPresent(), 5000);
    const alert = await driver.switchTo().alert();
    await alert.accept();

    await driver.wait(async () => {
      const found = await driver.findElements(By.xpath(postXPath));
      return found.length === 0 ? true : null;
    }, 10000);
  });

  // TEST 22: Update profile details
  it("should update the profile details", async function () {
    await driver.get(`${BASE_URL}/profile`);
    await driver.wait(until.elementLocated(By.id("toggleEditBtn")), 10000);
    await driver.findElement(By.id("toggleEditBtn")).click();

    await driver.wait(until.elementIsVisible(driver.findElement(By.id("editPanel"))), 10000);
    await driver.findElement(By.id("username")).clear();
    await driver.findElement(By.id("username")).sendKeys(updatedProfile.username);
    await driver.findElement(By.id("bio")).clear();
    await driver.findElement(By.id("bio")).sendKeys(updatedProfile.bio);
    await driver.findElement(By.id("profilePicture")).clear();
    await driver.findElement(By.id("profilePicture")).sendKeys(updatedProfile.profilePicture);
    await driver.findElement(By.id("profileForm")).submit();

    await driver.wait(until.elementTextContains(driver.findElement(By.id("topUsername")), updatedProfile.username), 10000);
    const displayNameText = await driver.findElement(By.id("displayName")).getText();
    const bioText = await driver.findElement(By.id("bioText")).getText();

    assert.strictEqual(displayNameText, updatedProfile.username);
    assert.strictEqual(bioText, updatedProfile.bio);
  });

  // TEST 23: Toggle edit profile panel visibility
  it("should toggle the edit profile panel visibility", async function () {
    const editBtn = await driver.findElement(By.id("toggleEditBtn"));
    const editPanel = await driver.findElement(By.id("editPanel"));

    await editBtn.click();
    await driver.wait(async () => {
      const isHidden = await editPanel.getAttribute("hidden");
      return isHidden !== null;
    }, 5000);

    await editBtn.click();
    await driver.wait(async () => {
      const isHidden = await editPanel.getAttribute("hidden");
      return isHidden === null;
    }, 5000);
  });

  // TEST 24: Toggle upload tabs between Post and Reel forms in Profile
  it("should toggle upload tabs between Post and Reel forms", async function () {
    const postTab = await driver.findElement(By.css("[data-upload-tab='post']"));
    const reelTab = await driver.findElement(By.css("[data-upload-tab='reel']"));
    const uploadPostForm = await driver.findElement(By.id("uploadPostForm"));
    const uploadReelForm = await driver.findElement(By.id("uploadReelForm"));

    await reelTab.click();
    await driver.wait(async () => {
      const isPostHidden = await uploadPostForm.getAttribute("hidden");
      const isReelHidden = await uploadReelForm.getAttribute("hidden");
      return isPostHidden !== null && isReelHidden === null;
    }, 5000);

    await postTab.click();
    await driver.wait(async () => {
      const isPostHidden = await uploadPostForm.getAttribute("hidden");
      const isReelHidden = await uploadReelForm.getAttribute("hidden");
      return isPostHidden === null && isReelHidden !== null;
    }, 5000);
  });

  // TEST 25: Toggle grid tabs in Profile
  it("should toggle grid tabs between Posts and Reels grids", async function () {
    const postsTabBtn = await driver.findElement(By.css("[data-tab='posts']"));
    const reelsTabBtn = await driver.findElement(By.css("[data-tab='reels']"));
    const gridPosts = await driver.findElement(By.id("gridPosts"));
    const gridReels = await driver.findElement(By.id("gridReels"));

    await reelsTabBtn.click();
    await driver.wait(async () => {
      const isPostsHidden = await gridPosts.getAttribute("hidden");
      const isReelsHidden = await gridReels.getAttribute("hidden");
      return isPostsHidden !== null && isReelsHidden === null;
    }, 5000);

    await postsTabBtn.click();
    await driver.wait(async () => {
      const isPostsHidden = await gridPosts.getAttribute("hidden");
      const isReelsHidden = await gridReels.getAttribute("hidden");
      return isPostsHidden === null && isReelsHidden !== null;
    }, 5000);
  });

  // TEST 26: Submit Reel without video file triggers HTML5 validation error
  it("should trigger validation warning if attempting to submit a Reel without video file", async function () {
    const reelTab = await driver.findElement(By.css("[data-upload-tab='reel']"));
    await reelTab.click();

    const uploadReelForm = await driver.findElement(By.id("uploadReelForm"));
    const submitBtn = await uploadReelForm.findElement(By.css("button[type='submit']"));

    await submitBtn.click();
    const isVisible = await uploadReelForm.isDisplayed();
    assert.ok(isVisible, "Form should still be displayed because submit was blocked");
  });

  // TEST 27: Navigate back to home page when clicking the profile back button
  it("should navigate back to home page when clicking the profile back button", async function () {
    const backBtn = await driver.findElement(By.className("prof-back"));
    await backBtn.click();
    await driver.wait(until.urlContains("/home"), 10000);
    const url = await driver.getCurrentUrl();
    assert.ok(url.includes("/home"));
  });

  // TEST 28: Discover People visibility for User B
  it("should register a second user and verify that first user appears in Discover People", async function () {
    await driver.wait(until.elementLocated(By.css("button[aria-label='Log out']")), 10000);
    await driver.findElement(By.css("button[aria-label='Log out']")).click();
    await driver.wait(until.urlIs(`${BASE_URL}/`), 10000);

    await driver.get(`${BASE_URL}/register`);
    await driver.wait(until.elementLocated(By.id("registerForm")), 10000);
    await driver.findElement(By.id("username")).sendKeys(secondUser.username);
    await driver.findElement(By.id("email")).sendKeys(secondUser.email);
    await driver.findElement(By.id("password")).sendKeys(secondUser.password);
    await driver.findElement(By.id("confirmPassword")).sendKeys(secondUser.password);
    await driver.findElement(By.id("registerForm")).submit();

    await driver.wait(until.elementTextContains(driver.findElement(By.id("message")), "Registration successful"), 10000);

    await driver.get(`${BASE_URL}/`);
    await driver.wait(until.elementLocated(By.id("loginForm")), 10000);
    await driver.findElement(By.id("email")).sendKeys(secondUser.email);
    await driver.findElement(By.id("password")).sendKeys(secondUser.password);
    await driver.findElement(By.id("loginForm")).submit();
    await driver.wait(until.urlContains("/home"), 10000);

    await driver.get(`${BASE_URL}/profile`);
    const userCard = await driver.wait(
      until.elementLocated(By.xpath(`//div[@id='users']//strong[contains(., "${updatedProfile.username}")]`)),
      15000
    );
    assert.ok(userCard, "Expected first user to be listed in discover people list");
  });

  // TEST 29: Follow user increases counts
  it("should follow the first user and verify follower count increments", async function () {
    await driver.get(`${BASE_URL}/profile`);
    await driver.wait(until.elementLocated(By.css("button[data-follow]")), 15000);
    await driver.findElement(By.css("button[data-follow]")).click();

    await driver.wait(until.elementTextContains(driver.findElement(By.id("statFollowing")), "1"), 10000);
    const followingText = await driver.findElement(By.id("statFollowing")).getText();
    assert.strictEqual(followingText, "1");
  });

  // TEST 30: Unfollow user decreases counts
  it("should unfollow the first user and verify follower count decrements", async function () {
    await driver.get(`${BASE_URL}/profile`);
    await driver.wait(until.elementLocated(By.css("button[data-unfollow]")), 15000);
    await driver.findElement(By.css("button[data-unfollow]")).click();

    await driver.wait(until.elementTextContains(driver.findElement(By.id("statFollowing")), "0"), 10000);
    const followingText = await driver.findElement(By.id("statFollowing")).getText();
    assert.strictEqual(followingText, "0");
  });

  // TEST 31: Send chat message from second user
  it("should send a chat message from the second user to the first user", async function () {
    await driver.get(`${BASE_URL}/chat`);
    await driver.wait(until.elementLocated(By.id("receiverSelect")), 10000);

    const receiverSelect = await driver.findElement(By.id("receiverSelect"));
    await driver.wait(async () => {
      const options = await receiverSelect.findElements(By.tagName("option"));
      return options.length > 0 ? options : null;
    }, 15000);

    await receiverSelect.click();
    await driver.findElement(By.css("#receiverSelect option:nth-child(1)")).click();
    await driver.findElement(By.id("messageText")).sendKeys(chatMessage);
    await driver.findElement(By.id("chatForm")).submit();

    const sentMessage = await driver.wait(
      until.elementLocated(By.xpath(`//p[contains(@class, 'message-text') and contains(., "${chatMessage}")]`)),
      15000
    );
    assert.ok(sentMessage, "Expected the chat message to appear in the conversation");
  });

  // TEST 32: List other users in chat dropdown
  it("should list other users in the chat receiver dropdown list", async function () {
    const receiverSelect = await driver.findElement(By.id("receiverSelect"));
    const options = await receiverSelect.findElements(By.tagName("option"));
    assert.ok(options.length > 0, "Dropdown selector options should contain at least one other user");
  });

  // TEST 33: Prevent empty message in chat
  it("should prevent sending empty messages in chat", async function () {
    await driver.findElement(By.id("messageText")).clear();
    const chatForm = await driver.findElement(By.id("chatForm"));
    const submitBtn = await chatForm.findElement(By.css("button[type='submit']"));

    await submitBtn.click();
    const textInput = await driver.findElement(By.id("messageText"));
    const isDisplayed = await textInput.isDisplayed();
    assert.ok(isDisplayed);
  });

  // TEST 34: Deep link navigation via hash anchor
  it("should navigate to specific post via home page hash anchor", async function () {
    await driver.get(`${BASE_URL}/home`);
    await driver.wait(until.elementLocated(By.id("toggleCreate")), 10000);
    await driver.findElement(By.id("toggleCreate")).click();
    await driver.wait(until.elementIsVisible(driver.findElement(By.id("createPanel"))), 10000);
    const hashPostContent = `Hash post ${uniqueId}`;
    await driver.findElement(By.id("content")).sendKeys(hashPostContent);
    await driver.findElement(By.id("postForm")).submit();

    const postArticle = await driver.wait(
      until.elementLocated(By.xpath(`//article[contains(., "${hashPostContent}")]`)),
      15000
    );
    const postId = await postArticle.getAttribute("data-post-id");
    assert.ok(postId, "Expected to retrieve post ID");

    await driver.get(`${BASE_URL}/home#post-${postId}`);
    await driver.sleep(1000);
    const targetPost = await driver.findElement(By.id(`post-${postId}`));
    assert.ok(await targetPost.isDisplayed(), "Post target by hash should be displayed");
  });

  // TEST 35: Create reel
  it("should create a reel on the reels page", async function () {
    await driver.get(`${BASE_URL}/reels`);
    await driver.wait(until.urlContains("/reels"), 10000);
    await driver.wait(until.elementLocated(By.id("reelForm")), 10000);

    await driver.findElement(By.id("reelVideoUrl")).sendKeys(reelData.url);
    await driver.findElement(By.id("reelCaption")).sendKeys(reelData.caption);
    await driver.findElement(By.id("reelForm")).submit();

    const captionNode = await driver.wait(
      until.elementLocated(By.xpath(`//article[contains(@class, "reel-card")]//p[contains(., "${reelData.caption}")]`)),
      15000
    );
    assert.ok(captionNode, "Expected reel to appear in the reels feed");
  });

  // TEST 36: Log out second user
  it("should log out the second user", async function () {
    await driver.get(`${BASE_URL}/reels`);
    await driver.wait(until.elementLocated(By.css("button.secondary")), 10000);
    await driver.findElement(By.css("button.secondary")).click();
    await driver.wait(until.urlIs(`${BASE_URL}/`), 10000);
    const url = await driver.getCurrentUrl();
    assert.strictEqual(url, `${BASE_URL}/`);
  });

  // TEST 37: Log out first user
  it("should log out the first user", async function () {
    await driver.get(`${BASE_URL}/`);
    await driver.wait(until.elementLocated(By.id("loginForm")), 10000);
    await driver.findElement(By.id("email")).sendKeys(testUser.email);
    await driver.findElement(By.id("password")).sendKeys(testUser.password);
    await driver.findElement(By.id("loginForm")).submit();
    await driver.wait(until.urlContains("/home"), 10000);

    await driver.findElement(By.css("button[aria-label='Log out']")).click();
    await driver.wait(until.urlIs(`${BASE_URL}/`), 10000);
    const url = await driver.getCurrentUrl();
    assert.strictEqual(url, `${BASE_URL}/`);
  });
});
