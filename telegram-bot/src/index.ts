import { Telegraf } from "telegraf";
import dotenv from "dotenv";
import { callBackend, linkTelegramAccount } from "./apiClient";

dotenv.config();

const token = process.env.BOT_TOKEN;
if (!token) {
  throw new Error("BOT_TOKEN non definito");
}

const bot = new Telegraf(token);

bot.start(async (ctx) => {
  const startPayload = ctx.startPayload;
  
  // Check if this is a deep link for account linking
  if (startPayload && startPayload.startsWith("link_")) {
    const linkToken = startPayload.replace("link_", "");
    const telegramId = ctx.from.id.toString();
    const telegramUsername = ctx.from.username;
    
    try {
      const result = await linkTelegramAccount(linkToken, telegramId, telegramUsername);
      
      if (result.success) {
        await ctx.reply(
          "✅ *Account linked successfully!*\n\n" +
          "You will now receive notifications about your reports directly here on Telegram.\n\n" +
          "Use /help to see available commands.",
          { parse_mode: "Markdown" }
        );
      } else {
        await ctx.reply(
          "❌ *Failed to link account*\n\n" +
          `Error: ${result.message}\n\n` +
          "Please try generating a new link from the Participium website.",
          { parse_mode: "Markdown" }
        );
      }
    } catch (error: any) {
      console.error("Link error:", error.response?.data || error.message);
      
      let errorMessage = "An error occurred while linking your account.";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      await ctx.reply(
        "❌ *Failed to link account*\n\n" +
        `Error: ${errorMessage}\n\n` +
        "Please try generating a new link from the Participium website.",
        { parse_mode: "Markdown" }
      );
    }
    return;
  }
  
  // Normal start message
  await ctx.reply(
    "👋 *Welcome to Participium Bot!*\n\n" +
    "I will send you notifications about your civic reports.\n\n" +
    "To link your account, please go to the Participium website and click on the Telegram icon in the navigation bar.\n\n" +
    "Use /help to see available commands.",
    { parse_mode: "Markdown" }
  );
});

bot.command("help", (ctx) => {
  ctx.reply(
    "📖 *Available Commands*\n\n" +
    "/start - Start the bot\n" +
    "/health - Check backend connectivity\n" +
    "/help - Show this message",
    { parse_mode: "Markdown" }
  );
});

bot.command("health", async (ctx) => {
  try {
    const result = await callBackend();
    ctx.reply(`✅ Backend status: ${result}`);
  } catch (error) {
    console.error("Health check error:", error);
    ctx.reply("❌ Failed to connect to backend. Please try again later.");
  }
});

bot.catch((err, ctx) => {
  console.error(`Error for ${ctx.updateType}:`, err);
  ctx.reply("An error occurred. Please try again.").catch(console.error);
});

bot.launch();

console.log("Bot Telegram running");

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
