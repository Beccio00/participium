import request from "supertest";
import { createApp } from "../../../src/app";
import { cleanDatabase, disconnectDatabase } from "../../helpers/testSetup";
import { createUserInDatabase } from "../../helpers/testUtils";
import { AppDataSource } from "../../../src/utils/AppDataSource";
import { ExternalCompany } from "../../../src/entities/ExternalCompany";
import { Report } from "../../../src/entities/Report";
import { User } from "../../../src/entities/User";
import { ReportCategory, ReportStatus } from "../../../../shared/ReportTypes";

const app = createApp();

describe("Internal Notes Integration Tests", () => {
  beforeEach(async () => {
    await cleanDatabase();
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  async function createCompanyAndMaintainer() {
    const companyRepo = AppDataSource.getRepository(ExternalCompany);
    const userRepo = AppDataSource.getRepository(User);

    const company = companyRepo.create({
      name: `Comp-${Date.now()}`,
      categories: [ReportCategory.PUBLIC_LIGHTING],
      platformAccess: true,
    });
    await companyRepo.save(company);

    const maintainer = await createUserInDatabase({
      email: `ext-${Date.now()}@example.com`,
      password: "External123!",
      role: "EXTERNAL_MAINTAINER",
      first_name: "Ext",
      last_name: "Maint",
    });

    // attach maintainer to company
    maintainer.externalCompanyId = company.id;
    await userRepo.save(maintainer as any);

    return { company, maintainer };
  }

  it("allows an assigned technical officer to create and read internal notes", async () => {
    // create technical user
    const tech = await createUserInDatabase({
      email: `tech-${Date.now()}@example.com`,
      password: "Tech123!",
      role: "WASTE_MANAGEMENT",
      first_name: "Tech",
      last_name: "One",
    });

    // create a citizen (report owner)
    const citizen = await createUserInDatabase({
      email: `cit-${Date.now()}@example.com`,
      password: "Citizen123!",
      role: "CITIZEN",
    });

    // create report assigned to tech
    const reportRepo = AppDataSource.getRepository(Report);
    const report = reportRepo.create({
      title: "Test report",
      description: "desc",
      category: ReportCategory.PUBLIC_LIGHTING,
      latitude: 45.0,
      longitude: 7.0,
      address: "Via Test",
      isAnonymous: false,
      status: ReportStatus.ASSIGNED,
      userId: citizen.id,
      assignedOfficerId: tech.id,
      externalMaintainerId: null,
      externalCompanyId: null,
    } as any);
    const savedReport = await reportRepo.save(report as any);

    const agent = request.agent(app);
    await agent.post("/api/session").send({ email: tech.email, password: "Tech123!" }).expect(200);

    // create internal note
    const createRes = await agent.post(`/api/reports/${savedReport.id}/internal-notes`).send({ content: "Note from tech" });
    expect(createRes.status).toBe(201);
    expect(createRes.body).toHaveProperty("id");

    // fetch notes
    const getRes = await agent.get(`/api/reports/${savedReport.id}/internal-notes`).expect(200);
    expect(Array.isArray(getRes.body)).toBe(true);
    expect(getRes.body.length).toBeGreaterThanOrEqual(1);
  });

  it("allows an assigned external maintainer to create and read internal notes when company/platform is set", async () => {
    const { company, maintainer } = await createCompanyAndMaintainer();

    // create citizen and report assigned to external
    const citizen = await createUserInDatabase({
      email: `cit2-${Date.now()}@example.com`,
      password: "Citizen123!",
      role: "CITIZEN",
    });

    const reportRepo = AppDataSource.getRepository(Report);
    const report = reportRepo.create({
      title: "External assigned report",
      description: "desc",
      category: ReportCategory.PUBLIC_LIGHTING,
      latitude: 45.0,
      longitude: 7.0,
      address: "Via Test",
      isAnonymous: false,
      status: ReportStatus.EXTERNAL_ASSIGNED,
      userId: citizen.id,
      assignedOfficerId: null,
      externalMaintainerId: maintainer.id,
      externalCompanyId: company.id,
    } as any);
    const savedReport2 = await reportRepo.save(report as any);

    const agent = request.agent(app);
    await agent.post("/api/session").send({ email: maintainer.email, password: "External123!" }).expect(200);

    const createRes = await agent.post(`/api/reports/${savedReport2.id}/internal-notes`).send({ content: "Note from external" });
    expect(createRes.status).toBe(201);
    expect(createRes.body).toHaveProperty("id");

    const getRes = await agent.get(`/api/reports/${savedReport2.id}/internal-notes`).expect(200);
    expect(Array.isArray(getRes.body)).toBe(true);
    expect(getRes.body.length).toBeGreaterThanOrEqual(1);
  });

  it("forbids a non-assigned technical from creating internal notes", async () => {
    const tech = await createUserInDatabase({
      email: `tech-na-${Date.now()}@example.com`,
      password: "Tech123!",
      role: "WASTE_MANAGEMENT",
    });

    const citizen = await createUserInDatabase({
      email: `cit3-${Date.now()}@example.com`,
      password: "Citizen123!",
      role: "CITIZEN",
    });

    const reportRepo = AppDataSource.getRepository(Report);
    const report = reportRepo.create({
      title: "Unassigned report",
      description: "desc",
      category: ReportCategory.PUBLIC_LIGHTING,
      latitude: 45.0,
      longitude: 7.0,
      address: "Via Test",
      isAnonymous: false,
      status: ReportStatus.ASSIGNED,
      userId: citizen.id,
      assignedOfficerId: null,
      externalMaintainerId: null,
      externalCompanyId: null,
    } as any);
    const savedReport3 = await reportRepo.save(report as any);

    const agent = request.agent(app);
    await agent.post("/api/session").send({ email: tech.email, password: "Tech123!" }).expect(200);

    const createRes = await agent.post(`/api/reports/${savedReport3.id}/internal-notes`).send({ content: "Unauthorized note" });
    expect(createRes.status).toBe(403);
  });

  it("forbids citizens from accessing internal notes", async () => {
    const citizen = await createUserInDatabase({
      email: `cit4-${Date.now()}@example.com`,
      password: "Citizen123!",
      role: "CITIZEN",
    });

    const reportRepo = AppDataSource.getRepository(Report);
    const report = reportRepo.create({
      title: "Citizen report",
      description: "desc",
      category: ReportCategory.PUBLIC_LIGHTING,
      latitude: 45.0,
      longitude: 7.0,
      address: "Via Test",
      isAnonymous: false,
      status: ReportStatus.PENDING_APPROVAL,
      userId: citizen.id,
      assignedOfficerId: null,
      externalMaintainerId: null,
      externalCompanyId: null,
    } as any);
    const savedReport4 = await reportRepo.save(report as any);

    const agent = request.agent(app);
    await agent.post("/api/session").send({ email: citizen.email, password: "Citizen123!" }).expect(200);

    await agent.post(`/api/reports/${savedReport4.id}/internal-notes`).send({ content: "I should not" }).expect(403);
    await agent.get(`/api/reports/${savedReport4.id}/internal-notes`).expect(403);
  });
});
