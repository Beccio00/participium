import { Telegraf, Markup } from "telegraf";
import dotenv from "dotenv";
import {
  linkTelegramAccount,
  createReport,
  CreateReportData,
  getMyReports,
  getReportStatus,
  checkLinked,
} from "./apiClient";
import { isPointInTurin } from "./turinBoundaries.js";

// Only load dotenv in development (not in Docker)
if (process.env.NODE_ENV !== "production") {
  dotenv.config();
}

const token = process.env.BOT_TOKEN;
if (!token) {
  console.error("Environment variables:");
  console.error("NODE_ENV:", process.env.NODE_ENV);
  console.error("BOT_TOKEN available:", !!process.env.BOT_TOKEN);
  console.error(
    "Available BOT vars:",
    Object.keys(process.env).filter((k) => k.includes("BOT"))
  );
  console.error("All env keys:", Object.keys(process.env).slice(0, 10));
  throw new Error("BOT_TOKEN non definito");
}

console.log("✅ BOT_TOKEN loaded successfully, length:", token.length);

//helper functions

function formatStatus(status: string): string {
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
  return REPORT_CATEGORIES.find((c) => c.value === value)?.label || value;
}

const bot = new Telegraf(token as string);

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

// Helper function to format reports list
function formatReportsList(
  reports: any[],
  page: number = 0
): { message: string; buttons: any[][]; totalPages: number } {
  const REPORTS_PER_PAGE = 6;
  const startIdx = page * REPORTS_PER_PAGE;
  const endIdx = startIdx + REPORTS_PER_PAGE;
  const paginatedReports = reports.slice(startIdx, endIdx);
  const totalPages = Math.ceil(reports.length / REPORTS_PER_PAGE);

  let message = `📋 *Your Reports* (Page ${page + 1}/${totalPages})\n\n`;
  const inlineButtons: any[][] = [];

  paginatedReports.forEach((report: any) => {
    const statusText = formatStatus(report.status);

    message += `\n`;
    message += `*#${report.reportId}* — ${report.title}\n`;
    message += `${statusText}\n`;
    message += `📍 ${report.address}\n`;
    message += `📅 ${new Date(report.createdAt).toLocaleDateString()}\n`;
    message += `\n\n`;
  });

  // Add report detail buttons (2 per row)
  for (let i = 0; i < paginatedReports.length; i += 2) {
    const row = [];
    row.push(
      Markup.button.callback(
        `Report #${paginatedReports[i].reportId}`,
        `report_details_${paginatedReports[i].reportId}`
      )
    );
    if (i + 1 < paginatedReports.length) {
      row.push(
        Markup.button.callback(
          `Report #${paginatedReports[i + 1].reportId}`,
          `report_details_${paginatedReports[i + 1].reportId}`
        )
      );
    }
    inlineButtons.push(row);
  }

  return { message, buttons: inlineButtons, totalPages };
}

// Helper function to safely edit message with error handling
async function safeEditMessage(
  ctx: any,
  text: string,
  options: any,
  fallbackAnswer?: string
) {
  try {
    await ctx.editMessageText(text, options);
  } catch (error: any) {
    if (
      error.description?.includes("message is not modified")
    ) {
      await ctx.answerCbQuery(fallbackAnswer || "⚠️ Already up to date");
    } else {
      throw error;
    }
  }
}

// Helper function to start report creation
async function startReportCreation(ctx: any, isCommand = false) {
  const chatId = ctx.chat.id;
  const telegramId = ctx.from.id.toString();

  reportSessions.set(chatId, {
    step: "title",
    data: { telegramId },
    photoFileIds: [],
    createdAt: Date.now(),
  });

  const message =
    "📝 *Create New Report*\n\n" +
    "✨ Let's create a civic report step by step.\n\n" +
    "*Step 1/6: Title*\n" +
    "📝 Please enter a brief title for your report.\n\n" +
    '💡 Example: "Broken streetlight on Via Roma"';

  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback("🏠 Main Menu", "menu_main")],
  ]);

  if (isCommand) {
    await ctx.reply(message, { parse_mode: "Markdown", ...keyboard });
  } else {
    await ctx.editMessageText(message, { parse_mode: "Markdown", ...keyboard });
  }
}

