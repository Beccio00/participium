import { Telegraf, Markup } from "telegraf";
import dotenv from "dotenv";
import { 
  linkTelegramAccount, 
  createReport, 
  CreateReportData,
  getMyReports,
  getReportStatus
} from "./apiClient";
import { isPointInTurin } from "./turinBoundaries";

dotenv.config();

const token = process.env.BOT_TOKEN;
if (!token) {
  throw new Error("BOT_TOKEN non definito");
}

//helper functions

function formatStatus(status: string): string{
  const statusMap: Record<string, string> = {
    PENDING_APPROVAL: "⏳ Waiting Approval",
    APPROVED: "📝 Approved",
    ASSIGNED: "👷 Assigned",
    EXTERNAL_ASSIGNED: "🚜 Assigned to External",
    IN_PROGRESS: "🚧 In Progress",
    SUSPENDED: "⏸️ Suspended",
    REJECTED: "❌ Rejected",
    RESOLVED: "✅ Resolved",
  };
  return statusMap[status] || status;
}

function getCategoryLabel(value: string): string {
  return REPORT_CATEGORIES.find(c => c.value === value)?.label || value;
}

const bot = new Telegraf(token);

const REPORT_CATEGORIES = [
  { value: "WATER_SUPPLY_DRINKING_WATER", label: "💧 Water Supply" },
  { value: "ARCHITECTURAL_BARRIERS", label: "♿ Architectural Barriers" },
  { value: "SEWER_SYSTEM", label: "🚰 Sewer System" },
  { value: "PUBLIC_LIGHTING", label: "💡 Public Lighting" },
  { value: "WASTE", label: "🗑️ Waste" },
  { value: "ROAD_SIGNS_TRAFFIC_LIGHTS", label: "🚦 Road Signs & Traffic Lights" },
  { value: "ROADS_URBAN_FURNISHINGS", label: "🛣️ Roads & Urban Furnishings" },
  { value: "PUBLIC_GREEN_AREAS_PLAYGROUNDS", label: "🌳 Green Areas & Playgrounds" },
  { value: "OTHER", label: "📋 Other" },
];

interface ReportSession {
  step: "title" | "description" | "category" | "photos" | "location" | "anonymous" | "confirm";
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

bot.start(async (ctx) => {
  const startPayload = ctx.startPayload;
  
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
    "/newreport - Create a new civic report\n" +
    "/myreports - View your recent reports\n" +
    "/reportstatus <ID_REPORT> - Get status of a specific report\n" +
    "/cancel - Cancel current operation\n" +
    "/help - Show this message",
    { parse_mode: "Markdown" }
  );
});

bot.command("cancel", async (ctx) => {
  const chatId = ctx.chat.id;
  if (reportSessions.has(chatId)) {
    reportSessions.delete(chatId);
    await ctx.reply("❌ Report creation cancelled.", { parse_mode: "Markdown" });
  } else {
    await ctx.reply("No active operation to cancel.");
  }
});

bot.command("myreports", async (ctx) => {
  const telegramId = ctx.from.id.toString();

  try{
    const reports = await getMyReports(telegramId);

    if(!reports || reports.length === 0){
      await ctx.reply(
        "📋 *My Reports*\n\n" +
        "You have not submitted any reports yet.",
        { parse_mode: "Markdown" }
      );
      return;
    }
    let message = "Your recent reports:\n\n";

    reports.slice(0,10).forEach((report:any)=> {
      const statusIcon = formatStatus(report.status).split(" ")[0]; //only emoji
      message += `🆔 *#${report.id}* - ${statusIcon} ${report.title}\n`;
      message += `📅 ${new Date(report.createdAt).toLocaleDateString()}\n`;
      message += `👉 /reportstatus ${report.id}\n\n`;
    })
    await ctx.reply(message, { parse_mode: "Markdown" });
  }catch(error:any){
    console.error("Get my reports error:", error.response?.data || error.message);
    if (error.response?.status === 404) {
      await ctx.reply(
        "⚠️ *Account not linked*\n\n" +
        "To view your reports, you must first link your Telegram account through the Participium website.",
        { parse_mode: "Markdown" }
      );
    } else {
      await ctx.reply("❌ An error occurred while retrieving your reports.");
    }
  }
});

