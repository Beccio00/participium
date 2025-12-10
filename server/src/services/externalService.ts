import { BadRequestError, NotFoundError } from "../utils/errors";
import { ExternalCompanyRepository } from "../repositories/ExternalCompanyRepository";
import { UserRepository } from "../repositories/UserRepository";
import { ReportCategory, ReportStatus } from "../../../shared/ReportTypes";
import { Role } from "../../../shared/RoleTypes";
import * as bcrypt from "bcrypt";
import { 
  ExternalCompanyDTO, 
  ExternalCompanyWithUsersDTO, 
  ExternalMaintainerDTO,
  toExternalCompanyDTO,
  toExternalMaintainerDTO 
} from "../interfaces/ExternalsDTO";
import { ReportRepository } from "../repositories/ReportRepository";
import { ForbiddenError } from "../utils/errors";
import { ReportMessageRepository } from "../repositories/ReportMessageRepository";
import { toReportDTO } from "../interfaces/ReportDTO";
import { 
  CreateExternalCompanyData, 
  CreateExternalMaintainerData 
} from "../../../shared/ExternalTypes";
import { notifyReportAssigned, notifyReportStatusChange } from "./notificationService";

const externalCompanyRepository = new ExternalCompanyRepository();
const userRepository = new UserRepository();
const reportRepository = new ReportRepository();
const reportMessageRepository = new ReportMessageRepository();


// =========================
// EXTERNAL COMPANY CRUD SERVICES (ADMIN ONLY)
// =========================

/**
 * Create a new external company
 */
export async function createExternalCompany(data: CreateExternalCompanyData): Promise<ExternalCompanyDTO> {
    // Validate name
    if (!data.name || typeof data.name !== "string") {
      throw new BadRequestError("Company name is required");
    }

    // Validate categories
    if (!data.categories || !Array.isArray(data.categories) || data.categories.length === 0) {
      throw new BadRequestError("At least one category is required");
    }

    if (data.categories.length > 2) {
      throw new BadRequestError("Maximum 2 categories allowed");
    }

    const validCategories = Object.values(ReportCategory);
    for (const category of data.categories) {
      if (!validCategories.includes(category)) {
        throw new BadRequestError(`Invalid category: ${category}`);
      }
    }

    // Validate platform access
    if (typeof data.platformAccess !== "boolean") {
      throw new BadRequestError("platformAccess must be a boolean value");
    }

    // Create the company
    const company = await externalCompanyRepository.create({
      name: data.name,
      categories: data.categories,
      platformAccess: data.platformAccess,
    });

    return toExternalCompanyDTO(company);
  }

/**
 * List all external companies with their maintainers
 */
export async function listExternalCompanies(): Promise<ExternalCompanyWithUsersDTO[]> {
  const companies = await externalCompanyRepository.findAll();

  return companies.map(company => ({
    ...toExternalCompanyDTO(company),
    users: company.maintainers?.map(user => ({
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      role: user.role,
    })) || null,
  }));
}

/**
 * Get external companies that have platform access
 */
export async function getExternalCompaniesWithAccess(): Promise<ExternalCompanyWithUsersDTO[]> {
  const companies = await externalCompanyRepository.findByPlatformAccess(true);

  return companies.map(company => ({
    ...toExternalCompanyDTO(company),
    users: company.maintainers?.map(user => ({
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      role: user.role,
    })) || null,
  }));
}

/**
 * Delete an external company
 */
export async function deleteExternalCompany(id: number): Promise<void> {
  const company = await externalCompanyRepository.findById(id);
  if (!company) {
    throw new NotFoundError("External company not found");
  }

  // Check if company has maintainers
  if (company.maintainers && company.maintainers.length > 0) {
    throw new BadRequestError("Cannot delete company with existing maintainers. Remove all maintainers first.");
  }

  const deleted = await externalCompanyRepository.deleteById(id);
  if (!deleted) {
    throw new BadRequestError("Failed to delete external company");
  }
}



// =========================
// EXTERNAL MAINTAINER CRUD SERVICES (ADMIN ONLY)
// =========================

/**
 * Create a new external maintainer
 */
export async function createExternalMaintainer(data: CreateExternalMaintainerData): Promise<ExternalMaintainerDTO> {
  // Validate input data
  if (!data.firstName || typeof data.firstName !== "string") {
    throw new BadRequestError("firstName is required");
  }
  if (!data.lastName || typeof data.lastName !== "string") {
    throw new BadRequestError("lastName is required");
  }
  if (!data.email || typeof data.email !== "string") {
    throw new BadRequestError("email is required");
  }
  if (!data.password || typeof data.password !== "string" || data.password.length < 8) {
    throw new BadRequestError("password is required and must be at least 8 characters");
  }
  if (!data.externalCompanyId || isNaN(parseInt(data.externalCompanyId))) {
    throw new BadRequestError("externalCompanyId is required and must be a valid integer");
  }

  // Check if company exists and has platform access
  const company = await externalCompanyRepository.findById(parseInt(data.externalCompanyId));
  if (!company) {
    throw new NotFoundError("External company not found");
  }
  if (!company.platformAccess) {
    throw new BadRequestError("Cannot create maintainer for company without platform access");
  }

  // Check if email already exists
  const existingUser = await userRepository.findByEmail(data.email);
  if (existingUser) {
    throw new BadRequestError("Email already exists");
  }

  // Hash password
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(data.password, saltRounds);
  const salt = await bcrypt.genSalt(saltRounds);

  // Create external maintainer user
  const userData = {
    email: data.email,
    first_name: data.firstName,
    last_name: data.lastName,
    password: hashedPassword,
    salt,
    role: Role.EXTERNAL_MAINTAINER,
    telegram_username: null,
    email_notifications_enabled: true,
    externalCompany: company,
  };

  const createdUser = await userRepository.create(userData);

  // Create a user object with the company for DTO conversion
  const userWithCompany = {
    ...createdUser,
    externalCompany: company
  };

  return toExternalMaintainerDTO(userWithCompany)!;
}

