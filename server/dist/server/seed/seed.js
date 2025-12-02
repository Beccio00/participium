"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const AppDataSource_1 = require("../src/utils/AppDataSource");
const UserRepository_1 = require("../src/repositories/UserRepository");
const ReportRepository_1 = require("../src/repositories/ReportRepository");
const ReportPhotoRepository_1 = require("../src/repositories/ReportPhotoRepository");
const ReportMessageRepository_1 = require("../src/repositories/ReportMessageRepository");
const User_1 = require("../src/entities/User");
const Report_1 = require("../src/entities/Report");
const bcrypt = __importStar(require("bcrypt"));
const seedDatabase = () => __awaiter(void 0, void 0, void 0, function* () {
    const userRepository = new UserRepository_1.UserRepository();
    const reportRepository = new ReportRepository_1.ReportRepository();
    const reportPhotoRepository = new ReportPhotoRepository_1.ReportPhotoRepository();
    const reportMessageRepository = new ReportMessageRepository_1.ReportMessageRepository();
    console.log("🌱 Starting database seed...");
    // Clear existing data (in reverse order of dependencies)
    console.log("🧹 Clearing existing data...");
    try {
        yield AppDataSource_1.AppDataSource.query("DELETE FROM report_message");
    }
    catch (error) {
        console.log("Table report_message doesn't exist yet, skipping...");
    }
    try {
        yield AppDataSource_1.AppDataSource.query("DELETE FROM report_photo");
    }
    catch (error) {
        console.log("Table report_photo doesn't exist yet, skipping...");
    }
    try {
        yield AppDataSource_1.AppDataSource.query("DELETE FROM citizen_photo");
    }
    catch (error) {
        console.log("Table citizen_photo doesn't exist yet, skipping...");
    }
    try {
        yield AppDataSource_1.AppDataSource.query("DELETE FROM notification");
    }
    catch (error) {
        console.log("Table notification doesn't exist yet, skipping...");
    }
    try {
        yield AppDataSource_1.AppDataSource.query("DELETE FROM report");
    }
    catch (error) {
        console.log("Table report doesn't exist yet, skipping...");
    }
    try {
        yield AppDataSource_1.AppDataSource.query("DELETE FROM \"User\"");
    }
    catch (error) {
        console.log("Table User doesn't exist yet, skipping...");
    }
    // Users to insert (plain passwords)
    const users = [
        {
            email: "admin@participium.com",
            first_name: "Admin",
            last_name: "User",
            password: "adminpass",
            role: User_1.Role.ADMINISTRATOR,
        },
        {
            email: "citizen@participium.com",
            first_name: "Mario",
            last_name: "Rossi",
            password: "citizenpass",
            role: User_1.Role.CITIZEN,
        },
        {
            email: "pr@participium.com",
            first_name: "Public",
            last_name: "Relations",
            password: "prpass",
            role: User_1.Role.PUBLIC_RELATIONS,
        },
        {
            email: "tech@participium.com",
            first_name: "Luca",
            last_name: "Bianchi",
            password: "techpass",
            role: User_1.Role.MUNICIPAL_BUILDING_MAINTENANCE,
        },
        {
            email: "culture@participium.com",
            first_name: "Chiara",
            last_name: "Rossi",
            password: "techpass",
            role: User_1.Role.CULTURE_EVENTS_TOURISM_SPORTS,
        },
        {
            email: "localpublic@participium.com",
            first_name: "Marco",
            last_name: "Moretti",
            password: "techpass",
            role: User_1.Role.LOCAL_PUBLIC_SERVICES,
        },
        {
            email: "education@participium.com",
            first_name: "Sara",
            last_name: "Conti",
            password: "techpass",
            role: User_1.Role.EDUCATION_SERVICES,
        },
        {
            email: "residential@participium.com",
            first_name: "Davide",
            last_name: "Ferrari",
            password: "techpass",
            role: User_1.Role.PUBLIC_RESIDENTIAL_HOUSING,
        },
        {
            email: "infosys@participium.com",
            first_name: "Elena",
            last_name: "Galli",
            password: "techpass",
            role: User_1.Role.INFORMATION_SYSTEMS,
        },
        {
            email: "privatebuild@participium.com",
            first_name: "Antonio",
            last_name: "Marini",
            password: "techpass",
            role: User_1.Role.PRIVATE_BUILDINGS,
        },
        {
            email: "greenspaces@participium.com",
            first_name: "Giulia",
            last_name: "Pellegrini",
            password: "techpass",
            role: User_1.Role.GREENSPACES_AND_ANIMAL_PROTECTION,
        },
        {
            email: "road@participium.com",
            first_name: "Francesco",
            last_name: "Sala",
            password: "techpass",
            role: User_1.Role.ROAD_MAINTENANCE,
        },
        {
            email: "civilprot@participium.com",
            first_name: "Valentina",
            last_name: "Riva",
            password: "techpass",
            role: User_1.Role.CIVIL_PROTECTION,
        },
        {
            email: "infra@participium.com",
            first_name: "Giorgio",
            last_name: "Costa",
            password: "infrapass",
            role: User_1.Role.INFRASTRUCTURES,
        },
        {
            email: "waste@participium.com",
            first_name: "Federica",
            last_name: "Neri",
            password: "wastepass",
            role: User_1.Role.WASTE_MANAGEMENT,
        },
        {
            email: "techPR@participium.com",
            first_name: "Alessandro",
            last_name: "Romano",
            password: "techpass",
            role: User_1.Role.PUBLIC_RELATIONS,
        },
    ];
    // Hash passwords and insert users
    const createdUsers = [];
    console.log("👤 Creating users...");
    for (const u of users) {
        const saltRounds = 10;
        const hashedPassword = yield bcrypt.hash(u.password, saltRounds);
        const salt = yield bcrypt.genSalt(saltRounds);
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
        const created = yield userRepository.create(userData);
        createdUsers.push(created);
        console.log(`✅ Created user: ${u.email}`);
    }
    // Create reports with different statuses and categories
    const statuses = [
        Report_1.ReportStatus.PENDING_APPROVAL,
        Report_1.ReportStatus.ASSIGNED,
        Report_1.ReportStatus.IN_PROGRESS,
        Report_1.ReportStatus.SUSPENDED,
        Report_1.ReportStatus.REJECTED,
        Report_1.ReportStatus.RESOLVED,
    ];
    const categories = [
        Report_1.ReportCategory.WATER_SUPPLY_DRINKING_WATER,
        Report_1.ReportCategory.ARCHITECTURAL_BARRIERS,
        Report_1.ReportCategory.SEWER_SYSTEM,
        Report_1.ReportCategory.PUBLIC_LIGHTING,
        Report_1.ReportCategory.WASTE,
        Report_1.ReportCategory.ROAD_SIGNS_TRAFFIC_LIGHTS,
    ];
    // Helper to find users
    const citizen = createdUsers.find(x => x.email === "citizen@participium.com");
    const tech = createdUsers.find(x => x.email === "tech@participium.com") || createdUsers[0];
    // Realistic samples per category
    const categorySamples = {
        [Report_1.ReportCategory.WATER_SUPPLY_DRINKING_WATER]: {
            title: "Contaminated drinking water at the city fountain",
            description: "The central fountain has a strong smell and the water appears cloudy. Please inspect as soon as possible.",
            preferredRole: User_1.Role.LOCAL_PUBLIC_SERVICES,
        },
        [Report_1.ReportCategory.ARCHITECTURAL_BARRIERS]: {
            title: "Park entrance without wheelchair access",
            description: "The main entrance to the city park does not have a wheelchair-accessible ramp, making it difficult for people with mobility issues to enter.",
            preferredRole: User_1.Role.MUNICIPAL_BUILDING_MAINTENANCE,
        },
        [Report_1.ReportCategory.SEWER_SYSTEM]: {
            title: "Road drain flooding after heavy rain",
            description: "After heavy rain the street drain on Via Roma clogs and causes local flooding.",
            preferredRole: User_1.Role.INFRASTRUCTURES,
        },
        [Report_1.ReportCategory.PUBLIC_LIGHTING]: {
            title: "Streetlight out on Viale Garibaldi",
            description: "Streetlight no.45 on Viale Garibaldi has been out for weeks, area poorly lit at night.",
            preferredRole: User_1.Role.LOCAL_PUBLIC_SERVICES,
        },
        [Report_1.ReportCategory.WASTE]: {
            title: "Illegal waste dump near bin",
            description: "Accumulation of waste and bulky items near the bin at Via Milano corner, sanitary risk.",
            preferredRole: User_1.Role.WASTE_MANAGEMENT,
        },
        [Report_1.ReportCategory.ROAD_SIGNS_TRAFFIC_LIGHTS]: {
            title: "Traffic light malfunction at Corso Italia intersection",
            description: "The traffic light stays red for only one direction causing confusion and danger.",
            preferredRole: User_1.Role.ROAD_MAINTENANCE,
        },
    };
    console.log("📝 Creating reports...");
    for (let i = 0; i < statuses.length; i++) {
        const status = statuses[i];
        const category = categories[i % categories.length];
        const sample = categorySamples[category] || {
            title: `Segnalazione ${category}`,
            description: "Segnalazione generica",
            preferredRole: User_1.Role.INFRASTRUCTURES,
        };
        const reportData = {
            title: sample.title,
            description: sample.description,
            category: category,
            latitude: 45.0703 + i * 0.001,
            longitude: 7.6869 + i * 0.001,
            address: `Via esempio ${100 + i}, Torino`,
            isAnonymous: false,
            status: status,
            userId: citizen.id,
            assignedToId: null,
            rejectedReason: null,
        };
        // Assign technical users for appropriate statuses
        if (status === Report_1.ReportStatus.ASSIGNED || status === Report_1.ReportStatus.IN_PROGRESS) {
            const preferredRole = sample.preferredRole;
            const assignedUser = createdUsers.find(u => u.role === preferredRole) || tech;
            if (assignedUser)
                reportData.assignedToId = assignedUser.id;
        }
        if (status === Report_1.ReportStatus.REJECTED) {
            reportData.rejectedReason = "Segnalazione non pertinente al patrimonio comunale.";
        }
        const createdReport = yield reportRepository.create(reportData);
        console.log(`📝 Created report id=${createdReport.id} status=${status} category=${category}`);
        // Log assignment info if present
        if (reportData.assignedToId) {
            const assignedUser = createdUsers.find(u => u.id === reportData.assignedToId);
            if (assignedUser) {
                console.log(`   → Assigned to: ${assignedUser.email} (${assignedUser.role})`);
            }
        }
        // Add photos for each report
        console.log(`📸 Adding photos for report ${createdReport.id}...`);
        for (let p = 1; p <= 6; p++) {
            const photoUrl = `http://localhost:9000/reports-photos/report${i + 1}.jpg`;
            yield reportPhotoRepository.create({
                url: photoUrl,
                filename: `seed-${createdReport.id}-${p}.jpg`,
                reportId: createdReport.id,
            });
        }
        // Add messages
        console.log(`💬 Adding messages for report ${createdReport.id}...`);
        // Initial citizen message
        yield reportMessageRepository.create({
            content: `Report submitted: ${sample.description}`,
            reportId: createdReport.id,
            senderId: citizen.id,
        });
        // Technical follow-up for assigned/in-progress reports
        if (status === Report_1.ReportStatus.ASSIGNED || status === Report_1.ReportStatus.IN_PROGRESS) {
            const assignedUser = createdUsers.find(u => u.id === reportData.assignedToId);
            if (assignedUser) {
                yield reportMessageRepository.create({
                    content: `Technician ${assignedUser.first_name} ${assignedUser.last_name} assigned to the case. On-site inspection started.`,
                    reportId: createdReport.id,
                    senderId: assignedUser.id,
                });
            }
        }
        // Rejection message for rejected reports
        if (status === Report_1.ReportStatus.REJECTED) {
            const prUser = createdUsers.find(u => u.role === User_1.Role.PUBLIC_RELATIONS) || createdUsers[2];
            yield reportMessageRepository.create({
                content: "The report was rejected because it falls outside municipal responsibilities.",
                reportId: createdReport.id,
                senderId: prUser.id,
            });
        }
    }
    console.log("\n✅ Database seed completed successfully!");
    console.log(`\nCreated ${users.length} sample users with hashed passwords`);
    console.log(`Created ${statuses.length} sample reports with photos and messages`);
    console.log("\n📋 Test credentials:");
    console.log("  Admin: admin@participium.com / adminpass");
    console.log("  Citizen: citizen@participium.com / citizenpass");
    console.log("  PR: pr@participium.com / prpass");
    console.log("  Tech: tech@participium.com / techpass");
});
const main = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log("🚀 Initializing database connection...");
        yield AppDataSource_1.AppDataSource.initialize();
        console.log("✅ Database connected successfully");
        console.log("🔄 Synchronizing database schema (forced)...");
        yield AppDataSource_1.AppDataSource.synchronize(true); // Force drop and recreate
        console.log("✅ Database schema synchronized");
        yield seedDatabase();
    }
    catch (error) {
        console.error("❌ Error during seed:", error);
        process.exit(1);
    }
    finally {
        console.log("🔌 Database connection closed");
        yield AppDataSource_1.AppDataSource.destroy();
    }
});
main();
