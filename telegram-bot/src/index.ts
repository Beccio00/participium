import { Telegraf, Markup } from "telegraf";
import dotenv from "dotenv";
import {
  linkTelegramAccount,
  createReport,
  checkLinked,
  CreateReportData,
} from "./apiClient";
import { isPointInTurin } from "./turinBoundaries";

dotenv.config();

const token = process.env.BOT_TOKEN;
if (!token) {
  throw new Error("BOT_TOKEN non definito");
}

const bot = new Telegraf(token);

const REPORT_CATEGORIES = [
  { value: "WATER_SUPPLY_DRINKING_WATER", label: "💧 Water Supply" },
  { value: "ARCHITECTURAL_BARRIERS", label: "♿ Architectural Barriers" },
  { value: "SEWER_SYSTEM", label: "🚰 Sewer System" },
  { value: "PUBLIC_LIGHTING", label: "💡 Public Lighting" },
  { value: "WASTE", label: "🗑️ Waste" },
  {
    value: "ROAD_SIGNS_TRAFFIC_LIGHTS",
    label: "🚦 Road Signs & Traffic Lights",
  },
  { value: "ROADS_URBAN_FURNISHINGS", label: "🛣️ Roads & Urban Furnishings" },
  {
    value: "PUBLIC_GREEN_AREAS_PLAYGROUNDS",
    label: "🌳 Green Areas & Playgrounds",
  },
  { value: "OTHER", label: "📋 Other" },
];

interface ReportSession {
  step:
    | "title"
    | "description"
    | "category"
    | "photos"
    | "location"
    | "anonymous"
    | "confirm";
  data: Partial<CreateReportData>;
  photoFileIds: string[];
  createdAt: number;
}

const reportSessions = new Map<number, ReportSession>();

function cleanOldSessions() {
  const now = Date.now();
  const maxAge = 30 * 60 * 1000; // 30 minutes
  for (const [chatId, session] of reportSessions.entries()) {
    if (now - session.createdAt > maxAge) {
      reportSessions.delete(chatId);
    }
  }
}

setInterval(cleanOldSessions, 5 * 60 * 1000);

const showMainMenu = (ctx: any) => {
  return ctx.reply(
    "🏛️ *Participium Bot*\n" +
      "Your civic engagement platform\n\n" +
      "What would you like to do?",
    {
      parse_mode: "Markdown",
      ...Markup.keyboard([["📝 New Report"], ["📚 Help", "ℹ️ About"]])
        .resize()
        .persistent(),
    }
  );
};