// Helper function to show main menu
async function showMainMenu(ctx: any) {
  await ctx.reply(
    "🎆 *Welcome to Participium Bot!*\n\n" +
      "📍 Submit new reports and track existing ones.\n" +
      "💪 Together we make our city better!\n\n" +
      "👇 *Choose an action:*\n" +
      "\nYou can also use /help, /faq, or /contact at any time.",
    {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard([
        [Markup.button.callback("📋 My Reports", "menu_myreports")],
        [Markup.button.callback("📝 New Report", "menu_newreport")],
        [Markup.button.callback("ℹ️ Help", "menu_help")],
        [Markup.button.callback("❓ FAQ", "menu_faq")],
        [Markup.button.callback("📞 Contact", "menu_contact")],
        [Markup.button.callback("🔗 Link Account", "menu_link_help")],
      ]),
    }
  );
}

bot.start(async (ctx) => {
  const startPayload = ctx.startPayload;

  if (startPayload?.startsWith("link_")) {
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
        return;
      } else {
        await ctx.reply(
          "❌ *Linking Failed*\n\n" +
            `Error: ${result.message}\n\n` +
            "Please try generating a new link from the Participium website.",
          { parse_mode: "Markdown" }
        );
        await showMainMenu(ctx);
        return;
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
      await showMainMenu(ctx);
      return;
    }
  }

  await showMainMenu(ctx);
});

bot.command("help", (ctx) => {
  ctx.reply(
    "🆘 Participium Bot Help\n\n" +
      "💡 Tip: Use the buttons below to navigate more easily!\n\n" +
      "Available commands:\n" +
      "/start - Show main menu\n" +
      "/help - Show this help\n" +
      "/faq - Frequently Asked Questions\n" +
      "/contact - City contacts and info",
    {
      parse_mode: "HTML",
      ...Markup.inlineKeyboard([
        [Markup.button.callback("🏠 Main Menu", "menu_main")],
        [Markup.button.callback("❓ FAQ", "menu_faq")],
        [Markup.button.callback("📞 Contact", "menu_contact")],
      ]),
    }
  );
});

// Inline menu actions for FAQ and Contact
bot.action("menu_faq", async (ctx) => {
  await ctx.answerCbQuery("❓ Loading FAQ...");
  const faqText =
    "❓ FAQ - Frequently Asked Questions\n\n" +
      "1. How can I report an issue?\n" +
      "Use the /start command and follow the instructions to submit a report.\n\n" +
      "2. How do I link my account?\n" +
      "Press the 'Link Account' button in the main menu and follow the instructions.\n\n" +
      "3. How can I check the status of my reports?\n" +
      "Use the 'My Reports' button in the main menu to see your reports.\n\n" +
      "4. Where can I submit reports?\n" +
      "Reports can be submitted only within the boundaries of the City of Turin.\n\n" +
      "5. I need help, who can I contact?\n" +
      "Use the /contact command to get support.";
  await ctx.editMessageText(faqText, {
    parse_mode: "HTML",
    ...Markup.inlineKeyboard([
      [Markup.button.callback("🏠 Main Menu", "menu_main")],
    ]),
  });
});

bot.action("menu_contact", async (ctx) => {
  await ctx.answerCbQuery("📞 Loading contact info...");
  const contactText =
    "📞 Contact & Info\n\n" +
    "- City Offices Contacts: https://www.comune.torino.it/amministrazione/uffici\n" +
    "- Official City Administration Website: https://www.comune.torino.it/amministrazione\n" +
    "- City Organization Chart: https://trasparenza.comune.torino.it/organizzazione/articolazione-uffici";
  await ctx.editMessageText(contactText, {
    parse_mode: "HTML",
    link_preview_options: { is_disabled: false },
    ...Markup.inlineKeyboard([
      [Markup.button.callback("🏠 Main Menu", "menu_main")],
    ]),
  });
});

