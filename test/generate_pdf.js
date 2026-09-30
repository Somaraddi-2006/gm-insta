const { Builder } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");
const fs = require("fs");
const path = require("path");

async function run() {
  console.log("Initializing headless Chrome...");
  const options = new chrome.Options();
  options.addArguments("--headless");
  options.addArguments("--disable-gpu");
  options.addArguments("--no-sandbox");
  options.addArguments("--disable-dev-shm-usage");
  
  const driver = await new Builder()
    .forBrowser("chrome")
    .setChromeOptions(options)
    .build();

  try {
    const htmlPath = path.resolve(__dirname, "report.html");
    const fileUrl = `file:///${htmlPath.replace(/\\/g, "/")}`;
    
    console.log(`Loading local report: ${fileUrl}`);
    await driver.get(fileUrl);
    
    // Wait for elements to load
    await driver.sleep(2000);
    
    console.log("Generating print PDF layout...");
    // driver.printPage returns a Base64 string of the PDF document
    const pdfBase64 = await driver.printPage({});
    
    const outputPath = path.resolve(__dirname, "selenium_test_report.pdf");
    fs.writeFileSync(outputPath, Buffer.from(pdfBase64, "base64"));
    console.log(`PDF successfully saved to: ${outputPath}`);
  } catch (err) {
    console.error("Failed to generate PDF:", err);
  } finally {
    await driver.quit();
  }
}

run();
