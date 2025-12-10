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
    // Solo log per utenti principali
    if (u.email.includes('admin') || u.email.includes('citizen') || u.email === 'pr@participium.com') {
      console.log(`✅ Created user: ${u.email}`);
    }
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
    ReportStatus.PENDING_APPROVAL,  // Report 1: Fountain leak
    ReportStatus.ASSIGNED,           // Report 2: Stairs no ramp  
    ReportStatus.IN_PROGRESS,        // Report 3: Blocked sewer
    ReportStatus.ASSIGNED,           // Report 4: Streetlight (PT24/25/26)
    ReportStatus.REJECTED,           // Report 5: Waste overflow (3 photos: report5, report5.2, report7)
    ReportStatus.RESOLVED,           // Report 6: Traffic light off (RESOLVED - report10)
  ];

  const categories = [
    ReportCategory.WATER_SUPPLY_DRINKING_WATER,     // report1.jpg - Fountain
    ReportCategory.ARCHITECTURAL_BARRIERS,           // report2.jpg - Stairs
    ReportCategory.SEWER_SYSTEM,                     // report3.jpg - Puddle
    ReportCategory.PUBLIC_LIGHTING,                  // report4.jpg - Streetlight (PT24/25/26)
    ReportCategory.WASTE,                            // report5 + report5.2 + report7 - Waste bins (3 photos)
    ReportCategory.ROAD_SIGNS_TRAFFIC_LIGHTS,        // report10.jpg - Traffic light off (RESOLVED)
  ];

  // Helper to find users
  const citizen = createdUsers.find(
    (x) => x.email === "citizen@participium.com"
  );
  const tech =
    createdUsers.find((x) => x.email === "tech@participium.com") ||
    createdUsers[0];

  // Realistic samples per category based on actual photos
  const categorySamples: Record<
    string,
    { title: string; description: string; preferredRole: Role }
  > = {
    [ReportCategory.WATER_SUPPLY_DRINKING_WATER]: {
      title: "Public fountain with continuous water leak",
      description:
        "Historic fountain with decorative head continuously leaking water into drain grate. Flow never stops, possible valve malfunction.",
      preferredRole: Role.LOCAL_PUBLIC_SERVICES,
    },
    [ReportCategory.ARCHITECTURAL_BARRIERS]: {
      title: "Public staircase with vegetation and no accessible ramp",
      description:
        "Long outdoor staircase with steps overgrown by weeds. No alternative ramp for wheelchairs and strollers. Neglected maintenance.",
      preferredRole: Role.MUNICIPAL_BUILDING_MAINTENANCE,
    },
    [ReportCategory.SEWER_SYSTEM]: {
      title: "Large puddle covering blocked sewer grate",
      description:
        "Water accumulation on roadway with submerged grate. Floating leaves indicate poor drainage. Grate cleaning needed.",
      preferredRole: Role.INFRASTRUCTURES,
    },
    [ReportCategory.PUBLIC_LIGHTING]: {
      title: "Non-functioning streetlight - dark area at night",
      description:
        "Pole-mounted streetlight completely off. Fixture appears intact but creates dangerous dark spots at night.",
      preferredRole: Role.LOCAL_PUBLIC_SERVICES,
    },
    [ReportCategory.WASTE]: {
      title: "Overflowing waste containers with bags on ground",
      description:
        "Multiple green bins completely full with numerous bags piled on the ground in different areas. Missed collection or insufficient capacity. Health and environmental hazard.",
      preferredRole: Role.WASTE_MANAGEMENT,
    },
    [ReportCategory.ROADS_URBAN_FURNISHINGS]: {
      title: "Severe road and sidewalk deterioration",
      description:
        "Asphalt with deep cracks, potholes and eroded sections. Sidewalk equally damaged with wide cracks and overturned barrier. Danger for pedestrians, wheelchairs and strollers.",
      preferredRole: Role.ROAD_MAINTENANCE,
    },
  };

  console.log("📝 Creating reports...");

  // Different coordinates for each report across Turin with real street addresses
  // Well distributed across different neighborhoods for better map visibility
  const turinCoordinates = [
    { lat: 45.0703, lng: 7.6869, address: "Piazza Castello, 10121 Torino" },                    // Report 1: Centro storico (iconic location)
    { lat: 45.0612, lng: 7.6858, address: "Via Nizza 230, 10126 Torino" },                      // Report 2: Crocetta (south-central)
    { lat: 45.0837, lng: 7.6744, address: "Corso Giulio Cesare 45, 10152 Torino" },             // Report 3: Madonna di Campagna (north-west)
    { lat: 45.0542, lng: 7.6628, address: "Via Nizza 350, 10127 Torino" },                      // Report 4: Lingotto (far south - PT24)
    { lat: 45.0892, lng: 7.6982, address: "Corso Vercelli 112, 10155 Torino" },                 // Report 5: Barriera di Milano (north-east)
    { lat: 45.0668, lng: 7.7012, address: "Piazza Massaua 9, 10141 Torino" },                   // Report 6: Cit Turin (east)
  ];

  // Create reports with staggered creation dates (from 7 days ago to today)
  const now = new Date();
  const daysAgo = (days: number): Date => {
    const date = new Date(now);
    date.setDate(date.getDate() - days);
    return date;
  };

  const creationDates = [
    daysAgo(7),  // Report 1: 7 days ago
    daysAgo(6),  // Report 2: 6 days ago
    daysAgo(5),  // Report 3: 5 days ago
    daysAgo(4),  // Report 4: 4 days ago (PT24/25/26)
    daysAgo(3),  // Report 5: 3 days ago
    daysAgo(2),  // Report 6: 2 days ago
  ];

  for (let i = 0; i < statuses.length; i++) {
    const status = statuses[i];
    const category = categories[i % categories.length];
    const coords = turinCoordinates[i];
    
    // Get sample based on category, with special handling for ROAD_SIGNS_TRAFFIC_LIGHTS
    let sample;
    if (category === ReportCategory.ROAD_SIGNS_TRAFFIC_LIGHTS) {
      // Report 6: Traffic light completely off (RESOLVED) - report10.jpg shows turned off traffic light
      sample = {
        title: "Traffic light completely off - no power",
        description: "Traffic signal at major intersection completely turned off. No lights active, creating dangerous situation for vehicles and pedestrians. Electrical failure suspected. Already repaired and now functioning correctly.",
        preferredRole: Role.ROAD_MAINTENANCE,
      };
    } else {
      sample = categorySamples[category] || {
        title: `Segnalazione ${category}`,
        description: "Segnalazione generica",
        preferredRole: Role.INFRASTRUCTURES,
      };
    }

    const reportData: any = {
      title: sample.title,
      description: sample.description,
      category: category,
      latitude: coords.lat,
      longitude: coords.lng,
      address: coords.address,
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
    
    // Update createdAt to staggered date for better distribution
    await AppDataSource.query(
      'UPDATE report SET "createdAt" = $1 WHERE id = $2',
      [creationDates[i], createdReport.id]
    );
    
    console.log(
      `📝 Created report id=${createdReport.id} status=${status} category=${category} date=${creationDates[i].toLocaleDateString()}`
    );

    // Log assignment info if applicable
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

  // ============================================================================
  // PT24, PT25, PT26 - Complete test scenarios for external maintainer stories
  // ============================================================================
  
  console.log("\n🎯 Creating PT24/PT25/PT26 test scenarios...");

  // SCENARIO 1: PT24 - Reports ASSIGNED to tech, ready to be assigned to external (Enel X)
  console.log("📝 [PT24] Creating ASSIGNED reports ready for external assignment...");
  
  const pt24Reports = [
    {
      title: "Multiple streetlights not working on Via Po",
      description: "Five streetlights on Via Po are completely out. Urgent intervention needed for public safety.",
      address: "Via Po 45, Torino",
    },
    {
      title: "Damaged streetlight after storm on Via Garibaldi",
      description: "Streetlight pole knocked down by falling tree branch during storm. Needs emergency replacement.",
      address: "Via Garibaldi 120, Torino",
    },
    {
      title: "Streetlight flickering on Corso Vittorio Emanuele",
      description: "Streetlight intermittently flickering, possible electrical issue. Safety concern for pedestrians.",
      address: "Corso Vittorio Emanuele 75, Torino",
    },
  ];

  for (let i = 0; i < pt24Reports.length; i++) {
    const pt24Data = pt24Reports[i];
    const reportData: any = {
      title: pt24Data.title,
      description: pt24Data.description,
      category: ReportCategory.PUBLIC_LIGHTING,
      latitude: 45.0703 + (30 + i) * 0.001,
      longitude: 7.6869 + (30 + i) * 0.001,
      address: pt24Data.address,
      isAnonymous: false,
      status: ReportStatus.ASSIGNED,
      userId: citizen.id,
      assignedOfficerId: tech.id,
      rejectedReason: null,
    };

    const createdReport = await reportRepository.create(reportData);
    console.log(`   ✅ Report ${createdReport.id}: ASSIGNED to tech@participium.com (ready for external assignment)`);

    for (let p = 1; p <= 3; p++) {
      await reportPhotoRepository.create({
        url: `http://localhost:9000/reports-photos/report4.jpg`,
        filename: `pt24-${createdReport.id}-${p}.jpg`,
        reportId: createdReport.id,
      });
    }

    await reportMessageRepository.create({
      content: `Report submitted: ${pt24Data.description}`,
      reportId: createdReport.id,
      senderId: citizen.id,
    });

    await reportMessageRepository.create({
      content: "Report received and under evaluation by technical office. Will assign to appropriate maintainer.",
      reportId: createdReport.id,
      senderId: tech.id,
    });
  }

  // SCENARIO 2: PT25 - Report EXTERNAL_ASSIGNED to external, ready for status updates
  console.log("📝 [PT25] Creating EXTERNAL_ASSIGNED report for status update testing...");
  
  const pt25ReportData: any = {
    title: "Broken streetlight on Corso Regina Margherita",
    description: "Streetlight pole damaged in traffic accident, needs complete replacement. Already assigned to Enel X for intervention.",
    category: ReportCategory.PUBLIC_LIGHTING,
    latitude: 45.0703 + 40 * 0.001,
    longitude: 7.6869 + 40 * 0.001,
    address: "Corso Regina Margherita 150, Torino",
    isAnonymous: false,
    status: ReportStatus.EXTERNAL_ASSIGNED,
    userId: citizen.id,
    assignedOfficerId: tech.id,
    externalMaintainerId: externalMaintainer.id,
    externalCompanyId: enelXId,
    rejectedReason: null,
  };

  const pt25Report = await reportRepository.create(pt25ReportData);
  console.log(`   ✅ Report ${pt25Report.id}: EXTERNAL_ASSIGNED to external@enelx.com (can update status)`);

  for (let p = 1; p <= 3; p++) {
    await reportPhotoRepository.create({
      url: `http://localhost:9000/reports-photos/report3.jpg`,
      filename: `pt25-${pt25Report.id}-${p}.jpg`,
      reportId: pt25Report.id,
    });
  }

  await reportMessageRepository.create({
    content: `Report submitted: ${pt25ReportData.description}`,
    reportId: pt25Report.id,
    senderId: citizen.id,
  });

  await reportMessageRepository.create({
    content: "Report assigned to Enel X for maintenance. External team will handle this case.",
    reportId: pt25Report.id,
    senderId: tech.id,
  });

  // SCENARIO 3: PT26 - Report IN_PROGRESS with internal notes already exchanged
  console.log("📝 [PT26] Creating IN_PROGRESS report with internal notes...");
  
  const pt26ReportData: any = {
    title: "Complex traffic light system malfunction - Piazza Castello",
    description: "Traffic light system showing inconsistent signals. Requires electrical inspection and possibly new control unit.",
    category: ReportCategory.PUBLIC_LIGHTING,
    latitude: 45.0703 + 41 * 0.001,
    longitude: 7.6869 + 41 * 0.001,
    address: "Piazza Castello, Torino",
    isAnonymous: false,
    status: ReportStatus.IN_PROGRESS,
    userId: citizen.id,
    assignedOfficerId: tech.id,
    externalMaintainerId: externalMaintainer.id,
    externalCompanyId: enelXId,
    rejectedReason: null,
  };

  const pt26Report = await reportRepository.create(pt26ReportData);
  console.log(`   ✅ Report ${pt26Report.id}: IN_PROGRESS with external@enelx.com (has internal notes)`);

  for (let p = 1; p <= 4; p++) {
    await reportPhotoRepository.create({
      url: `http://localhost:9000/reports-photos/report5.jpg`,
      filename: `pt26-${pt26Report.id}-${p}.jpg`,
      reportId: pt26Report.id,
    });
  }

  await reportMessageRepository.create({
    content: `Report submitted: ${pt26ReportData.description}`,
    reportId: pt26Report.id,
    senderId: citizen.id,
  });

  await reportMessageRepository.create({
    content: "Report assigned to Enel X technical team. Intervention scheduled.",
    reportId: pt26Report.id,
    senderId: tech.id,
  });

  await reportMessageRepository.create({
    content: "Our team has started the inspection. Will provide updates soon.",
    reportId: pt26Report.id,
    senderId: externalMaintainer.id,
  });

  // Add internal notes to PT26 report (coordination between tech and external)
  console.log("   📝 Adding internal notes to PT26 report...");
  
  await AppDataSource.query(
    'INSERT INTO "InternalNote" (content, "reportId", "authorId", "createdAt") VALUES ($1, $2, $3, $4)',
    [
      "Initial inspection completed. The control unit needs replacement. Estimated cost: €2,500. Waiting for municipality approval before ordering parts.",
      pt26Report.id,
      externalMaintainer.id,
      new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
    ]
  );

  await AppDataSource.query(
    'INSERT INTO "InternalNote" (content, "reportId", "authorId", "createdAt") VALUES ($1, $2, $3, $4)',
    [
      "Approved. Please proceed with the replacement. Budget allocated. Parts delivery expected by Friday.",
      pt26Report.id,
      tech.id,
      new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
    ]
  );

  await AppDataSource.query(
    'INSERT INTO "InternalNote" (content, "reportId", "authorId", "createdAt") VALUES ($1, $2, $3, $4)',
    [
      "Parts received. Installation scheduled for tomorrow morning 9 AM. Expected completion: 12 PM. Will update status when finished.",
      pt26Report.id,
      externalMaintainer.id,
      new Date(Date.now() - 6 * 60 * 60 * 1000) // 6 hours ago
    ]
  );

  console.log("   ✅ Added 3 internal notes (external→tech→external conversation)");

  // SCENARIO 4: Additional report for IREN (company without platform access)
  console.log("📝 [PT24] Creating WASTE report for IREN (no platform access)...");
  
  const wasteReportData: any = {
    title: "Large illegal waste dump near park entrance",
    description: "Significant accumulation of construction waste and furniture illegally dumped. Requires specialized removal team.",
    category: ReportCategory.WASTE,
    latitude: 45.0703 + 50 * 0.001,
    longitude: 7.6869 + 50 * 0.001,
    address: "Parco del Valentino, Torino",
    isAnonymous: false,
    status: ReportStatus.ASSIGNED,
    userId: citizen.id,
    assignedOfficerId: createdUsers.find((u) => u.role === Role.WASTE_MANAGEMENT)?.id || tech.id,
    rejectedReason: null,
  };

  const wasteReport = await reportRepository.create(wasteReportData);
  console.log(`   ✅ Report ${wasteReport.id}: ASSIGNED to WASTE_MANAGEMENT (can assign to IREN - no platform)`);

  for (let p = 1; p <= 2; p++) {
    await reportPhotoRepository.create({
      url: `http://localhost:9000/reports-photos/report6.jpg`,
      filename: `waste-${wasteReport.id}-${p}.jpg`,
      reportId: wasteReport.id,
    });
  }

  await reportMessageRepository.create({
    content: `Report submitted: ${wasteReportData.description}`,
    reportId: wasteReport.id,
    senderId: citizen.id,
  });

  console.log("\n✅ PT24/PT25/PT26 test scenarios created successfully!");
  console.log("=" .repeat(80));
  console.log("\n📋 Test Plan:");
  console.log(`   PT24 - Assign to External:`);
  console.log(`      → Login as tech@participium.com / techpass`);
  console.log(`      → Navigate to "My Reports"`);
  console.log(`      → Find reports #${pt24Reports.length > 0 ? '7-9' : 'N/A'} (ASSIGNED, PUBLIC_LIGHTING)`);
  console.log(`      → Click "Assign to external" → Select "Enel X"`);
  console.log(`      → Report status changes to EXTERNAL_ASSIGNED`);
  console.log(`   PT25 - Update Status:`);
  console.log(`      → Login as external@enelx.com / externalpass`);
  console.log(`      → Navigate to "My Reports"`);
  console.log(`      → Find report ${pt25Report.id} (EXTERNAL_ASSIGNED)`);
  console.log(`      → Click "Update Status" → Change to IN_PROGRESS/SUSPENDED/RESOLVED`);
  console.log(`      → Citizens see updated status`);
  console.log(`   PT26 - Internal Notes:`);
  console.log(`      → Login as tech@participium.com or external@enelx.com`);
  console.log(`      → Navigate to "My Reports"`);
  console.log(`      → Find report ${pt26Report.id} (already has 3 internal notes)`);
  console.log(`      → Click "Internal Notes" → View existing notes`);
  console.log(`      → Add new note → Other user receives notification (badge on button)`);
  console.log(`      → Switch users to verify notification badge appears`);
  console.log("=" .repeat(80));

  console.log("\n✅ Database seed completed successfully!");
  console.log(`\nCreated ${users.length} sample users with hashed passwords`);
  console.log(
    `Created 2 external companies (1 with platform access, 1 without)`
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
