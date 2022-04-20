const { getBrowser, getExtensionUrl } = require("./browser-helpers");
const { waitABit } = require("./utils");

class Miner {
  browser;
  extensionPage;
  linkedInPage;

  isReady = false;
  currentLinkedInProfile = null;
  currentMiningProcess = null;
  queue = [];

  async initialize() {
    this.browser = await getBrowser();
    await this.authenticate();

    this.isReady = true;
  }

  async authenticateLinkedIn() {
    console.log("Authenticating LinkedIn...");

    await this.linkedInPage.waitForSelector('input[type="text"]');
    await this.linkedInPage.waitForSelector('input[type="password"]');
    await this.linkedInPage.waitForSelector('button[type="submit"]');

    await this.linkedInPage.type('input[type="text"]', "<linkedin email>", { delay: 20 });
    await this.linkedInPage.type('input[type="password"]', "<linkedin password>  ", {
      delay: 20,
    });
    await this.linkedInPage.click('button[type="submit"]');

    console.log("Logged in at LinkedIn");
  }

  async authenticate() {
    console.log("Authenticating...");
    await waitABit();

    this.linkedInPage = await this.browser.newPage();
    await this.linkedInPage.goto(`https://www.linkedin.com/login`);
    console.log("Opened LinkedIn sign in page");

    await this.authenticateLinkedIn();

    const extensionUrl = await getExtensionUrl(this.browser);

    const extensionPage = await this.browser.newPage();
    await extensionPage.goto(extensionUrl);
    console.log("Opened extension sign in page");

    await extensionPage.type('input[type="text"]', "<salesql email>", { delay: 20 });
    await extensionPage.type('input[type="password"]', "<salesql password>  ", { delay: 20 });
    await extensionPage.click('button[class*="login-sign-in-button"]');

    await extensionPage.waitForSelector('[class="sql-extension-linkedin-notification"]');

    console.log("Logged in in extension");

    this.extensionPage = extensionPage;

    setInterval(() => {
      this.loadAvailableData();
    }, 1000);
  }

  async verifyAccount(verificationCode) {
    console.log(`Verifying with code ${verificationCode}...`);

    await this.linkedInPage.bringToFront();
    console.log("Opened LinkedIn tab");

    await this.linkedInPage.waitForSelector('input[name="pin"]');
    await this.linkedInPage.waitForSelector('button[type="submit"]');
    console.log("Found selectors");

    await this.linkedInPage.type('input[name="pin"]', verificationCode, { delay: 20 });
    await this.linkedInPage.click('button[type="submit"]');
    console.log(`Submitted code ${verificationCode}`);

    console.log("Waiting for 2 seconds...");
    await waitABit(2000);

    console.log(
      await this.linkedInPage.evaluate(
        () => `URL after LinkedIn verification: ${location.href}`
      )
    );
  }

  async loadAvailableData() {
    await this.extensionPage.evaluate(() => {
      document.querySelector('div[class="action-button success pointer"]')?.click();
    });
  }

  async mineEmail(url) {
    console.log("Started mining", url);

    await this.linkedInPage.goto(url);
    console.log(await this.linkedInPage.evaluate(() => `Opened page: ${location.href}`));

    if (await this.linkedInPage.evaluate(() => location.href.includes("authwall"))) {
      console.log("Met authwall");
      await this.authenticateLinkedIn();
    }

    console.log("Opened extension tab");

    await this.extensionPage.waitForSelector(`[linkedinurl]`);
    const email = await this.extensionPage.evaluate((url) => {
      return new Promise((res) => {
        let result = "";
        let emailCheckCount = 0;
        let expectEmail = setInterval(() => {
          const allProcessedPeople = document.querySelectorAll(`[linkedinurl]`);
          result = Array.from(allProcessedPeople).find(
            (element) =>
              element.attributes.linkedinurl?.value?.includes?.(url) ||
              url.includes(element.attributes.linkedinurl?.value)
          )?.attributes?.personalemail?.value;

          if (result) {
            res(result);
          }

          if (++emailCheckCount === 15) {
            clearInterval(expectEmail);
            res("Failed to get email");
          }
        }, 1000);
      });
    }, url);

    console.log("Email parsing result:", email);

    this.queue = this.queue.slice(1);

    return email;
  }

  async mineEmailFromLinkedIn(url) {
    this.queue.push(url);

    if (this.queue.length === 1) {
      this.currentLinkedInProfile = url;
      this.currentMiningProcess = this.mineEmail(url);
      return await this.currentMiningProcess;
    }

    while (this.currentLinkedInProfile !== url) {
      await this.currentMiningProcess;

      this.currentLinkedInProfile = url;
      this.currentMiningProcess = this.mineEmail(this.queue[0]);
    }

    return await this.currentMiningProcess;
  }
}

module.exports = Miner;