bot.start(async (ctx) => {
  const startPayload = ctx.startPayload;

  if (startPayload && startPayload.startsWith("link_")) {
    const linkToken = startPayload.replace("link_", "");
    const telegramId = ctx.from.id.toString();
    const telegramUsername = ctx.from.username;

    try {
      const result = await linkTelegramAccount(
        linkToken,
        telegramId,
        telegramUsername
      );

      if (result.success) {
        await ctx.reply(
          "✅ *Account Linked Successfully!*\n\n" +
            "━━━━━━━━━━━━━━━━━━━━\n" +
            "You will now receive notifications about your reports directly here on Telegram.\n\n" +
            "🔔 Enable notifications to stay updated on your civic reports.",
          { parse_mode: "Markdown" }
        );
        await showMainMenu(ctx);
      } else {
        await ctx.reply(
          "❌ *Linking Failed*\n\n" +
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
        "❌ *Linking Failed*\n\n" +
          `Error: ${errorMessage}\n\n` +
          "Please try generating a new link from the Participium website.",
        { parse_mode: "Markdown" }
      );
    }
    return;
  }

  await ctx.reply(
    "👋 *Welcome to Participium Bot!*\n\n" +
      "━━━━━━━━━━━━━━━━━━━━\n" +
      "Your civic engagement platform\n\n" +
      "📍 Report issues in your city\n" +
      "🔔 Get real-time notifications\n" +
      "👥 Help improve your community\n\n" +
      "🔗 *First Step:*\n" +
      "Go to the Participium website and link your account by clicking the Telegram icon in the navigation bar.",
    { parse_mode: "Markdown" }
  );
});

bot.command("help", (ctx) => {
  ctx.reply(
    "📖 *Available Commands*\n\n" +
      "━━━━━━━━━━━━━━━━━━━━\n" +
      "*📝 /newreport* - Create a new civic report\n" +
      "*📋 /status* - Check linked account status\n" +
      "*❌ /cancel* - Cancel current operation\n" +
      "*📞 /help* - Show this help message\n\n" +
      "*💡 Tips:*\n" +
      "• Use the menu buttons for quick access\n" +
      "• You can cancel any report creation with /cancel\n" +
      "• Report creation expires after 30 minutes of inactivity",
    { parse_mode: "Markdown" }
  );
});

bot.command("status", async (ctx) => {
  const telegramId = ctx.from.id.toString();
  try {
    const status = await checkLinked(telegramId);
    if (status.linked) {
      await ctx.reply(
        "✅ *Account Status*\n\n" +
          "━━━━━━━━━━━━━━━━━━━━\n" +
          "🔗 Your Telegram account is linked to Participium.\n\n" +
          "You will receive notifications about your civic reports here.",
        { parse_mode: "Markdown" }
      );
    } else {
      await ctx.reply(
        "⚠️ *Not Linked*\n\n" +
          "━━━━━━━━━━━━━━━━━━━━\n" +
          "Your Telegram account is not linked to any Participium user.\n\n" +
          "Please link your account on the Participium website by clicking the Telegram icon in the navigation bar.",
        { parse_mode: "Markdown" }
      );
    }
  } catch (error) {
    console.error("checkLinked error:", error);
    await ctx.reply(
      "An error occurred while checking your account status. Please try again."
    );
  }
});

bot.command("cancel", async (ctx) => {
  const chatId = ctx.chat.id;
  if (reportSessions.has(chatId)) {
    reportSessions.delete(chatId);
    await ctx.reply(
      "❌ *Report creation cancelled.*\n\nYou can start a new report anytime with /newreport",
      { parse_mode: "Markdown" }
    );
    await showMainMenu(ctx);
  } else {
    await ctx.reply("No active operation to cancel.", {
      parse_mode: "Markdown",
    });
    await showMainMenu(ctx);
  }
});

// Handle main menu buttons
bot.hears("📝 New Report", async (ctx) => {
  await ctx.deleteMessage().catch(() => {});
  const chatId = ctx.chat.id;
  const telegramId = ctx.from.id.toString();
  try {
    const status = await checkLinked(telegramId);
    if (!status.linked) {
      await ctx.reply(
        "⚠️ *Account Not Linked*\n\n" +
          "━━━━━━━━━━━━━━━━━━━━\n" +
          "Your Telegram account is not linked to any Participium user.\n\n" +
          "📍 *How to Link:*\n" +
          "1. Go to the Participium website\n" +
          "2. Click the Telegram icon in the navigation bar\n" +
          "3. Authorize the connection\n" +
          "4. Return here and try again",
        { parse_mode: "Markdown" }
      );
      return;
    }
  } catch (error: any) {
    console.error("checkLinked error:", error.response?.data || error.message);
    await ctx.reply(
      "❌ An error occurred while checking your account link. Please try again later."
    );
    return;
  }

  reportSessions.set(chatId, {
    step: "title",
    data: { telegramId },
    photoFileIds: [],
    createdAt: Date.now(),
  });

  await ctx.reply(
    "📝 *Create New Civic Report*\n\n" +
      "━━━━━━━━━━━━━━━━━━━━\n" +
      "Let's create a new report step by step.\n" +
      "You can type /cancel at any time to abort.\n\n" +
      "*[Step 1/6] 📝 Report Title*\n\n" +
      "Please enter a brief title for your report.\n" +
      'Example: "Broken streetlight on Via Roma"\n\n' +
      "⏱️ Minimum 5 characters, maximum 100 characters",
    { parse_mode: "Markdown" }
  );
});

bot.hears("📚 Help", (ctx) => {
  ctx.deleteMessage().catch(() => {});
  ctx.reply(
    "📖 *Available Commands*\n\n" +
      "━━━━━━━━━━━━━━━━━━━━\n" +
      "*📝 /newreport* - Create a new civic report\n" +
      "*📋 /status* - Check linked account status\n" +
      "*❌ /cancel* - Cancel current operation\n" +
      "*📞 /help* - Show this help message\n\n" +
      "*💡 Tips:*\n" +
      "• Use the menu buttons for quick access\n" +
      "• You can cancel any report creation with /cancel\n" +
      "• Report creation expires after 30 minutes of inactivity",
    { parse_mode: "Markdown" }
  );
});

bot.hears("ℹ️ About", (ctx) => {
  ctx.deleteMessage().catch(() => {});
  ctx.reply(
    "ℹ️ *About Participium*\n\n" +
      "━━━━━━━━━━━━━━━━━━━━\n" +
      "Participium is a civic engagement platform that helps citizens report issues in their city.\n\n" +
      "📍 *Features:*\n" +
      "• Report civic issues with photos\n" +
      "• Get real-time notifications\n" +
      "• Track your reports\n" +
      "• Help improve your community\n\n" +
      "🌐 Visit: participium.example.com",
    { parse_mode: "Markdown" }
  );
});

bot.command("newreport", async (ctx) => {
  const chatId = ctx.chat.id;
  const telegramId = ctx.from.id.toString();
  try {
    const status = await checkLinked(telegramId);
    if (!status.linked) {
      await ctx.reply(
        "⚠️ *Account Not Linked*\n\n" +
          "━━━━━━━━━━━━━━━━━━━━\n" +
          "Your Telegram account is not linked to any Participium user.\n\n" +
          "📍 *How to Link:*\n" +
          "1. Go to the Participium website\n" +
          "2. Click the Telegram icon in the navigation bar\n" +
          "3. Authorize the connection\n" +
          "4. Return here and try again",
        { parse_mode: "Markdown" }
      );
      return;
    }
  } catch (error: any) {
    console.error("checkLinked error:", error.response?.data || error.message);
    await ctx.reply(
      "❌ An error occurred while checking your account link. Please try again later."
    );
    return;
  }

  reportSessions.set(chatId, {
    step: "title",
    data: { telegramId },
    photoFileIds: [],
    createdAt: Date.now(),
  });

  await ctx.reply(
    "📝 *Create New Civic Report*\n\n" +
      "━━━━━━━━━━━━━━━━━━━━\n" +
      "Let's create a new report step by step.\n" +
      "You can type /cancel at any time to abort.\n\n" +
      "*[Step 1/6] 📝 Report Title*\n\n" +
      "Please enter a brief title for your report.\n" +
      'Example: "Broken streetlight on Via Roma"\n\n' +
      "⏱️ Minimum 5 characters, maximum 100 characters",
    { parse_mode: "Markdown" }
  );
});

bot.action(/^category_(.+)$/, async (ctx) => {
  const chatId = ctx.chat!.id;
  const session = reportSessions.get(chatId);

  if (!session || session.step !== "category") {
    await ctx.answerCbQuery(
      "⚠️ Session expired. Please start again with /newreport"
    );
    return;
  }

  const category = ctx.match[1];
  const categoryLabel =
    REPORT_CATEGORIES.find((c) => c.value === category)?.label || category;

  session.data.category = category;
  session.step = "photos";
  reportSessions.set(chatId, session);

  await ctx.answerCbQuery(`✅ Selected: ${categoryLabel}`);
  await ctx.editMessageText(
    `✅ Category selected: ${categoryLabel}\n\n` +
      "━━━━━━━━━━━━━━━━━━━━\n\n" +
      "*[Step 4/6] 📷 Upload Photos*\n\n" +
      "Please send photos of the issue.\n\n" +
      "📌 Requirements:\n" +
      "• Minimum: 1 photo\n" +
      "• Maximum: 3 photos\n" +
      "• Format: JPG, PNG\n\n" +
      `Photos uploaded: 0/3`,
    {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard([
        [Markup.button.callback("✅ Done uploading", "photos_done")],
        [Markup.button.callback("← Back", "back_category")],
      ]),
    }
  );
});

bot.action("photos_done", async (ctx) => {
  const chatId = ctx.chat!.id;
  const session = reportSessions.get(chatId);

  if (!session || session.step !== "photos") {
    await ctx.answerCbQuery(
      "⚠️ Session expired. Please start again with /newreport"
    );
    return;
  }

  if (session.photoFileIds.length === 0) {
    await ctx.answerCbQuery(
      "⚠️ Please upload at least 1 photo before continuing"
    );
    return;
  }

  session.step = "location";
  session.data.photoFileIds = session.photoFileIds;
  reportSessions.set(chatId, session);

  await ctx.answerCbQuery(`✅ ${session.photoFileIds.length} photo(s) saved`);
  await ctx.editMessageText(
    `✅ Photos: ${session.photoFileIds.length} uploaded\n\n` +
      "━━━━━━━━━━━━━━━━━━━━\n\n" +
      "*[Step 5/6] 📍 Location*\n\n" +
      "Now we need the location of the issue.\n\n" +
      "*How to share your location:*\n" +
      "1. Tap the 📎 attachment button\n" +
      '2. Select "Location"\n' +
      "3. Send your current location or pin on map",
    { parse_mode: "Markdown" }
  );
});

bot.action(/^anonymous_(yes|no)$/, async (ctx) => {
  const chatId = ctx.chat!.id;
  const session = reportSessions.get(chatId);

  if (!session || session.step !== "anonymous") {
    await ctx.answerCbQuery(
      "⚠️ Session expired. Please start again with /newreport"
    );
    return;
  }

  const isAnonymous = ctx.match[1] === "yes";
  session.data.isAnonymous = isAnonymous;
  session.step = "confirm";
  reportSessions.set(chatId, session);

  await ctx.answerCbQuery(
    isAnonymous ? "✅ Anonymous report" : "✅ Public report"
  );

  const categoryLabel =
    REPORT_CATEGORIES.find((c) => c.value === session.data.category)?.label ||
    session.data.category;
  const photoCount = session.photoFileIds?.length || 0;

  await ctx.editMessageText(
    "📋 *Report Summary - Ready to Submit*\n\n" +
      "━━━━━━━━━━━━━━━━━━━━\n\n" +
      `*Title:*\n${session.data.title}\n\n` +
      `*Description:*\n${session.data.description}\n\n` +
      `*Category:* ${categoryLabel}\n` +
      `*Photos:* ${photoCount} photo(s)\n` +
      `*Location:* ${session.data.latitude?.toFixed(
        6
      )}, ${session.data.longitude?.toFixed(6)}\n` +
      `*Visibility:* ${isAnonymous ? "🔒 Anonymous" : "👤 Public"}\n\n` +
      "Everything correct? ✅",
    {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard([
        [
          Markup.button.callback("✅ Submit Report", "confirm_yes"),
          Markup.button.callback("❌ Edit", "confirm_no"),
        ],
      ]),
    }
  );
});

bot.action("confirm_yes", async (ctx) => {
  const chatId = ctx.chat!.id;
  const session = reportSessions.get(chatId);

  if (!session || session.step !== "confirm") {
    await ctx.answerCbQuery(
      "⚠️ Session expired. Please start again with /newreport"
    );
    return;
  }

  await ctx.answerCbQuery("⏳ Submitting report...");

  try {
    const result = await createReport(session.data as CreateReportData);

    reportSessions.delete(chatId);

    await ctx.editMessageText(
      "✅ *Report Submitted Successfully!*\n\n" +
        "━━━━━━━━━━━━━━━━━━━━\n\n" +
        `🎫 Report ID: *#${result.reportId}*\n\n` +
        "📌 *What's Next?*\n" +
        "• Your report has been submitted\n" +
        "• Municipalities will review and respond\n" +
        "• 🔔 You'll receive updates here\n\n" +
        "Thank you for helping improve our city! 🏙️",
      { parse_mode: "Markdown" }
    );

    await showMainMenu(ctx);
  } catch (error: any) {
    console.error(
      "Create report error:",
      error.response?.data || error.message
    );

    let errorMessage = "An error occurred while creating the report.";
    if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    }

    await ctx.editMessageText(
      "❌ *Failed to Create Report*\n\n" +
        "━━━━━━━━━━━━━━━━━━━━\n\n" +
        `Error: ${errorMessage}\n\n` +
        "Please try again with /newreport",
      { parse_mode: "Markdown" }
    );

    reportSessions.delete(chatId);
  }
});

