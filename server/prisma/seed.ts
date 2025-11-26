import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/services/passwordService";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // Clear dependent tables first to avoid foreign key constraint violations
  // Delete messages (they reference reports and users)
  await prisma.reportMessage.deleteMany();
  // Delete photos (they reference reports)
  await prisma.reportPhoto.deleteMany();
  // Delete citizen photos (they reference users)
  await prisma.citizenPhoto.deleteMany();
  // Delete reports (they reference users)
  await prisma.report.deleteMany();
  // Now it's safe to delete users
  await prisma.user.deleteMany();

  // Users to insert (plain passwords)
  const users = [
    {
      email: "admin@participium.com",
      first_name: "Admin",
      last_name: "User",
      password: "adminpass",
      role: "ADMINISTRATOR",
      telegram_username: null,
      email_notifications_enabled: true,
    },
    {
      email: "citizen@participium.com",
      first_name: "Mario",
      last_name: "Rossi",
      password: "citizenpass",
      role: "CITIZEN",
      telegram_username: null,
      email_notifications_enabled: true,
    },
    {
      email: "pr@participium.com",
      first_name: "Public",
      last_name: "Relations",
      password: "prpass",
      role: "PUBLIC_RELATIONS",
      telegram_username: null,
      email_notifications_enabled: true,
    },
    {
      email: "tech@participium.com",
      first_name: "Luca",
      last_name: "Bianchi",
      password: "techpass",
      role: "MUNICIPAL_BUILDING_MAINTENANCE",
      telegram_username: null,
      email_notifications_enabled: true,
    },
    {
      email: "culture@participium.com",
      first_name: "Chiara",
      last_name: "Rossi",
      password: "techpass",
      role: "CULTURE_EVENTS_TOURISM_SPORTS",
      telegram_username: null,
      email_notifications_enabled: true,
    },
    {
      email: "localpublic@participium.com",
      first_name: "Marco",
      last_name: "Moretti",
      password: "techpass",
      role: "LOCAL_PUBLIC_SERVICES",
      telegram_username: null,
      email_notifications_enabled: true,
    },
    {
      email: "education@participium.com",
      first_name: "Sara",
      last_name: "Conti",
      password: "techpass",
      role: "EDUCATION_SERVICES",
      telegram_username: null,
      email_notifications_enabled: true,
    },
    {
      email: "residential@participium.com",
      first_name: "Davide",
      last_name: "Ferrari",
      password: "techpass",
      role: "PUBLIC_RESIDENTIAL_HOUSING",
      telegram_username: null,
      email_notifications_enabled: true,
    },
    {
      email: "infosys@participium.com",
      first_name: "Elena",
      last_name: "Galli",
      password: "techpass",
      role: "INFORMATION_SYSTEMS",
      telegram_username: null,
      email_notifications_enabled: true,
    },
    {
      email: "privatebuild@participium.com",
      first_name: "Antonio",
      last_name: "Marini",
      password: "techpass",
      role: "PRIVATE_BUILDINGS",
      telegram_username: null,
      email_notifications_enabled: true,
    },
    {
      email: "greenspaces@participium.com",
      first_name: "Giulia",
      last_name: "Pellegrini",
      password: "techpass",
      role: "GREENSPACES_AND_ANIMAL_PROTECTION",
      telegram_username: null,
      email_notifications_enabled: true,
    },
    {
      email: "road@participium.com",
      first_name: "Francesco",
      last_name: "Sala",
      password: "techpass",
      role: "ROAD_MAINTENANCE",
      telegram_username: null,
      email_notifications_enabled: true,
    },
    {
      email: "civilprot@participium.com",
      first_name: "Valentina",
      last_name: "Riva",
      password: "techpass",
      role: "CIVIL_PROTECTION",
      telegram_username: null,
      email_notifications_enabled: true,
    },
    {
      email: "infra@participium.com",
      first_name: "Giorgio",
      last_name: "Costa",
      password: "infrapass",
      role: "INFRASTRUCTURES",
      telegram_username: null,
      email_notifications_enabled: true,
    },
    {
      email: "waste@participium.com",
      first_name: "Federica",
      last_name: "Neri",
      password: "wastepass",
      role: "WASTE_MANAGEMENT",
      telegram_username: null,
      email_notifications_enabled: true,
    },
    {
      email: "techPR@participium.com",
      first_name: "Alessandro",
      last_name: "Romano",
      password: "techpass",
      role: "PUBLIC_RELATIONS",
      telegram_username: null,
      email_notifications_enabled: true,
    },
  ];

  // Hash passwords and insert users (keep created records for relations)
  const createdUsers: Array<any> = [];
  for (const u of users) {
    const { hashedPassword, salt } = await hashPassword(u.password);
    const created = await prisma.user.create({
      data: {
        email: u.email,
        first_name: u.first_name,
        last_name: u.last_name,
        password: hashedPassword,
        salt,
        role: u.role as any,
        telegram_username: u.telegram_username,
        email_notifications_enabled: u.email_notifications_enabled,
      },
    });
    createdUsers.push(created);
    console.log(`✅ Created user: ${u.email}`);
  }

  // Create one report per ReportStatus with different categories
  const statuses = [
    "PENDING_APPROVAL",
    "ASSIGNED",
    "IN_PROGRESS",
    "SUSPENDED",
    "REJECTED",
    "RESOLVED",
  ];

  const categories = [
    "WATER_SUPPLY_DRINKING_WATER",
    "ARCHITECTURAL_BARRIERS",
    "SEWER_SYSTEM",
    "PUBLIC_LIGHTING",
    "WASTE",
    "ROAD_SIGNS_TRAFFIC_LIGHTS",
  ];

  // helper to find users by role/email
  const citizen = createdUsers.find(
    (x) => x.email === "citizen@participium.com"
  );
  const tech =
    createdUsers.find((x) => x.email === "tech@participium.com") ||
    createdUsers[0];
  // realistic samples per category
  const categorySamples: Record<
    string,
    { title: string; description: string; preferredRole: string }
  > = {
    WATER_SUPPLY_DRINKING_WATER: {
      title: "Contaminated drinking water at the city fountain",
      description:
        "The central fountain has a strong smell and the water appears cloudy. Please inspect as soon as possible.",
      preferredRole: "LOCAL_PUBLIC_SERVICES",
    },
    ARCHITECTURAL_BARRIERS: {
      title: "Staircase missing handrail limits access",
      description:
        "The park staircase lacks a handrail and poses a risk to elderly and disabled people.",
      preferredRole: "MUNICIPAL_BUILDING_MAINTENANCE",
    },
    SEWER_SYSTEM: {
      title: "Road drain flooding after heavy rain",
      description:
        "After heavy rain the street drain on Via Roma clogs and causes local flooding.",
      preferredRole: "INFRASTRUCTURES",
    },
    PUBLIC_LIGHTING: {
      title: "Streetlight out on Viale Garibaldi",
      description:
        "Streetlight no.45 on Viale Garibaldi has been out for weeks, area poorly lit at night.",
      preferredRole: "LOCAL_PUBLIC_SERVICES",
    },
    WASTE: {
      title: "Illegal waste dump near bin",
      description:
        "Accumulation of waste and bulky items near the bin at Via Milano corner, sanitary risk.",
      preferredRole: "WASTE_MANAGEMENT",
    },
    ROAD_SIGNS_TRAFFIC_LIGHTS: {
      title: "Traffic light malfunction at Corso Italia intersection",
      description:
        "The traffic light stays red for only one direction causing confusion and danger.",
      preferredRole: "ROAD_MAINTENANCE",
    },
  };

  for (let i = 0; i < statuses.length; i++) {
    const status = statuses[i];
    const category = categories[i % categories.length];
    const sample = categorySamples[category] || {
      title: `Segnalazione ${category}`,
      description: "Segnalazione generica",
      preferredRole: "INFRASTRUCTURES",
    };

    const reportData: any = {
      title: sample.title,
      description: sample.description,
      category: category,
      latitude: 45.0703 + i * 0.001,
      longitude: 7.6869 + i * 0.001,
      address: `Via esempio ${100 + i}, Torino`,
      isAnonymous: false,
      status: status,
      userId: citizen.id,
      createdAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
    };

    // assign a realistic technical when appropriate
    if (status === "ASSIGNED" || status === "IN_PROGRESS") {
      const preferredRole = sample.preferredRole;
      const assignedUser =
        createdUsers.find((u) => u.role === preferredRole) || tech;
      if (assignedUser) reportData.assignedToId = assignedUser.id;
    }

    if (status === "REJECTED") {
      reportData.rejectedReason =
        "Segnalazione non pertinente al patrimonio comunale.";
    }

    const createdReport = await prisma.report.create({ data: reportData });
    console.log(
      `📝 Created report id=${createdReport.id} status=${status} category=${category}`
    );

    // Log assignment info if present
    if (reportData.assignedToId) {
      const assignedUser = createdUsers.find(
        (u) => u.id === reportData.assignedToId
      );
      if (assignedUser) {
        console.log(
          `   → Assigned to: ${assignedUser.email} (${assignedUser.role})`
        );
      }
    }

    // add 1-3 realistic photo placeholders for the report (vary per report)
    const numPhotos = (i % 3) + 1; // 1,2,3 repeating
    for (let p = 1; p <= numPhotos; p++) {
      const photoUrl = `https://picsum.photos/seed/participium-${createdReport.id}-${p}/800/600`;
      await prisma.reportPhoto.create({
        data: {
          url: photoUrl,
          filename: `seed-${createdReport.id}-${p}.jpg`,
          reportId: createdReport.id,
        },
      });
    }

    // add an initial citizen message and for some statuses an internal follow-up
    await prisma.reportMessage.create({
      data: {
        content: `Report submitted: ${sample.description}`,
        reportId: createdReport.id,
        senderId: citizen.id,
      },
    });

    if (status === "ASSIGNED" || status === "IN_PROGRESS") {
      const assignedUser = createdUsers.find(
        (u) => u.id === (reportData.assignedToId as any)
      );
      if (assignedUser) {
        await prisma.reportMessage.create({
          data: {
            content: `Technician ${assignedUser.first_name} ${assignedUser.last_name} assigned to the case. On-site inspection started.`,
            reportId: createdReport.id,
            senderId: assignedUser.id,
          },
        });
      }
    }

    if (status === "REJECTED") {
      await prisma.reportMessage.create({
        data: {
          content:
            "The report was rejected because it falls outside municipal responsibilities.",
          reportId: createdReport.id,
          senderId:
            createdUsers.find((u) => u.role === "PUBLIC_RELATIONS")?.id ||
            createdUsers[2].id,
        },
      });
    }
  }

  console.log("\n✅ Database seed completed successfully!");
  console.log(`\nCreated ${users.length} sample users with hashed passwords`);
  console.log("\n📋 Test credentials:");
  console.log("  Admin: admin@participium.com / adminpass");
  console.log("  Citizen: citizen@participium.com / citizenpass");
  console.log("  PR: pr@participium.com / prpass");
  console.log("  Tech: tech@participium.com / techpass");
}

main()
  .catch((e) => {
    console.error("❌ Error during seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
