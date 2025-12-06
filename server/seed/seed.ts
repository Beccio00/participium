import "reflect-metadata";
import { AppDataSource } from "../src/utils/AppDataSource";
import { UserRepository } from "../src/repositories/UserRepository";
import { ReportRepository } from "../src/repositories/ReportRepository";
import { ReportPhotoRepository } from "../src/repositories/ReportPhotoRepository";
import { ReportMessageRepository } from "../src/repositories/ReportMessageRepository";
import { ExternalCompanyRepository } from "../src/repositories/ExternalCompanyRepository";
import { Role } from "../../shared/RoleTypes";
import { ReportCategory, ReportStatus } from "../../shared/ReportTypes";
import * as bcrypt from "bcrypt";

const seedDatabase = async () => {
  const userRepository = new UserRepository();
  const reportRepository = new ReportRepository();
  const reportPhotoRepository = new ReportPhotoRepository();
  const reportMessageRepository = new ReportMessageRepository();
  const externalCompanyRepository = new ExternalCompanyRepository();

  console.log("🌱 Starting database seed...");

  // Clear existing data (in reverse order of dependencies)
  console.log("🧹 Clearing existing data...");

  try {
    await AppDataSource.query("DELETE FROM report_message");
  } catch (error) {
    console.log("Table report_message doesn't exist yet, skipping...");
  }

  try {
    await AppDataSource.query("DELETE FROM report_photo");
  } catch (error) {
    console.log("Table report_photo doesn't exist yet, skipping...");
  }

  try {
    await AppDataSource.query("DELETE FROM citizen_photo");
  } catch (error) {
    console.log("Table citizen_photo doesn't exist yet, skipping...");
  }

  try {
    await AppDataSource.query("DELETE FROM notification");
  } catch (error) {
    console.log("Table notification doesn't exist yet, skipping...");
  }

  try {
    await AppDataSource.query("DELETE FROM report");
  } catch (error) {
    console.log("Table report doesn't exist yet, skipping...");
  }

  try {
    await AppDataSource.query('DELETE FROM "ExternalCompany"');
  } catch (error) {
    console.log("Table ExternalCompany doesn't exist yet, skipping...");
  }

  try {
    await AppDataSource.query('DELETE FROM "User"');
  } catch (error) {
    console.log("Table User doesn't exist yet, skipping...");
  }

  // Users to insert (plain passwords)
  const users = [
    {
      email: "admin@participium.com",
      first_name: "Admin",
      last_name: "User",
      password: "adminpass",
      role: Role.ADMINISTRATOR,
    },
    {
      email: "citizen@participium.com",
      first_name: "Mario",
      last_name: "Rossi",
      password: "citizenpass",
      role: Role.CITIZEN,
    },
    {
      email: "pr@participium.com",
      first_name: "Public",
      last_name: "Relations",
      password: "prpass",
      role: Role.PUBLIC_RELATIONS,
    },
    {
      email: "tech@participium.com",
      first_name: "Luca",
      last_name: "Bianchi",
      password: "techpass",
      role: Role.MUNICIPAL_BUILDING_MAINTENANCE,
    },
    {
      email: "culture@participium.com",
      first_name: "Chiara",
      last_name: "Rossi",
      password: "techpass",
      role: Role.CULTURE_EVENTS_TOURISM_SPORTS,
    },
    {
      email: "localpublic@participium.com",
      first_name: "Marco",
      last_name: "Moretti",
      password: "techpass",
      role: Role.LOCAL_PUBLIC_SERVICES,
    },
    {
      email: "education@participium.com",
      first_name: "Sara",
      last_name: "Conti",
      password: "techpass",
      role: Role.EDUCATION_SERVICES,
    },
    {
      email: "residential@participium.com",
      first_name: "Davide",
      last_name: "Ferrari",
      password: "techpass",
      role: Role.PUBLIC_RESIDENTIAL_HOUSING,
    },
    {
      email: "infosys@participium.com",
      first_name: "Elena",
      last_name: "Galli",
      password: "techpass",
      role: Role.INFORMATION_SYSTEMS,
    },
    {
      email: "privatebuild@participium.com",
      first_name: "Antonio",
      last_name: "Marini",
      password: "techpass",
      role: Role.PRIVATE_BUILDINGS,
    },
    {
      email: "greenspaces@participium.com",
      first_name: "Giulia",
      last_name: "Pellegrini",
      password: "techpass",
      role: Role.GREENSPACES_AND_ANIMAL_PROTECTION,
    },
    {
      email: "road@participium.com",
      first_name: "Francesco",
      last_name: "Sala",
      password: "techpass",
      role: Role.ROAD_MAINTENANCE,
    },
    {
      email: "civilprot@participium.com",
      first_name: "Valentina",
      last_name: "Riva",
      password: "techpass",
      role: Role.CIVIL_PROTECTION,
    },
    {
      email: "infra@participium.com",
      first_name: "Giorgio",
      last_name: "Costa",
      password: "infrapass",
      role: Role.INFRASTRUCTURES,
    },
    {
      email: "waste@participium.com",
      first_name: "Federica",
      last_name: "Neri",
      password: "wastepass",
      role: Role.WASTE_MANAGEMENT,
    },
    {
      email: "techPR@participium.com",
      first_name: "Alessandro",
      last_name: "Romano",
      password: "techpass",
      role: Role.PUBLIC_RELATIONS,
    },
    {
      email: "external@enelx.com",
      first_name: "Marco",
      last_name: "Bianchi",
      password: "externalpass",
      role: Role.EXTERNAL_MAINTAINER,
    },
  ];

  // Hash passwords and insert users
  const createdUsers: any[] = [];
  console.log("👤 Creating users...");

  for (const u of users) {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(u.password, saltRounds);
    const salt = await bcrypt.genSalt(saltRounds);

    const userData = {
      email: u.email,
      first_name: u.first_name,
      last_name: u.last_name,
      password: hashedPassword,
      salt,
      role: u.role,
      telegram_username: null,
      email_notifications_enabled: true,
    };

    const created = await userRepository.create(userData);
    createdUsers.push(created);
    console.log(`✅ Created user: ${u.email}`);
  }

  // Create external companies
  console.log("🏢 Creating external companies...");

  // Company with platform access
  const companyWithAccess = await AppDataSource.query(
    'INSERT INTO "ExternalCompany" (name, categories, "platformAccess") VALUES ($1, $2, $3) RETURNING *',
    ["Enel X", JSON.stringify([ReportCategory.PUBLIC_LIGHTING]), true]
  );
  const enelXId = companyWithAccess[0].id;
  console.log(`✅ Created external company with platform access: Enel X`);

  // Company without platform access
  const companyWithoutAccess = await AppDataSource.query(
    'INSERT INTO "ExternalCompany" (name, categories, "platformAccess") VALUES ($1, $2, $3) RETURNING *',
    ["IREN Ambiente", JSON.stringify([ReportCategory.WASTE]), false]
  );
  const irenId = companyWithoutAccess[0].id;
  console.log(
    `✅ Created external company without platform access: IREN Ambiente`
  );

  // Assign external maintainer to Enel X
  const externalMaintainer = createdUsers.find(
    (u) => u.email === "external@enelx.com"
  );
  if (externalMaintainer) {
    await AppDataSource.query(
      'UPDATE "User" SET "externalCompanyId" = $1 WHERE id = $2',
      [enelXId, externalMaintainer.id]
    );
    console.log(
      `✅ Assigned external maintainer ${externalMaintainer.email} to Enel X`
    );
  }

  // Create reports with different statuses and categories
  const statuses = [
    ReportStatus.PENDING_APPROVAL,
    ReportStatus.ASSIGNED,
    ReportStatus.IN_PROGRESS,
    ReportStatus.SUSPENDED,
    ReportStatus.REJECTED,
    ReportStatus.RESOLVED,
  ];

  const categories = [
    ReportCategory.WATER_SUPPLY_DRINKING_WATER,
    ReportCategory.ARCHITECTURAL_BARRIERS,
    ReportCategory.SEWER_SYSTEM,
    ReportCategory.PUBLIC_LIGHTING,
    ReportCategory.WASTE,
    ReportCategory.ROAD_SIGNS_TRAFFIC_LIGHTS,
  ];

  // Helper to find users
  const citizen = createdUsers.find(
    (x) => x.email === "citizen@participium.com"
  );
  const tech =
    createdUsers.find((x) => x.email === "tech@participium.com") ||
    createdUsers[0];

  // Realistic samples per category
  const categorySamples: Record<
    string,
    { title: string; description: string; preferredRole: Role }
  > = {
    [ReportCategory.WATER_SUPPLY_DRINKING_WATER]: {
      title: "Contaminated drinking water at the city fountain",
      description:
        "The central fountain has a strong smell and the water appears cloudy. Please inspect as soon as possible.",
      preferredRole: Role.LOCAL_PUBLIC_SERVICES,
    },
    [ReportCategory.ARCHITECTURAL_BARRIERS]: {
      title: "Park entrance without wheelchair access",
      description:
        "The main entrance to the city park does not have a wheelchair-accessible ramp, making it difficult for people with mobility issues to enter.",
      preferredRole: Role.MUNICIPAL_BUILDING_MAINTENANCE,
    },
    [ReportCategory.SEWER_SYSTEM]: {
      title: "Road drain flooding after heavy rain",
      description:
        "After heavy rain the street drain on Via Roma clogs and causes local flooding.",
      preferredRole: Role.INFRASTRUCTURES,
    },
    [ReportCategory.PUBLIC_LIGHTING]: {
      title: "Streetlight out on Viale Garibaldi",
      description:
        "Streetlight no.45 on Viale Garibaldi has been out for weeks, area poorly lit at night.",
      preferredRole: Role.LOCAL_PUBLIC_SERVICES,
    },
    [ReportCategory.WASTE]: {
      title: "Illegal waste dump near bin",
      description:
        "Accumulation of waste and bulky items near the bin at Via Milano corner, sanitary risk.",
      preferredRole: Role.WASTE_MANAGEMENT,
    },
    [ReportCategory.ROAD_SIGNS_TRAFFIC_LIGHTS]: {
      title: "Traffic light malfunction at Corso Italia intersection",
      description:
        "The traffic light stays red for only one direction causing confusion and danger.",
      preferredRole: Role.ROAD_MAINTENANCE,
    },
  };

  console.log("📝 Creating reports...");

  for (let i = 0; i < statuses.length; i++) {
    const status = statuses[i];
    const category = categories[i % categories.length];
    const sample = categorySamples[category] || {
      title: `Segnalazione ${category}`,
      description: "Segnalazione generica",
      preferredRole: Role.INFRASTRUCTURES,
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
      assignedOfficerId: null,
      rejectedReason: null,
    };

    // Assign technical users for appropriate statuses
    if (
      status === ReportStatus.ASSIGNED ||
      status === ReportStatus.IN_PROGRESS
    ) {
      const preferredRole = sample.preferredRole;
      const assignedUser =
        createdUsers.find((u) => u.role === preferredRole) || tech;
      if (assignedUser) reportData.assignedOfficerId = assignedUser.id;
    }

    // Force assignment to tech@participium.com for ARCHITECTURAL_BARRIERS with ASSIGNED status
    if (
      status === ReportStatus.ASSIGNED &&
      category === ReportCategory.ARCHITECTURAL_BARRIERS
    ) {
      reportData.assignedOfficerId = tech.id;
    }

    if (status === ReportStatus.REJECTED) {
      reportData.rejectedReason =
        "Segnalazione non pertinente al patrimonio comunale.";
    }

    const createdReport = await reportRepository.create(reportData);
    console.log(
      `📝 Created report id=${createdReport.id} status=${status} category=${category}`
    );

    // Log assignment info if present
    if (reportData.assignedOfficerId) {
      const assignedUser = createdUsers.find(
        (u) => u.id === reportData.assignedOfficerId
      );
      if (assignedUser) {
        console.log(
          `   → Assigned to: ${assignedUser.email} (${assignedUser.role})`
        );
      }
    }

    // Add photos for each report
    console.log(`📸 Adding photos for report ${createdReport.id}...`);
    for (let p = 1; p <= 6; p++) {
      const photoUrl = `http://localhost:9000/reports-photos/report${
        i + 1
      }.jpg`;
      await reportPhotoRepository.create({
        url: photoUrl,
        filename: `seed-${createdReport.id}-${p}.jpg`,
        reportId: createdReport.id,
      });
    }

    // Add messages
    console.log(`💬 Adding messages for report ${createdReport.id}...`);

    // Initial citizen message
    await reportMessageRepository.create({
      content: `Report submitted: ${sample.description}`,
      reportId: createdReport.id,
      senderId: citizen.id,
    });

    // Technical follow-up for assigned/in-progress reports
    if (
      status === ReportStatus.ASSIGNED ||
      status === ReportStatus.IN_PROGRESS
    ) {
      const assignedUser = createdUsers.find(
        (u) => u.id === reportData.assignedOfficerId
      );
      if (assignedUser) {
        await reportMessageRepository.create({
          content: `Technician ${assignedUser.first_name} ${assignedUser.last_name} assigned to the case. On-site inspection started.`,
          reportId: createdReport.id,
          senderId: assignedUser.id,
        });
      }
    }

    // Rejection message for rejected reports
    if (status === ReportStatus.REJECTED) {
      const prUser =
        createdUsers.find((u) => u.role === Role.PUBLIC_RELATIONS) ||
        createdUsers[2];
      await reportMessageRepository.create({
        content:
          "The report was rejected because it falls outside municipal responsibilities.",
        reportId: createdReport.id,
        senderId: prUser.id,
      });
    }
  }

  // Add additional ASSIGNED reports specifically for tech@participium.com
  console.log("📝 Creating additional ASSIGNED reports for testing...");

  const localPublicUser = createdUsers.find(
    (u) => u.email === "localpublic@participium.com"
  );

  const additionalReports = [
    {
      title: "Streetlight malfunction on Via Roma",
      description: "Multiple streetlights are flickering and need maintenance",
      category: ReportCategory.PUBLIC_LIGHTING,
      assignedTo: localPublicUser,
    },
    {
      title: "Broken streetlight near city center",
      description: "Streetlight is completely out and needs urgent replacement",
      category: ReportCategory.PUBLIC_LIGHTING,
      assignedTo: tech,
    },
    {
      title: "Overflowing waste bins on Via Dante",
      description:
        "Multiple waste bins are overflowing and creating a sanitary issue",
      category: ReportCategory.WASTE,
      assignedTo: tech,
    },
  ];

  for (let j = 0; j < additionalReports.length; j++) {
    const extra = additionalReports[j];
    const reportData: any = {
      title: extra.title,
      description: extra.description,
      category: extra.category,
      latitude: 45.0703 + (j + 10) * 0.001,
      longitude: 7.6869 + (j + 10) * 0.001,
      address: `Via test ${200 + j}, Torino`,
      isAnonymous: false,
      status: ReportStatus.ASSIGNED,
      userId: citizen.id,
      assignedOfficerId: extra.assignedTo?.id || tech.id,
      rejectedReason: null,
    };

    const createdReport = await reportRepository.create(reportData);
    console.log(
      `📝 Created additional report id=${createdReport.id} for ${extra.assignedTo?.email}`
    );

    // Add photos
    for (let p = 1; p <= 3; p++) {
      const photoUrl = `http://localhost:9000/reports-photos/report${
        (j % 6) + 1
      }.jpg`;
      await reportPhotoRepository.create({
        url: photoUrl,
        filename: `seed-extra-${createdReport.id}-${p}.jpg`,
        reportId: createdReport.id,
      });
    }

    // Add initial message
    await reportMessageRepository.create({
      content: `Report submitted: ${extra.description}`,
      reportId: createdReport.id,
      senderId: citizen.id,
    });
  }

  console.log("\n✅ Database seed completed successfully!");
  console.log(`\nCreated ${users.length} sample users with hashed passwords`);
  console.log(
    `Created 2 external companies (1 with platform access, 1 without)`
  );
  console.log(
    `Created ${
      statuses.length + additionalReports.length
    } sample reports with photos and messages`
  );
  console.log("\n📋 Test credentials:");
  users.forEach((u) => {
    console.log(
      `  ${u.first_name} ${u.last_name} (${u.role}): ${u.email} / ${u.password}`
    );
  });
};

const main = async () => {
  try {
    console.log("🚀 Initializing database connection...");
    await AppDataSource.initialize();
    console.log("✅ Database connected successfully");

    console.log("🔄 Synchronizing database schema (forced)...");
    await AppDataSource.synchronize(true); // Force drop and recreate
    console.log("✅ Database schema synchronized");

    await seedDatabase();
  } catch (error) {
    console.error("❌ Error during seed:", error);
    process.exit(1);
  } finally {
    console.log("🔌 Database connection closed");
    await AppDataSource.destroy();
  }
};

main();