// /contact command: provides contact info and useful links
bot.command("contact", (ctx) => {
  ctx.reply(
    "📞 Contact & Info\n\n" +
      "- City Offices Contacts: https://www.comune.torino.it/amministrazione/uffici\n" +
      "- Official City Administration Website: https://www.comune.torino.it/amministrazione\n" +
      "- City Organization Chart: https://trasparenza.comune.torino.it/organizzazione/articolazione-uffici",
    {
      parse_mode: "HTML",
      link_preview_options: { is_disabled: false },
      ...Markup.inlineKeyboard([
        [Markup.button.callback("🏠 Main Menu", "menu_main")],
      ]),
    }
  );
});

// /faq command: mostra domande frequenti
bot.command("faq", (ctx) => {
  ctx.reply(
    "❓ FAQ - Frequently Asked Questions\n\n" +
      "1. How can I report an issue?\n" +
      "Use the /start command and follow the instructions to submit a report.\n\n" +
      "2. How do I link my account?\n" +
      "Press the 'Link Account' button in the main menu and follow the instructions.\n\n" +
      "3. How can I check the status of my reports?\n" +
      "Use the 'My Reports' button in the main menu to see your reports.\n\n" +
      "4. Where can I submit reports?\n" +
      "Reports can be submitted only within the boundaries of the City of Turin.\n\n" +
      "5. I need help, who can I contact?\n" +
      "Use the /contact command to get support.",
    {
      parse_mode: "MarkdownV2",
      ...Markup.inlineKeyboard([
        [Markup.button.callback("🏠 Main Menu", "menu_main")],
      ]),
    }
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
  const telegramId = ctx.from.id.toString();
  try {
    const status = await checkLinked(telegramId);
    if (!status.linked) {
      await ctx.reply(
        "⚠️ Your Telegram account is not linked to any Participium user.\n\n" +
          "Please link your account on the Participium website by clicking the Telegram icon in the navigation bar, then try /newreport again.",
        { parse_mode: "Markdown" }
      );
      return;
    }
  } catch (error: any) {
    console.error("checkLinked error:", error.response?.data || error.message);
    await ctx.reply(
      "An error occurred while checking your account link. Please try again later."
    );
    return;
  }

  try {
    const reports = await getMyReports(telegramId);

    if (!reports || reports.length === 0) {
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

    let message = "📋 *Your Recent Reports*\n\n";
    const inlineButtons: any[][] = [];

    reports.slice(0, 10).forEach((report: any) => {
      message += `🆔 *#${report.reportId}*\n`;
      message += `📝 ${report.title}\n`;
      message += `📍 ${report.address}\n`;
      message += `📅 ${new Date(report.createdAt).toLocaleDateString()}\n\n`;

      // Add two buttons for each report: Status and Details
      inlineButtons.push([
        Markup.button.callback(
          `📊 Status #${report.reportId}`,
          `report_status_${report.reportId}`
        ),
        Markup.button.callback(
          `📄 Details #${report.reportId}`,
          `report_details_${report.reportId}`
        ),
      ]);
    });

    await ctx.reply(message, {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard(inlineButtons),
    });
  } catch (error: any) {
    console.error(
      "Get my reports error:",
      error.response?.data || error.message
    );
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

// Menu callback handlers
bot.action("menu_main", async (ctx) => {
  await ctx.answerCbQuery("🏠 Returning to main menu");
  await ctx.editMessageText(
    "🎆 *Welcome to Participium Bot!*\n\n" +
      "📍 Submit new reports and track existing ones.\n"  +
      "💪 Together we make our city better!\n\n" +
      "👇 *Choose an action:*\n" +
      "\nYou can also use /help, /faq, or /contact at any time.",
    {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard([
        [Markup.button.callback("📋 My Reports", "menu_myreports")],
        [Markup.button.callback("📝 New Report", "menu_newreport")],
        [Markup.button.callback("ℹ️ Help", "menu_help")],
        [Markup.button.callback("❓ FAQ", "menu_faq")],
        [Markup.button.callback("📞 Contact", "menu_contact")],
        [Markup.button.callback("🔗 Link Account", "menu_link_help")],
      ]),
    }
  );
});

bot.action("menu_myreports", async (ctx) => {
  await ctx.answerCbQuery("📋 Loading reports...");

  const telegramId = ctx.from.id.toString();
  try {
    const reports = await getMyReports(telegramId);

    if (!reports || reports.length === 0) {
      await ctx.editMessageText(
        "📋 *Your Reports*\n\n" +
          "🤔 You haven't submitted any reports yet.\n\n" +
          "📝 Would you like to create your first report?",
        {
          parse_mode: "Markdown",
          ...Markup.inlineKeyboard([
            [
              Markup.button.callback(
                "📝 Create First Report",
                "menu_newreport"
              ),
            ],
            [Markup.button.callback("🏠 Main Menu", "menu_main")],
          ]),
        }
      );
      return;
    }

    const { message, buttons, totalPages } = formatReportsList(reports, 0);

    // Add pagination buttons
    if (totalPages > 1) {
      buttons.push([Markup.button.callback("Next ➡️", "reports_page_1")]);
    }

    // Add navigation buttons
    buttons.push([
      Markup.button.callback("🔄 Refresh List", "menu_myreports"),
      Markup.button.callback("📝 New Report", "menu_newreport"),
    ]);
    buttons.push([Markup.button.callback("🏠 Main Menu", "menu_main")]);

    await safeEditMessage(
      ctx,
      message,
      {
        parse_mode: "Markdown",
        ...Markup.inlineKeyboard(buttons),
      },
      "✅ Already up to date"
    );
  } catch (error: any) {
    if (error.response?.status === 404) {
      await safeEditMessage(
        ctx,
        "⚠️ *Account Not Linked*\n\n" +
          "🔗 You need to link your account to view reports.\n\n" +
          "🌐 Go to Participium website → Click Telegram icon",
        {
          parse_mode: "Markdown",
          ...Markup.inlineKeyboard([
            [Markup.button.callback("🔗 Link Account", "menu_link_help")],
            [Markup.button.callback("🏠 Main Menu", "menu_main")],
          ]),
        },
        "⚠️ Account not linked"
      );
    } else {
      await safeEditMessage(
        ctx,
        "❌ Error retrieving reports.",
        {
          ...Markup.inlineKeyboard([
            [Markup.button.callback("🔄 Retry", "menu_myreports")],
            [Markup.button.callback("🏠 Main Menu", "menu_main")],
          ]),
        },
        "⚠️ Unable to update message"
      );
    }
  }
});

bot.action("menu_newreport", async (ctx) => {
  await ctx.answerCbQuery("📝 Starting report creation...");
  await startReportCreation(ctx, false);
});

bot.action("menu_help", async (ctx) => {
  await ctx.answerCbQuery("ℹ️ Loading help...");

  await ctx.editMessageText(
    "ℹ️ Participium Bot Help\n\n" +
      "💡 Tip: Use the buttons below to navigate more easily!\n\n" +
      "Available commands:\n" +
      "/start - Show main menu\n" +
      "/help - Show this help\n" +
      "/faq - Frequently Asked Questions\n" +
      "/contact - City contacts and info",
    {
      parse_mode: "HTML",
      ...Markup.inlineKeyboard([
        [Markup.button.callback("🏠 Main Menu", "menu_main")],
        [Markup.button.callback("❓ FAQ", "menu_faq")],
        [Markup.button.callback("📞 Contact", "menu_contact")],
      ]),
    }
  );
});

bot.action("menu_link_help", async (ctx) => {
  await ctx.answerCbQuery("🔗 Loading link guide...");

  await ctx.editMessageText(
    "🔗 *How to Link Your Account*\n\n" +
      "🌐 **Step 1**: Go to the Participium website\n" +
      "📱 **Step 2**: Click the Telegram icon in the navigation bar\n" +
      "✨ **Step 3**: Follow the instructions to generate the link\n" +
      "🎯 **Step 4**: Click the link and return here!\n\n" +
      "🔔 Once linked, you'll receive all notifications here!",
    {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard([
        [Markup.button.callback("🏠 Main Menu", "menu_main")],
      ]),
    }
  );
});

// Helper function to display only report status
async function displayReportStatus(
  ctx: any,
  telegramId: string,
  reportId: number
) {
  try {
    const report = await getReportStatus(telegramId, reportId);

    let statusMessage = `📊 *Report Status #${report.reportId}*\n\n`;
    statusMessage += `📝 *Title:* ${report.title}\n`;
    statusMessage += `📊 *Current Status:* ${formatStatus(report.status)}\n`;
    statusMessage += `📅 *Last Updated:* ${new Date(
      report.createdAt
    ).toLocaleString()}\n\n`;

    // Add status-specific information
    if (report.status === "REJECTED" && report.rejectedReason) {
      statusMessage += `❌ *Rejection Reason:* ${report.rejectedReason}\n\n`;
    } else if (report.status === "IN_PROGRESS") {
      statusMessage += `🚧 *Your report is being worked on!*\n\n`;
    } else if (report.status === "RESOLVED") {
      statusMessage += `✅ *Great! Your report has been resolved.*\n\n`;
    } else if (report.status === "PENDING_APPROVAL") {
      statusMessage += `⏳ *Your report is waiting for approval.*\n\n`;
    } else if (report.status === "APPROVED") {
      statusMessage += `📝 *Your report has been approved and is ready for assignment.*\n\n`;
    } else if (report.status === "ASSIGNED") {
      statusMessage += `👷 *Your report has been assigned to a technician.*\n\n`;
    }

    await ctx.editMessageText(statusMessage, {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard([
        [
          Markup.button.callback(
            "📄 Full Details",
            `report_details_${report.reportId}`
          ),
          Markup.button.callback(
            "🔄 Refresh Status",
            `report_status_${report.reportId}`
          ),
        ],
        [
          Markup.button.callback("⬅️ Back to Reports", "back_to_reports"),
          Markup.button.callback("🏠 Main Menu", "menu_main"),
        ],
      ]),
    });

    await ctx.answerCbQuery("📊 Status loaded!");
  } catch (error: any) {
    console.error("ReportStatus error:", error.response?.data || error.message);

    const errorMessage = (() => {
      if (error.response?.status === 404) {
        if (error.response.data?.message?.includes("linked")) {
          return "⚠️ Account not linked. Link it from the website.";
        } else {
          return "❌ Report not found or does not belong to you.";
        }
      } else if (error.response?.status === 403) {
        return "⛔ You do not have permission to view this report.";
      } else {
        return "❌ An error occurred while retrieving the report status.";
      }
    })();

    await ctx.answerCbQuery("❌ Error loading status", { show_alert: true });
    await ctx.reply(errorMessage);
  }
}

// Helper function to display report details (used by both /reportstatus command and inline buttons)
async function displayReportDetails(
  ctx: any,
  telegramId: string,
  reportId: number,
  isCallback = false
) {
  try {
    const report = await getReportStatus(telegramId, reportId);

    let details = `📋 *Report #${report.reportId}*\n\n`;
    details += `*${report.title}*\n`;
    details += `\n`;
    details += `Status: ${formatStatus(report.status)}\n`;
    details += `Category: ${getCategoryLabel(report.category)}\n`;
    details += `Date: ${new Date(report.createdAt).toLocaleDateString()}\n`;
    details += `Anonymous: ${report.isAnonymous ? "Yes" : "No"}\n\n`;
    details += `📍 ${report.address}\n\n`;
    details += `${report.description}\n\n`;

    //if there is a rejection reason
    if (report.status === "REJECTED" && report.rejectedReason) {
      details += `❌ Rejection: ${report.rejectedReason}\n\n`;
    }

    // Add back button for inline callbacks
    const keyboard = isCallback
      ? Markup.inlineKeyboard([
          [Markup.button.callback("⬅️ Back to Reports", "back_to_reports")],
          [Markup.button.callback("🏠 Main Menu", "menu_main")],
        ])
      : undefined;

    if (isCallback) {
      await ctx.editMessageText(details, {
        parse_mode: "Markdown",
        ...keyboard,
      });
      await ctx.answerCbQuery("📄 Report details loaded!");
    } else {
      await ctx.reply(details, { parse_mode: "Markdown" });
    }
  } catch (error: any) {
    console.error("ReportStatus error:", error.response?.data || error.message);

    const errorMessage = (() => {
      if (error.response?.status === 404) {
        if (error.response.data?.message?.includes("linked")) {
          return "⚠️ Account not linked. Link it from the website.";
        } else {
          return "❌ Report not found or does not belong to you.";
        }
      } else if (error.response?.status === 403) {
        return "⛔ You do not have permission to view this report.";
      } else {
        return "❌ An error occurred while retrieving the report details.";
      }
    })();

    if (isCallback) {
      await ctx.answerCbQuery("❌ Error loading details", { show_alert: true });
      await ctx.reply(errorMessage);
    } else {
      await ctx.reply(errorMessage);
    }
  }
}

bot.command("reportstatus", async (ctx) => {
  const telegramId = ctx.from.id.toString();
  const text = ctx.message.text.trim();

  //i want ot extract the report ID from the command (e.g. "/reportstatus 1024" -> "1024")
  const parts = text.split(" ");
  const reportIdStr = parts[1];

  if (!reportIdStr || isNaN(Number(reportIdStr))) {
    await ctx.reply(
      "⚠️ *Correct usage:*\n" +
        "`/reportstatus <REPORT_ID>`\n\n" +
        "📝 Example: `/reportstatus 123`\n\n" +
        "💡 **Better Tip**: Use the button below for easier navigation!",
      {
        parse_mode: "Markdown",
        ...Markup.inlineKeyboard([
          [
            Markup.button.callback(
              "📋 My Reports (Interactive)",
              "menu_myreports"
            ),
          ],
          [Markup.button.callback("🏠 Main Menu", "menu_main")],
        ]),
      }
    );
    return;
  }

  const reportId = parseInt(reportIdStr);
  await displayReportDetails(ctx, telegramId, reportId, false);
});

// Callback handler for report details buttons
bot.action(/^report_details_(\d+)$/, async (ctx) => {
  const reportId = parseInt(ctx.match[1]);
  const telegramId = ctx.from.id.toString();

  await displayReportDetails(ctx, telegramId, reportId, true);
});

// Callback handler for report status buttons
bot.action(/^report_status_(\d+)$/, async (ctx) => {
  const reportId = parseInt(ctx.match[1]);
  const telegramId = ctx.from.id.toString();

  await displayReportStatus(ctx, telegramId, reportId);
});

// Callback handler for back to reports list button
bot.action("back_to_reports", async (ctx) => {
  await ctx.answerCbQuery("📋 Returning to reports list");

  // Re-execute the myreports logic with navigation buttons
  const telegramId = ctx.from.id.toString();

  try {
    const reports = await getMyReports(telegramId);

    if (!reports || reports.length === 0) {
      await ctx.editMessageText(
        "📋 *Your Reports*\n\n" + "🤔 You haven't submitted any reports yet.",
        {
          parse_mode: "Markdown",
          ...Markup.inlineKeyboard([
            [
              Markup.button.callback(
                "📝 Create First Report",
                "menu_newreport"
              ),
            ],
            [Markup.button.callback("🏠 Main Menu", "menu_main")],
          ]),
        }
      );
      return;
    }

    const { message, buttons, totalPages } = formatReportsList(reports, 0);

    // Add pagination buttons
    if (totalPages > 1) {
      buttons.push([Markup.button.callback("Next ➡️", "reports_page_1")]);
    }

    // Add navigation buttons
    buttons.push([
      Markup.button.callback("🔄 Refresh List", "menu_myreports"),
      Markup.button.callback("📝 New Report", "menu_newreport"),
    ]);
    buttons.push([Markup.button.callback("🏠 Main Menu", "menu_main")]);

    await ctx.editMessageText(message, {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard(buttons),
    });
  } catch (error: any) {
    await safeEditMessage(
      ctx,
      "❌ An error occurred while retrieving your reports.",
      {
        ...Markup.inlineKeyboard([
          [Markup.button.callback("🔄 Retry", "menu_myreports")],
          [Markup.button.callback("🏠 Main Menu", "menu_main")],
        ]),
      },
      "⚠️ Unable to update message"
    );
  }
});

// Handle pagination for reports list
bot.action(/^reports_page_(\d+)$/, async (ctx) => {
  try {
    const page = parseInt(ctx.match[1]);
    const telegramId = ctx.from!.id.toString();

    const reports = await getMyReports(telegramId);

    if (!reports || reports.length === 0) {
      await safeEditMessage(
        ctx,
        "📭 *No reports found*\n\nYou haven't created any reports yet.",
        {
          parse_mode: "Markdown",
          ...Markup.inlineKeyboard([
            [
              Markup.button.callback(
                "📝 Create First Report",
                "menu_newreport"
              ),
            ],
            [Markup.button.callback("🏠 Main Menu", "menu_main")],
          ]),
        },
        "No reports to display"
      );
      await ctx.answerCbQuery();
      return;
    }

    const { message, buttons, totalPages } = formatReportsList(reports, page);

    // Add pagination buttons
    const paginationButtons = [];
    if (page > 0) {
      paginationButtons.push(
        Markup.button.callback("⬅️ Back", `reports_page_${page - 1}`)
      );
    }
    if (page < totalPages - 1) {
      paginationButtons.push(
        Markup.button.callback("Next ➡️", `reports_page_${page + 1}`)
      );
    }
    if (paginationButtons.length > 0) {
      buttons.push(paginationButtons);
    }

    // Add navigation buttons
    buttons.push([
      Markup.button.callback("🔄 Refresh List", "menu_myreports"),
      Markup.button.callback("📝 New Report", "menu_newreport"),
    ]);
    buttons.push([Markup.button.callback("🏠 Main Menu", "menu_main")]);

    await safeEditMessage(
      ctx,
      message,
      {
        parse_mode: "Markdown",
        ...Markup.inlineKeyboard(buttons),
      },
      "Page updated"
    );

    await ctx.answerCbQuery();
  } catch (error: any) {
    await safeEditMessage(
      ctx,
      "❌ An error occurred while retrieving your reports.",
      {
        ...Markup.inlineKeyboard([
          [Markup.button.callback("🔄 Retry", "menu_myreports")],
          [Markup.button.callback("🏠 Main Menu", "menu_main")],
        ]),
      },
      "⚠️ Unable to update message"
    );
    await ctx.answerCbQuery("Error loading page");
  }
});

bot.command("newreport", async (ctx) => {
  await startReportCreation(ctx, true);
});

bot.action(/^category_(.+)$/, async (ctx) => {
  const chatId = ctx.chat!.id;
  const session = reportSessions.get(chatId);

  if (session?.step !== "category") {
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
        [Markup.button.callback("✅ Done uploading photos", "photos_done")],
        [Markup.button.callback("❌ Cancel Report", "cancel_report")],
      ]),
    }
  );
});

bot.action("photos_done", async (ctx) => {
  const chatId = ctx.chat!.id;
  const session = reportSessions.get(chatId);

  if (session?.step !== "photos") {
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
      "*Step 5/6: Location*\n" +
      "Please share the location of the issue.\n\n" +
      "📍 Tap the 📎 button → Location → Send your current location\n" +
      "Or send a location manually.",
    {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard([
        [Markup.button.callback("❌ Cancel Report", "cancel_report")],
      ]),
    }
  );
});

bot.action(/^anonymous_(yes|no)$/, async (ctx) => {
  const chatId = ctx.chat!.id;
  const session = reportSessions.get(chatId);

  if (session?.step !== "anonymous") {
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
        [Markup.button.callback("✅ Confirm & Submit", "confirm_yes")],
        [Markup.button.callback("❌ Cancel Report", "cancel_report")],
      ]),
    }
  );
});