bot.action("confirm_no", async (ctx) => {
  const chatId = ctx.chat!.id;
  reportSessions.delete(chatId);

  await ctx.answerCbQuery("Report cancelled");
  await ctx.editMessageText(
    "❌ *Report Cancelled*\n\n" +
      "━━━━━━━━━━━━━━━━━━━━\n\n" +
      "Your report has been discarded and you can start over anytime.\n\n" +
      "Use /newreport to create a new report.",
    { parse_mode: "Markdown" }
  );

  await showMainMenu(ctx);
});

const pendingPhotoConfirmations = new Map<number, NodeJS.Timeout>();

bot.on("photo", async (ctx) => {
  const chatId = ctx.chat.id;
  const session = reportSessions.get(chatId);

  if (!session || session.step !== "photos") {
    return;
  }

  if (session.photoFileIds.length >= 3) {
    await ctx.reply(
      "⚠️ *Maximum photos reached*\n\n" +
        "You've already uploaded 3 photos. Press the button below to continue.",
      { parse_mode: "Markdown" }
    );
    return;
  }

  const photos = ctx.message.photo;
  const bestPhoto = photos[photos.length - 1];

  session.photoFileIds.push(bestPhoto.file_id);
  reportSessions.set(chatId, session);

  const existingTimeout = pendingPhotoConfirmations.get(chatId);
  if (existingTimeout) {
    clearTimeout(existingTimeout);
  }

  const timeout = setTimeout(async () => {
    pendingPhotoConfirmations.delete(chatId);

    const currentSession = reportSessions.get(chatId);
    if (!currentSession || currentSession.step !== "photos") {
      return;
    }

    const remaining = 3 - currentSession.photoFileIds.length;
    const progressBar =
      "█".repeat(currentSession.photoFileIds.length) + "░".repeat(remaining);

    await ctx.reply(
      `📷 *Photo uploaded!*\n\n` +
        `Progress: ${progressBar}\n` +
        `Photos: ${currentSession.photoFileIds.length}/3\n\n` +
        (remaining > 0
          ? `📌 You can upload ${remaining} more photo(s).\n`
          : "✅ Maximum photos reached!\n") +
        "Press the button when done.",
      {
        parse_mode: "Markdown",
        ...Markup.inlineKeyboard([
          [Markup.button.callback("✅ Done uploading", "photos_done")],
        ]),
      }
    );
  }, 500);

  pendingPhotoConfirmations.set(chatId, timeout);
});