bot.command("reportstatus", async (ctx) => {
  const telegramId = ctx.from.id.toString();
  const text = ctx.message.text.trim();
  
  // Estrae l'ID dal comando (es: "/reportstatus 1024" -> "1024")
  const parts = text.split(" ");
  const reportIdStr = parts[1];

  if (!reportIdStr || isNaN(Number(reportIdStr))) {
    await ctx.reply(
      "⚠️ *Utilizzo corretto:*\n" +
      "/reportstatus <ID_REPORT>\n\n" +
      "Esempio: `/reportstatus 123`",
      { parse_mode: "Markdown" }
    );
    return;
  }

  const reportId = parseInt(reportIdStr);

  try {
    const report = await getReportStatus(telegramId, reportId);

    let details = `📄 *Report details #${report.id}*\n\n`;
    details += `📝 *Title:* ${report.title}\n`;
    details += `🏷️ *Category:* ${getCategoryLabel(report.category)}\n`;
    details += `📊 *Status:* ${formatStatus(report.status)}\n`;
    details += `📅 *Date:* ${new Date(report.createdAt).toLocaleString()}\n\n`;
    
    details += `ℹ️ *Description:*\n${report.description}\n\n`;

    //if there is a rejection reason
    if (report.status === 'REJECTED' && report.rejectedReason) {
      details += `❌ *Rejection reason:* ${report.rejectedReason}\n\n`;
    }

    //if assigned
    if (report.assignedOfficer) {
      details += `👷 *Assigned to:* Technical Office\n`;
    } else if (report.externalHandler) {
      const handlerName = report.externalHandler.company ? report.externalHandler.company.name : "External Maintainer";
      details += `🚜 *Assigned to:* ${handlerName}\n`;
    }

    //if there are messages (public comments)
    if (report.messages && report.messages.length > 0) {
        details += `\n💬 *Latest messages:*\n`;
        //show only the last message for brevity
        const lastMsg = report.messages[report.messages.length - 1];
        const sender = lastMsg.senderRole.includes('CITIZEN') ? 'You' : 'Staff';
        details += `*${sender}:* ${lastMsg.content}\n`;
    }

    await ctx.reply(details, { parse_mode: "Markdown" });

  } catch (error: any) {
    console.error("ReportStatus error:", error.response?.data || error.message);

    if (error.response?.status === 404) {
      // Could be non-existent report or unlinked user
      if (error.response.data?.message?.includes("linked")) {
         await ctx.reply("⚠️ Account not linked. Link it from the website.");
      } else {
         await ctx.reply("❌ Report not found or does not belong to you.");
      }
    } else if (error.response?.status === 403) {
      await ctx.reply("⛔ You do not have permission to view this report.");
    } else {
      await ctx.reply("❌ Error retrieving report details.");
    }
  }
});

bot.command("newreport", async (ctx) => {
  const chatId = ctx.chat.id;
  const telegramId = ctx.from.id.toString();

  reportSessions.set(chatId, {
    step: "title",
    data: { telegramId },
    photoFileIds: [],
    createdAt: Date.now(),
  });

  await ctx.reply(
    "📝 *Create New Report*\n\n" +
    "Let's create a new civic report step by step.\n" +
    "You can type /cancel at any time to abort.\n\n" +
    "*Step 1/6: Title*\n" +
    "Please enter a brief title for your report (e.g., \"Broken streetlight on Via Roma\"):",
    { parse_mode: "Markdown" }
  );
});

bot.action(/^category_(.+)$/, async (ctx) => {
  const chatId = ctx.chat!.id;
  const session = reportSessions.get(chatId);

  if (!session || session.step !== "category") {
    await ctx.answerCbQuery("Session expired. Please start again with /newreport");
    return;
  }

  const category = ctx.match[1];
  const categoryLabel = REPORT_CATEGORIES.find(c => c.value === category)?.label || category;

  session.data.category = category;
  session.step = "photos";
  reportSessions.set(chatId, session);

  await ctx.answerCbQuery(`Selected: ${categoryLabel}`);
  await ctx.editMessageText(
    `✅ Category: ${categoryLabel}\n\n` +
    "*Step 4/6: Photos*\n" +
    "Please send photos of the issue (minimum 1, maximum 3).\n\n" +
    "📷 Send one or more photos, then press the button below when done.\n\n" +
    `Photos uploaded: 0/3`,
    {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard([
        [Markup.button.callback("✅ Done uploading photos", "photos_done")],
      ]),
    }
  );
});

bot.action("photos_done", async (ctx) => {
  const chatId = ctx.chat!.id;
  const session = reportSessions.get(chatId);

  if (!session || session.step !== "photos") {
    await ctx.answerCbQuery("Session expired. Please start again with /newreport");
    return;
  }

  if (session.photoFileIds.length === 0) {
    await ctx.answerCbQuery("⚠️ Please upload at least 1 photo before continuing");
    return;
  }

  session.step = "location";
  session.data.photoFileIds = session.photoFileIds;
  reportSessions.set(chatId, session);

  await ctx.answerCbQuery(`${session.photoFileIds.length} photo(s) uploaded`);
  await ctx.editMessageText(
    `✅ Photos: ${session.photoFileIds.length} uploaded\n\n` +
    "*Step 5/6: Location*\n" +
    "Please share the location of the issue.\n\n" +
    "📍 Tap the 📎 button → Location → Send your current location\n" +
    "Or send a location manually.",
    { parse_mode: "Markdown" }
  );
});