bot.action("confirm_yes", async (ctx) => {
  const chatId = ctx.chat!.id;
  const session = reportSessions.get(chatId);

  if (session?.step !== "confirm") {
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
        `Your report has been created with ID: *#${result.reportId}*\n\n` +
        "You will receive notifications here when there are updates on your report.\n\n" +
        "Thank you for helping improve our city! 🏙️",
      {
        parse_mode: "Markdown",
        ...Markup.inlineKeyboard([
          [Markup.button.callback("📋 View My Reports", "menu_myreports")],
          [
            Markup.button.callback(
              "📝 Create Another Report",
              "menu_newreport"
            ),
          ],
          [Markup.button.callback("🏠 Main Menu", "menu_main")],
        ]),
      }
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
        `Error: ${errorMessage}\n\n` +
        "Please try again using the button below:",
      {
        parse_mode: "Markdown",
        ...Markup.inlineKeyboard([
          [Markup.button.callback("🔄 Try Again", "menu_newreport")],
          [Markup.button.callback("🏠 Main Menu", "menu_main")],
        ]),
      }
    );

    reportSessions.delete(chatId);
  }
});

bot.action("confirm_no", async (ctx) => {
  const chatId = ctx.chat!.id;
  reportSessions.delete(chatId);

  await ctx.answerCbQuery("Report cancelled");
  await ctx.editMessageText(
    "❌ *Report Cancelled*\n\n" + "Your report has been discarded.",
    {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard([
        [Markup.button.callback("📝 Create New Report", "menu_newreport")],
        [Markup.button.callback("🏠 Main Menu", "menu_main")],
      ]),
    }
  );

  await showMainMenu(ctx);
});