bot.on("location", async (ctx) => {
  const chatId = ctx.chat.id;
  const session = reportSessions.get(chatId);

  if (!session || session.step !== "location") {
    return;
  }

  const { latitude, longitude } = ctx.message.location;

  if (!isPointInTurin(latitude, longitude)) {
    await ctx.reply(
      "⚠️ *Location Outside Turin*\n\n" +
        "━━━━━━━━━━━━━━━━━━━━\n\n" +
        "The location you sent is outside the Turin municipality boundaries.\n\n" +
        "📍 Please send a location within Turin to continue.",
      { parse_mode: "Markdown" }
    );
    return;
  }

  session.data.latitude = latitude;
  session.data.longitude = longitude;
  session.step = "anonymous";
  reportSessions.set(chatId, session);

  await ctx.reply(
    `✅ Location saved: *${latitude.toFixed(6)}, ${longitude.toFixed(6)}*\n\n` +
      "━━━━━━━━━━━━━━━━━━━━\n\n" +
      "*[Step 6/6] 👁️ Report Visibility*\n\n" +
      "Should this report be submitted anonymously?\n\n" +
      "🔒 *Anonymous:* Your name won't be shown publicly\n" +
      "👤 *Public:* Your profile will be visible",
    {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard([
        [
          Markup.button.callback("🔒 Yes, Anonymous", "anonymous_yes"),
          Markup.button.callback("👤 No, Show my name", "anonymous_no"),
        ],
      ]),
    }
  );
});