bot.action(/^anonymous_(yes|no)$/, async (ctx) => {
  const chatId = ctx.chat!.id;
  const session = reportSessions.get(chatId);

  if (!session || session.step !== "anonymous") {
    await ctx.answerCbQuery("Session expired. Please start again with /newreport");
    return;
  }

  const isAnonymous = ctx.match[1] === "yes";
  session.data.isAnonymous = isAnonymous;
  session.step = "confirm";
  reportSessions.set(chatId, session);

  await ctx.answerCbQuery(isAnonymous ? "Anonymous report" : "Public report");

  const categoryLabel = REPORT_CATEGORIES.find(c => c.value === session.data.category)?.label || session.data.category;
  const photoCount = session.photoFileIds?.length || 0;

  await ctx.editMessageText(
    "📋 *Report Summary*\n\n" +
    `*Title:* ${session.data.title}\n` +
    `*Description:* ${session.data.description}\n` +
    `*Category:* ${categoryLabel}\n` +
    `*Photos:* ${photoCount} photo(s)\n` +
    `*Location:* ${session.data.latitude?.toFixed(6)}, ${session.data.longitude?.toFixed(6)}\n` +
    `*Anonymous:* ${isAnonymous ? "Yes" : "No"}\n\n` +
    "Is this correct?",
    {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard([
        [
          Markup.button.callback("✅ Confirm & Submit", "confirm_yes"),
          Markup.button.callback("❌ Cancel", "confirm_no"),
        ],
      ]),
    }
  );
});

bot.action("confirm_yes", async (ctx) => {
  const chatId = ctx.chat!.id;
  const session = reportSessions.get(chatId);

  if (!session || session.step !== "confirm") {
    await ctx.answerCbQuery("Session expired. Please start again with /newreport");
    return;
  }

  await ctx.answerCbQuery("Submitting report...");

  try {
    const result = await createReport(session.data as CreateReportData);

    reportSessions.delete(chatId);

    await ctx.editMessageText(
      "✅ *Report Submitted Successfully!*\n\n" +
      `Your report has been created with ID: *#${result.reportId}*\n\n` +
      "You will receive notifications here when there are updates on your report.\n\n" +
      "Thank you for helping improve our city! 🏙️",
      { parse_mode: "Markdown" }
    );
  } catch (error: any) {
    console.error("Create report error:", error.response?.data || error.message);

    let errorMessage = "An error occurred while creating the report.";
    if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    }

    await ctx.editMessageText(
      "❌ *Failed to Create Report*\n\n" +
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
    "Your report has been discarded. Use /newreport to start again.",
    { parse_mode: "Markdown" }
  );
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
      "⚠️ Maximum 3 photos allowed. Press the button to continue.",
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

    await ctx.reply(
      `📷 ${currentSession.photoFileIds.length} photo(s) received!\n\n` +
      (remaining > 0 ? `You can add ${remaining} more photo(s).\n` : "Maximum photos reached.\n") +
      "Press the button below when done.",
      {
        parse_mode: "Markdown",
        ...Markup.inlineKeyboard([
          [Markup.button.callback("✅ Done uploading photos", "photos_done")],
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
      "⚠️ *Location outside Turin*\n\n" +
      "The location you sent is outside the Turin municipality boundaries.\n\n" +
      "Please send a location within Turin to continue.",
      { parse_mode: "Markdown" }
    );
    return;
  }

  session.data.latitude = latitude;
  session.data.longitude = longitude;
  session.step = "anonymous";
  reportSessions.set(chatId, session);

  await ctx.reply(
    `✅ Location received: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}\n\n` +
    "*Step 6/6: Anonymous Report*\n" +
    "Do you want to submit this report anonymously?\n" +
    "(Your identity won't be shown publicly)",
    {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard([
        [
          Markup.button.callback("👤 Yes, Anonymous", "anonymous_yes"),
          Markup.button.callback("📛 No, Show my name", "anonymous_no"),
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
          "⚠️ Title is too short. Please enter at least 5 characters.",
          { parse_mode: "Markdown" }
        );
        return;
      }
      if (text.length > 100) {
        await ctx.reply(
          "⚠️ Title is too long. Please keep it under 100 characters.",
          { parse_mode: "Markdown" }
        );
        return;
      }

      session.data.title = text;
      session.step = "description";
      reportSessions.set(chatId, session);

      await ctx.reply(
        `✅ Title: "${text}"\n\n` +
        "*Step 2/6: Description*\n" +
        "Please provide a detailed description of the issue:",
        { parse_mode: "Markdown" }
      );
      break;

    case "description":
      if (text.length > 1000) {
        await ctx.reply(
          "⚠️ Description is too long. Please keep it under 1000 characters.",
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
        "✅ Description saved.\n\n" +
        "*Step 3/6: Category*\n" +
        "Please select the category that best describes the issue:",
        {
          parse_mode: "Markdown",
          ...Markup.inlineKeyboard(categoryButtons),
        }
      );
      break;

    case "photos":
      await ctx.reply(
        "📷 Please send a *photo* of the issue.\n\n" +
        "Minimum 1 photo, maximum 3 photos.",
        { parse_mode: "Markdown" }
      );
      break;

    case "location":
      await ctx.reply(
        "📍 Please share a *location* using the attachment button (📎).\n\n" +
        "Tap 📎 → Location → Send your current location or choose on map.",
        { parse_mode: "Markdown" }
      );
      break;

    case "anonymous":
    case "confirm":
      await ctx.reply(
        "Please use the buttons above to continue.",
        { parse_mode: "Markdown" }
      );
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
