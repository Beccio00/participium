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
      isVerified: true,
      verificationToken: null,
      verificationCodeExpiresAt: null,
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

  // Third company without platform access - different category
  const amiatCompany = await AppDataSource.query(
    'INSERT INTO "ExternalCompany" (name, categories, "platformAccess") VALUES ($1, $2, $3) RETURNING *',
    ["AMIAT", JSON.stringify([ReportCategory.ROADS_URBAN_FURNISHINGS]), false]
  );
  const amiatId = amiatCompany[0].id;
  console.log(
    `✅ Created external company without platform access: AMIAT (Roads maintenance)`
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

  // Helper to find users
  const citizen = createdUsers.find(
    (x) => x.email === "citizen@participium.com"
  );
  const tech =
    createdUsers.find((x) => x.email === "tech@participium.com") ||
    createdUsers[0];

  // Report templates with photos - centralized configuration for easy editing
  const reportTemplates = [
    {
      // Report 1: Fountain leak
      title: "Public fountain with continuous water leak",
      description: "Historic fountain with decorative head continuously leaking water into drain grate. Flow never stops, possible valve malfunction.",
      category: ReportCategory.WATER_SUPPLY_DRINKING_WATER,
      preferredRole: Role.LOCAL_PUBLIC_SERVICES,
      status: ReportStatus.PENDING_APPROVAL,
      photos: ["report1.jpg"]
    },
    {
      // Report 2: Stairs without ramp
      title: "Public staircase with vegetation and no accessible ramp",
      description: "Long outdoor staircase with steps overgrown by weeds. No alternative ramp for wheelchairs and strollers. Neglected maintenance.",
      category: ReportCategory.ARCHITECTURAL_BARRIERS,
      preferredRole: Role.MUNICIPAL_BUILDING_MAINTENANCE,
      status: ReportStatus.ASSIGNED,
      photos: ["report2.jpg"]
    },
    {
      // Report 3: Blocked sewer grate
      title: "Large puddle covering blocked sewer grate",
      description: "Water accumulation on roadway with submerged grate. Floating leaves indicate poor drainage. Grate cleaning needed.",
      category: ReportCategory.SEWER_SYSTEM,
      preferredRole: Role.INFRASTRUCTURES,
      status: ReportStatus.IN_PROGRESS,
      photos: ["report3.jpg"]
    },
    {
      // Report 4: Streetlight off
      title: "Non-functioning streetlight - dark area at night",
      description: "Pole-mounted streetlight completely off. Fixture appears intact but creates dangerous dark spots at night.",
      category: ReportCategory.PUBLIC_LIGHTING,
      preferredRole: Role.LOCAL_PUBLIC_SERVICES,
      status: ReportStatus.ASSIGNED,
      photos: ["report4.jpg"]
    },
    {
      // Report 5: Waste overflow (2 photos)
      title: "Overflowing waste containers with bags on ground",
      description: "Multiple green bins completely full with numerous bags piled on the ground in different areas. Missed collection or insufficient capacity. Health and environmental hazard.",
      category: ReportCategory.WASTE,
      preferredRole: Role.WASTE_MANAGEMENT,
      status: ReportStatus.REJECTED,
      photos: ["report5.jpg", "report5.2.jpg"]
    },
    {
      // Report 6: Road potholes (2 photos)
      title: "Severe road and sidewalk deterioration",
      description: "Asphalt with deep cracks, potholes and eroded sections. Sidewalk equally damaged with wide cracks and overturned barrier. Danger for pedestrians, wheelchairs and strollers.",
      category: ReportCategory.ROADS_URBAN_FURNISHINGS,
      preferredRole: Role.ROAD_MAINTENANCE,
      status: ReportStatus.PENDING_APPROVAL,
      photos: ["report9.jpg", "report8.jpg"]
    },
    {
      // Report 8: Broken barrier
      title: "Broken safety barrier on roadside",
      description: "Metal safety barrier damaged and bent. Creates hazard for vehicles and pedestrians. Immediate replacement required.",
      category: ReportCategory.ROADS_URBAN_FURNISHINGS,
      preferredRole: Role.ROAD_MAINTENANCE,
      status: ReportStatus.PENDING_APPROVAL,
      photos: ["report7.jpg"]
    },
    {
      // Report 9: Traffic light off
      title: "Traffic light completely off - no power",
      description: "Traffic signal at major intersection completely turned off. No lights active, creating dangerous situation for vehicles and pedestrians. Electrical failure suspected.",
      category: ReportCategory.ROAD_SIGNS_TRAFFIC_LIGHTS,
      preferredRole: Role.ROAD_MAINTENANCE,
      status: ReportStatus.ASSIGNED,
      photos: ["report10.jpg"]
    },
    {
      // Report 9: Faded crosswalk
      title: "Faded crosswalk markings with potholes",
      description: "Pedestrian crossing almost invisible due to faded paint. Multiple potholes in the area. Safety hazard for pedestrians and drivers.",
      category: ReportCategory.ROAD_SIGNS_TRAFFIC_LIGHTS,
      preferredRole: Role.ROAD_MAINTENANCE,
      status: ReportStatus.RESOLVED,
      photos: ["report11.jpg"]
    },
    {
      // Report 10: Damaged sidewalk - can be assigned to AMIAT
      title: "Damaged sidewalk tiles creating trip hazard",
      description: "Multiple broken and uneven sidewalk tiles on pedestrian path. Creates significant tripping hazard especially for elderly and children. Urgent repair needed.",
      category: ReportCategory.ROADS_URBAN_FURNISHINGS,
      preferredRole: Role.ROAD_MAINTENANCE,
      status: ReportStatus.ASSIGNED,
      photos: ["report6.jpg"]
    }
  ];

  console.log("📝 Creating reports...");

  // Different coordinates for each report across Turin with real street addresses
  // Well distributed across different neighborhoods for better map visibility
  const turinCoordinates = [
    { lat: 45.0703, lng: 7.6869, address: "Piazza Castello, 10121 Torino" },                    // Report 1: Centro storico - Fountain
    { lat: 45.0612, lng: 7.6858, address: "Via Nizza 230, 10126 Torino" },                      // Report 2: Crocetta - Stairs
    { lat: 45.0837, lng: 7.6744, address: "Corso Giulio Cesare 45, 10152 Torino" },             // Report 3: Madonna di Campagna - Sewer
    { lat: 45.0542, lng: 7.6628, address: "Via Nizza 350, 10127 Torino" },                      // Report 4: Lingotto - Streetlight
    { lat: 45.0892, lng: 7.6982, address: "Corso Vercelli 112, 10155 Torino" },                 // Report 5: Barriera di Milano - Waste
    { lat: 45.0668, lng: 7.7012, address: "Via Roma 156, 10141 Torino" },                       // Report 6: Cit Turin - Road potholes
    { lat: 45.0755, lng: 7.6585, address: "Corso Francia 88, 10143 Torino" },                   // Report 7: Pozzo Strada - Damaged sidewalk
    { lat: 45.0925, lng: 7.7125, address: "Via Cigna 45, 10155 Torino" },                       // Report 8: Regio Parco - Broken barrier
    { lat: 45.0645, lng: 7.6925, address: "Corso Vittorio Emanuele II 75, 10128 Torino" },      // Report 8: San Salvario - Traffic light
    { lat: 45.0815, lng: 7.6655, address: "Corso Lecce 33, 10149 Torino" },                     // Report 9: Vallette - Faded crosswalk
    { lat: 45.0588, lng: 7.6777, address: "Via San Francesco da Paola 15, 10123 Torino" },      // Report 10: Centro - Damaged sidewalk
  ];

  // Create reports with staggered creation dates (from 7 days ago to today)
  const now = new Date();
  const daysAgo = (days: number): Date => {
    const date = new Date(now);
    date.setDate(date.getDate() - days);
    return date;
  };

  const creationDates = [
    daysAgo(9),  // Report 1: 9 days ago - Fountain
    daysAgo(8),  // Report 2: 8 days ago - Stairs
    daysAgo(7),  // Report 3: 7 days ago - Sewer
    daysAgo(6),  // Report 4: 6 days ago - Streetlight
    daysAgo(5),  // Report 5: 5 days ago - Waste
    daysAgo(4),  // Report 6: 4 days ago - Road potholes
    daysAgo(3),  // Report 7: 3 days ago - Damaged sidewalk
    daysAgo(2),  // Report 7: 2 days ago - Broken barrier
    daysAgo(1),  // Report 8: 1 day ago - Traffic light
    daysAgo(0),  // Report 9: Today - Faded crosswalk
    daysAgo(1),  // Report 10: 1 day ago - Damaged sidewalk for AMIAT
  ];

  for (let i = 0; i < reportTemplates.length; i++) {
    const template = reportTemplates[i];
    const coords = turinCoordinates[i];
    
    const reportData: any = {
      title: template.title,
      description: template.description,
      category: template.category,
      latitude: coords.lat,
      longitude: coords.lng,
      address: coords.address,
      isAnonymous: false,
      status: template.status,
      userId: citizen.id,
      assignedOfficerId: null,
      rejectedReason: null,
    };

    // Assign technical users for appropriate statuses
    if (
      template.status === ReportStatus.ASSIGNED ||
      template.status === ReportStatus.IN_PROGRESS
    ) {
      const preferredRole = template.preferredRole;
      const assignedUser =
        createdUsers.find((u) => u.role === preferredRole) || tech;
      if (assignedUser) reportData.assignedOfficerId = assignedUser.id;
    }

    // Force assignment to tech@participium.com for ARCHITECTURAL_BARRIERS with ASSIGNED status
    if (
      template.status === ReportStatus.ASSIGNED &&
      template.category === ReportCategory.ARCHITECTURAL_BARRIERS
    ) {
      reportData.assignedOfficerId = tech.id;
    }

    if (template.status === ReportStatus.REJECTED) {
      reportData.rejectedReason =
        "Segnalazione non pertinente al patrimonio comunale.";
    }

    const createdReport = await reportRepository.create(reportData);
    
    // Update createdAt to staggered date for better distribution
    await AppDataSource.query(
      'UPDATE "Report" SET "createdAt" = $1 WHERE id = $2',
      [creationDates[i], createdReport.id]
    );
    
    console.log(
      `📝 Created report id=${createdReport.id} status=${template.status} category=${template.category} date=${creationDates[i].toLocaleDateString()}`
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

    // Add photos from template configuration
    for (let photoIndex = 0; photoIndex < template.photos.length; photoIndex++) {
      await reportPhotoRepository.create({
        url: `http://localhost:9000/reports-photos/${template.photos[photoIndex]}`,
        filename: `seed-${createdReport.id}-${photoIndex + 1}.jpg`,
        reportId: createdReport.id,
      });
    }

    // Add messages
    console.log(`💬 Adding messages for report ${createdReport.id}...`);

    // Initial citizen message
    await reportMessageRepository.create({
      content: `Report submitted: ${template.description}`,
      reportId: createdReport.id,
      senderId: citizen.id,
    });

    // Technical follow-up for assigned/in-progress reports
    if (
      template.status === ReportStatus.ASSIGNED ||
      template.status === ReportStatus.IN_PROGRESS
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
    if (template.status === ReportStatus.REJECTED) {
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
  // PT24, PT25, PT26 - Adapt existing reports for external maintainer demo
  // ============================================================================
  
  console.log("\n🎯 Adapting existing reports for PT24/PT25/PT26 demo...");

  // Get the created reports from the database (sorted by ID to match creation order)
  const allReports = await AppDataSource.query('SELECT * FROM "Report" ORDER BY id ASC');
  
  // PT24 DEMO: Report 4 (Streetlight) - ASSIGNED, ready to assign to Enel X
  const pt24Report = allReports[3]; // Report 4: Streetlight off
  if (pt24Report) {
    await AppDataSource.query(
      'UPDATE "Report" SET status = $1, "assignedOfficerId" = $2 WHERE id = $3',
      [ReportStatus.ASSIGNED, tech.id, pt24Report.id]
    );
    console.log(`   ✅ [PT24] Report ${pt24Report.id} (Streetlight): ASSIGNED to tech@participium.com - ready for external assignment to Enel X`);
  }

  // PT25 DEMO: Report 9 (Traffic light) - EXTERNAL_ASSIGNED, ready for status updates
  const pt25Report = allReports[8]; // Report 9: Traffic light off
  if (pt25Report) {
    await AppDataSource.query(
      'UPDATE "Report" SET status = $1, "assignedOfficerId" = $2, "externalMaintainerId" = $3, "externalCompanyId" = $4 WHERE id = $5',
      [ReportStatus.EXTERNAL_ASSIGNED, tech.id, externalMaintainer.id, enelXId, pt25Report.id]
    );
    
    // Add message about external assignment
    await reportMessageRepository.create({
      content: "Report assigned to Enel X for maintenance intervention. External team will handle this case.",
      reportId: pt25Report.id,
      senderId: tech.id,
    });
    
    console.log(`   ✅ [PT25] Report ${pt25Report.id} (Traffic light): EXTERNAL_ASSIGNED to external@enelx.com - can update status`);
  }

  // PT26 DEMO: Report 2 (Stairs) - IN_PROGRESS with internal notes
  const pt26Report = allReports[1]; // Report 2: Stairs without ramp
  if (pt26Report) {
    await AppDataSource.query(
      'UPDATE "Report" SET status = $1, "assignedOfficerId" = $2, "externalMaintainerId" = $3, "externalCompanyId" = $4, category = $5 WHERE id = $6',
      [ReportStatus.IN_PROGRESS, tech.id, externalMaintainer.id, enelXId, ReportCategory.PUBLIC_LIGHTING, pt26Report.id]
    );
    
    // Add messages about external assignment
    await reportMessageRepository.create({
      content: "Report assigned to Enel X technical team. Inspection and intervention scheduled.",
      reportId: pt26Report.id,
      senderId: tech.id,
    });
    
    await reportMessageRepository.create({
      content: "Our team has started the inspection. Will provide updates on progress.",
      reportId: pt26Report.id,
      senderId: externalMaintainer.id,
    });
    
    // Add internal notes (coordination between tech and external)
    await AppDataSource.query(
      'INSERT INTO "InternalNote" (content, "reportId", "authorId", "createdAt") VALUES ($1, $2, $3, $4)',
      [
        "Initial inspection completed. The work requires specialized equipment. Estimated cost: €3,200. Waiting for municipality approval before proceeding.",
        pt26Report.id,
        externalMaintainer.id,
        new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
      ]
    );

    await AppDataSource.query(
      'INSERT INTO "InternalNote" (content, "reportId", "authorId", "createdAt") VALUES ($1, $2, $3, $4)',
      [
        "Approved. Please proceed with the intervention. Budget allocated. Expected completion by end of week.",
        pt26Report.id,
        tech.id,
        new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
      ]
    );

    await AppDataSource.query(
      'INSERT INTO "InternalNote" (content, "reportId", "authorId", "createdAt") VALUES ($1, $2, $3, $4)',
      [
        "Equipment delivered. Intervention scheduled for tomorrow at 8 AM. Expected completion: 5 PM. Will update status when finished.",
        pt26Report.id,
        externalMaintainer.id,
        new Date(Date.now() - 6 * 60 * 60 * 1000) // 6 hours ago
      ]
    );
    
    console.log(`   ✅ [PT26] Report ${pt26Report.id} (Stairs): IN_PROGRESS with 3 internal notes - demonstrates internal communication`);
  }

  // PT24 BONUS: Report 5 (Waste) - ASSIGNED to WASTE_MANAGEMENT, ready to assign to IREN (no platform)
  const wasteReport = allReports[4]; // Report 5: Waste overflow
  const wasteManager = createdUsers.find((u) => u.role === Role.WASTE_MANAGEMENT);
  if (wasteReport && wasteManager) {
    await AppDataSource.query(
      'UPDATE "Report" SET status = $1, "assignedOfficerId" = $2 WHERE id = $3',
      [ReportStatus.ASSIGNED, wasteManager.id, wasteReport.id]
    );
    console.log(`   ✅ [PT24-IREN] Report ${wasteReport.id} (Waste): ASSIGNED to waste@participium.com - can assign to IREN (no platform access)`);
  }

  // PT24 BONUS 2: Report 10 (Sidewalk) - ASSIGNED to ROAD_MAINTENANCE, ready to assign to AMIAT (no platform)
  const sidewalkReport = allReports[9]; // Report 10: Damaged sidewalk
  const roadManager = createdUsers.find((u) => u.role === Role.ROAD_MAINTENANCE);
  if (sidewalkReport && roadManager) {
    await AppDataSource.query(
      'UPDATE "Report" SET status = $1, "assignedOfficerId" = $2 WHERE id = $3',
      [ReportStatus.ASSIGNED, roadManager.id, sidewalkReport.id]
    );
    console.log(`   ✅ [PT24-AMIAT] Report ${sidewalkReport.id} (Sidewalk): ASSIGNED to road@participium.com - can assign to AMIAT (no platform access)`);
  }

  console.log("\n✅ Reports adapted for PT24/PT25/PT26 demo!");
  console.log("=" .repeat(80));
  console.log("\n📋 Demo Test Plan:");
  console.log(`   PT24 - Assign to External:`);
  console.log(`      → Login as tech@participium.com / techpass`);
  console.log(`      → Navigate to "My Reports"`);
  console.log(`      → Find Report #${pt24Report?.id || 'N/A'} (Streetlight - ASSIGNED)`);
  console.log(`      → Click "Assign to external" → Select "Enel X"`);
  console.log(`      → Report status changes to EXTERNAL_ASSIGNED`);
  console.log(`      → BONUS: Report #${wasteReport?.id || 'N/A'} (Waste) can be assigned to IREN (no platform)`);
  console.log(`      → BONUS: Report #${sidewalkReport?.id || 'N/A'} (Sidewalk) can be assigned to AMIAT (no platform)`);
  console.log(`   PT25 - Update Status:`);
  console.log(`      → Login as external@enelx.com / externalpass`);
  console.log(`      → Navigate to "My Reports"`);
  console.log(`      → Find Report #${pt25Report?.id || 'N/A'} (Traffic light - EXTERNAL_ASSIGNED)`);
  console.log(`      → Click "Update Status" → Change to IN_PROGRESS/SUSPENDED/RESOLVED`);
  console.log(`      → Citizens see updated status in real-time`);
  console.log(`   PT26 - Internal Notes:`);
  console.log(`      → Login as tech@participium.com or external@enelx.com`);
  console.log(`      → Navigate to "My Reports"`);
  console.log(`      → Find Report #${pt26Report?.id || 'N/A'} (Stairs - IN_PROGRESS, already has 3 notes)`);
  console.log(`      → Click "Internal Notes" → View existing conversation`);
  console.log(`      → Add new note → Other user receives notification (badge on button)`);
  console.log(`      → Switch users to verify notification badge appears`);
  console.log("=" .repeat(80));

  console.log("\n✅ Database seed completed successfully!");
  console.log(`\nCreated ${users.length} sample users with hashed passwords`);
  console.log(
    `Created 3 external companies (1 with platform access: Enel X, 2 without: IREN Ambiente & AMIAT)`
  );
  console.log("\n📋 Test credentials:");
  users.forEach((u) => {
    console.log(
      `  ${u.first_name} ${u.last_name} (${u.role}): ${u.email} / ${u.password}`
    );
  });
}; // Chiusura della funzione seedDatabase

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