bot.on("text", async (ctx) => {
  const chatId = ctx.chat.id;
  const session = reportSessions.get(chatId);

  if (!session) {
    return;
  }

  const text = ctx.message.text.trim();

  if (text.startsWith("/")) {
    return;
  }

  switch (session.step) {
    case "title":
      if (text.length < 5) {
        await ctx.reply(
          "⚠️ *Title is too short*\n\n" + "Please enter at least 5 characters.",
          { parse_mode: "Markdown" }
        );
        return;
      }
      if (text.length > 100) {
        await ctx.reply(
          "⚠️ *Title is too long*\n\n" + "Please keep it under 100 characters.",
          { parse_mode: "Markdown" }
        );
        return;
      }

      session.data.title = text;
      session.step = "description";
      reportSessions.set(chatId, session);

      await ctx.reply(
        `✅ Title saved: *${text}*\n\n` +
          "━━━━━━━━━━━━━━━━━━━━\n\n" +
          "*[Step 2/6] 📝 Detailed Description*\n\n" +
          "Please provide a detailed description of the issue.\n" +
          "Include what, where, and when if possible.\n\n" +
          "⏱️ Minimum 10 characters, maximum 1000 characters",
        { parse_mode: "Markdown" }
      );
      break;

    case "description":
      if (text.length < 10) {
        await ctx.reply(
          "⚠️ *Description is too short*\n\n" +
            "Please provide more details (at least 10 characters).",
          { parse_mode: "Markdown" }
        );
        return;
      }
      if (text.length > 1000) {
        await ctx.reply(
          "⚠️ *Description is too long*\n\n" +
            "Please keep it under 1000 characters.",
          { parse_mode: "Markdown" }
        );
        return;
      }

      session.data.description = text;
      session.step = "category";
      reportSessions.set(chatId, session);

      const categoryButtons = [];
      for (let i = 0; i < REPORT_CATEGORIES.length; i += 2) {
        const row = REPORT_CATEGORIES.slice(i, i + 2).map((cat) =>
          Markup.button.callback(cat.label, `category_${cat.value}`)
        );
        categoryButtons.push(row);
      }

      await ctx.reply(
        `✅ Description saved\n\n` +
          "━━━━━━━━━━━━━━━━━━━━\n\n" +
          "*[Step 3/6] 🏷️ Select Category*\n\n" +
          "What category best describes the issue?",
        {
          parse_mode: "Markdown",
          ...Markup.inlineKeyboard(categoryButtons),
        }
      );
      break;

    case "photos":
      await ctx.reply(
        "📷 *Please send a photo*\n\n" +
          "━━━━━━━━━━━━━━━━━━━━\n\n" +
          "We need at least 1 photo to continue.\n" +
          "You can send up to 3 photos.",
        { parse_mode: "Markdown" }
      );
      break;

    case "location":
      await ctx.reply(
        "📍 *Please share a location*\n\n" +
          "━━━━━━━━━━━━━━━━━━━━\n\n" +
          "How to share:\n" +
          "1. Tap the 📎 button\n" +
          '2. Select "Location"\n' +
          "3. Send your current location or choose on map",
        { parse_mode: "Markdown" }
      );
      break;

    case "anonymous":
    case "confirm":
      await ctx.reply("👆 *Please use the buttons above to continue.*", {
        parse_mode: "Markdown",
      });
      break;
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
