const puppeteer = require("puppeteer");

const getBrowser = async () => {
  const customArgs = [
    `--no-sandbox`,
    "--disable-setuid-sandbox",
    `--start-maximized`,
    `--load-extension=./salesql-browser-extension-v4.6.0`,
  ];
  return await puppeteer.launch({
    executablePath: process.env.PUPPETEER_EXEC_PATH,
    headless: false,
    ignoreDefaultArgs: ["--disable-extensions", "--enable-automation"],
    args: customArgs,
  });
};

const getExtensionUrl = async (browser) => {
  const extensionName = "SalesQL Browser Extension";

  const targets = await browser.targets();
  const extensionTarget = targets.find(({ _targetInfo }) => {
    return _targetInfo.title === extensionName && _targetInfo.type === "background_page";
  });

  const extensionURL = extensionTarget?._targetInfo.url || "";
  const urlSplit = extensionURL.split("/");
  const extensionID = urlSplit[2];
  const extensionEndURL = "popup/popup.html";

  return `chrome-extension://${extensionID}/${extensionEndURL}#/login`;
};

module.exports = {
  getBrowser,
  getExtensionUrl,
};
