const TelegramBot = require("node-telegram-bot-api");
const cron = require('node-cron');
const {XMLParser} = require("fast-xml-parser");
const CONFIG = require("./constants.json");
const axios = require("axios");
// Initialize Telegram bot
const bot = new TelegramBot(CONFIG.telegram_bot_token, {polling: false});
const options = {ignoreAttributes: false};
const parser = new XMLParser(options);

const checkFirmware = async () => {
  const chatId = CONFIG.telegram_group_id;
  const date = new Date();
  try {
    const response = await axios.get("https://fota-cloud-dn.ospserver.net/firmware/XAC/SM-S901W/version.xml", {
      headers: {
        "User-Agent": CONFIG.user_agent
      },
    });
    const parsedData = parser.parse(response.data);
    const versions = parsedData.versioninfo.firmware.version.latest["#text"].split("/")
    let newVersionFound = versions[0].includes("U2") || ( versions[2] && versions[2].includes("U2"));
    let message = `[SM-S901W][XAC] Latest FW: ${versions.join(" / ")}`;
    if (newVersionFound) {
      message = `${CONFIG.telegram_user_name}: NEW FIRMWARE FOUND! GO AND FIX YOUR PHONE!!!\n` + message;
    }
    console.log(date.toISOString(), message);
    await bot.sendMessage(chatId, message);
  } catch (error) {
    console.log(date.toISOString(), "[ERROR]", error.message);
    await bot.sendMessage(chatId, "Error during fetch: " + error.message);
  }
}

bot.on("polling_error", console.log);
cron.schedule("*/10 * * * *", checkFirmware, {});