const pendingPhotoConfirmations = new Map<number, NodeJS.Timeout>();

bot.on("photo", async (ctx) => {
  const chatId = ctx.chat.id;
  const session = reportSessions.get(chatId);

  if (session?.step !== "photos") {
    return;
  }

  if (session.photoFileIds.length >= 3) {
    await ctx.reply(
      "⚠️ Maximum 3 photos allowed. Press the button to continue.",
      {
        parse_mode: "Markdown",
        ...Markup.inlineKeyboard([
          [Markup.button.callback("✅ Done uploading photos", "photos_done")],
          [Markup.button.callback("❌ Cancel Report", "cancel_report")],
        ]),
      }
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
    if (currentSession?.step !== "photos") {
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
          [Markup.button.callback("✅ Done uploading photos", "photos_done")],
          [Markup.button.callback("❌ Cancel Report", "cancel_report")],
        ]),
      }
    );
  }, 500);

  pendingPhotoConfirmations.set(chatId, timeout);
});

bot.on("location", async (ctx) => {
  const chatId = ctx.chat.id;
  const session = reportSessions.get(chatId);

  if (session?.step !== "location") {
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
        [Markup.button.callback("❌ Cancel Report", "cancel_report")],
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
        `✅ Title: "${text}"\n\n` +
          "*Step 2/6: Description*\n" +
          "Please provide a detailed description of the issue:",
        {
          parse_mode: "Markdown",
          ...Markup.inlineKeyboard([
            [Markup.button.callback("❌ Cancel Report", "cancel_report")],
          ]),
        }
      );
      break;

    case "description": {
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
      categoryButtons.push([
        Markup.button.callback("❌ Cancel Report", "cancel_report"),
      ]);

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
    }

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

bot.action("cancel_report", async (ctx) => {
  const chatId = ctx.chat!.id;
  reportSessions.delete(chatId);

  await ctx.answerCbQuery("Report cancelled");
  await ctx.editMessageText(
    "❌ *Report Cancelled*\n\n" + "Your report has been discarded.",
    {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard([
        [Markup.button.callback("📝 Create New Report", "menu_newreport")],
        [Markup.button.callback("🏠 Main Menu", "menu_main")],
      ]),
    }
  );
});

bot.catch((err, ctx) => {
  console.error(`Error for ${ctx.updateType}:`, err);
  ctx.reply("An error occurred. Please try again.").catch(console.error);
});

// Launch bot
(async () => {
  await bot.launch();
  console.log("Bot Telegram running");
})();

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
