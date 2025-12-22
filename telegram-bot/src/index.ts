import { Telegraf } from "telegraf";
import dotenv from "dotenv";
import { callBackend } from "./apiClient";

dotenv.config();

const token = process.env.BOT_TOKEN;
if (!token) {
  throw new Error("BOT_TOKEN non definito");
}

const bot = new Telegraf(token);

bot.start((ctx) => {
  ctx.reply("Hi there! I'm your Participium bot. Use /health to check backend connectivity.");
});

bot.command("health", async (ctx) => {
  try {
    const result = await callBackend();
    ctx.reply(`Backend answered: ${result}`);
  } catch (error) {
    console.error("Health check error:", error);
    ctx.reply("Failed to connect to backend. Please try again later.");
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