/**
 * Get all external maintainers
 */
export async function getAllExternalMaintainers(): Promise<ExternalMaintainerDTO[]> {
  const maintainers = await userRepository.findExternalMaintainersWithCompany();
  
  return maintainers
    .map(toExternalMaintainerDTO)
    .filter((dto): dto is ExternalMaintainerDTO => dto !== null);
}

/**
 * Get external maintainer by ID
 */
export async function getExternalMaintainerById(id: number): Promise<ExternalMaintainerDTO | null> {
  const maintainer = await userRepository.findExternalMaintainerByIdWithCompany(id);
  if (!maintainer) {
    return null;
  }
  return toExternalMaintainerDTO(maintainer);
}

/**
 * Delete external maintainer
 */
export async function deleteExternalMaintainer(id: number): Promise<boolean> {
  const maintainer = await userRepository.findById(id);
  if (!maintainer || maintainer.role !== Role.EXTERNAL_MAINTAINER) {
    return false;
  }

  // Check if maintainer has assigned reports
  const assignedReports = await reportRepository.findAssignedToUser(id, [ReportStatus.ASSIGNED, ReportStatus.IN_PROGRESS, ReportStatus.RESOLVED]);
  if (assignedReports.length > 0) {
    throw new BadRequestError("Cannot delete external maintainer with assigned reports");
  }

  return await userRepository.delete(id);
}



// =========================
// REPORT ASSIGNMENT SERVICES (TECH ONLY)
// =========================

/**
    * Get external companies and maintainers available for the report's category
 */
export async function getAssignableExternals(reportId: number, technicalUserId: number) {
  const report = await reportRepository.findByIdWithRelations(reportId);
  if (!report) throw new NotFoundError("Report not found");
  
  if (report.assignedOfficerId !== technicalUserId) {
    throw new ForbiddenError("Only the assigned technical officer can view assignable externals");
  }

  const companies = await externalCompanyRepository.findByCategory(report.category as ReportCategory);
  return companies.map(c => ({
    id: c.id,
    name: c.name,
    categories: c.categories,
    hasPlatformAccess: c.platformAccess,
    users: c.platformAccess ? c.maintainers?.map(u => ({
      id: u.id,
      firstName: u.first_name,
      lastName: u.last_name,
      email: u.email,
      role: u.role,
    })) ?? [] : null,
  }));
}

/**  
 * * Assign a report to an external maintainer or company
 */

export async function assignReportToExternal(
  reportId: number,
  technicalUserId: number,
  externalCompanyId: number,
  externalMaintainerId: number | null
) {
  const report = await reportRepository.findByIdWithRelations(reportId);
  if (!report) throw new NotFoundError("Report not found");
  
  // Only reports assigned to tech officers can be reassigned to external
  if (report.status !== ReportStatus.ASSIGNED) {
    throw new BadRequestError("Report must be in ASSIGNED status to assign to external maintainer");
  }
  
  // Only the assigned tech officer can assign to external
  if (report.assignedOfficerId !== technicalUserId) {
    throw new ForbiddenError("Only the assigned technical officer can assign to external maintainers");
  }
  
  if (report.externalMaintainerId || report.externalCompanyId) {
    throw new BadRequestError("Report is already assigned to an external entity");
  }

  const company = await externalCompanyRepository.findById(externalCompanyId);
  if (!company) throw new NotFoundError("External company not found");

  if (company.platformAccess) {
    if (!externalMaintainerId) {
      throw new BadRequestError("externalMaintainerId is required when company has platform access");
    }
    const maintainer = await userRepository.findById(externalMaintainerId);
    if (!maintainer) throw new NotFoundError("User not found");
    if (maintainer.role !== "EXTERNAL_MAINTAINER") {
      throw new BadRequestError("User is not an external maintainer");
    }
    if (maintainer.externalCompanyId !== company.id) {
      throw new BadRequestError("External maintainer does not belong to the specified company");
    }
    const updated = await reportRepository.update(reportId, {
      externalMaintainerId: maintainer.id,
      externalCompanyId: company.id,
      status: ReportStatus.EXTERNAL_ASSIGNED,
    });
    await reportMessageRepository.create({
      content: `Assigned to external maintainer: ${maintainer.first_name} ${maintainer.last_name} of company ${company.name}`,
      senderId: technicalUserId,
      reportId,
    });
    await notifyReportStatusChange(reportId, report.userId, ReportStatus.ASSIGNED, ReportStatus.EXTERNAL_ASSIGNED);
    await notifyReportAssigned(reportId, maintainer.id, report.title);
    return toReportDTO(updated!);
  } else {
    // No platform access: must not include maintainer
    if (externalMaintainerId) {
      throw new BadRequestError("externalMaintainerId must be null when company does not have platform access");
    }
    const updated = await reportRepository.update(reportId, {
      externalCompanyId: company.id,
      externalMaintainerId: null,
      status: ReportStatus.EXTERNAL_ASSIGNED,
    });
    await reportMessageRepository.create({
      content: `Assigned to external company: ${company.name}`,
      senderId: technicalUserId,
      reportId,
    });
    await notifyReportStatusChange(reportId, report.userId, ReportStatus.ASSIGNED, ReportStatus.EXTERNAL_ASSIGNED);
    return toReportDTO(updated!);
  }
}