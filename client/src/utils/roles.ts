import { Role } from "../../../shared/RoleTypes";

export const TECHNICIAN_ROLES = [
  Role.CULTURE_EVENTS_TOURISM_SPORTS.toString(),
  Role.LOCAL_PUBLIC_SERVICES.toString(),
  Role.EDUCATION_SERVICES.toString(),
  Role.PUBLIC_RESIDENTIAL_HOUSING.toString(),
  Role.INFORMATION_SYSTEMS.toString(),
  Role.MUNICIPAL_BUILDING_MAINTENANCE.toString(),
  Role.PRIVATE_BUILDINGS.toString(),
  Role.INFRASTRUCTURES.toString(),
  Role.GREENSPACES_AND_ANIMAL_PROTECTION.toString(),
  Role.WASTE_MANAGEMENT.toString(),
  Role.ROAD_MAINTENANCE.toString(),
  Role.CIVIL_PROTECTION.toString(),
];

export const MUNICIPALITY_ROLES = [
  ...TECHNICIAN_ROLES,
  Role.PUBLIC_RELATIONS.toString()
];

export const MUNICIPALITY_AND_EXTERNAL_ROLES = [
  ...MUNICIPALITY_ROLES,
  Role.EXTERNAL_MAINTAINER.toString()
];

/**
 * Get a simplified role label for chat display.
 * - Citizen → "Citizen"
 * - Public Relations → "Public Relations"
 * - External Maintainer → "External Maintainer"
 * - Any tech role → "Tech Officer"
 */
export function getChatRoleLabel(role: string | string[]): string {
  const roles = Array.isArray(role) ? role : [role];
  
  // Check for specific non-tech roles first
  if (roles.includes(Role.CITIZEN.toString())) {
    return "Citizen";
  }
  if (roles.includes(Role.PUBLIC_RELATIONS.toString())) {
    return "Public Relations";
  }
  if (roles.includes(Role.EXTERNAL_MAINTAINER.toString())) {
    return "External Maintainer";
  }
  
  // If any role is a tech officer role, show "Tech Officer"
  const hasTechRole = roles.some(r => TECHNICIAN_ROLES.includes(r));
  if (hasTechRole) {
    return "Tech Officer";
  }
  
  // Fallback for admin or unknown
  if (roles.includes(Role.ADMINISTRATOR.toString())) {
    return "Administrator";
  }
  
  return roles[0] || "Unknown role";
}

/**
 * Validate role combinations:
 * - Public Relations can only be assigned alone
 * - Multiple roles are only allowed if all are tech officer roles
 */
export function validateRoleCombination(roles: string[]): { valid: boolean; error?: string } {
  if (roles.length === 0) {
    return { valid: false, error: "At least one role must be selected" };
  }
  
  // Multiple roles are only allowed if all are tech officer roles
  // This also prevents PUBLIC_RELATIONS from being combined with other roles
  // since PUBLIC_RELATIONS is not a technical role
  if (roles.length > 1) {
    const allAreTechRoles = roles.every(r => TECHNICIAN_ROLES.includes(r));
    if (!allAreTechRoles) {
      return { valid: false, error: "Multiple roles can only be assigned if all are technical officer roles" };
    }
  }
  
  return { valid: true };
}

// Helper function to cast single role into array
export function getRoleLabel(role: string | string[]): string {
  if (Array.isArray(role)) {
    return role.map(r => getSingleRoleLabel(r)).join(", ");
  }
  return getSingleRoleLabel(role);
}

// Helper function to verify user role
export function userHasRole(user: any, role: string): boolean {
  if (!user?.role) return false;
  if (Array.isArray(user.role)) {
    return user.role.includes(role);
  }
  return user.role === role;
}

// Helper function to verify if user has at least one role of the list
export function userHasAnyRole(user: any, roles: string[]): boolean {
  if (!user?.role) return false;
  if (Array.isArray(user.role)) {
    return user.role.some((r: string) => roles.includes(r));
  }
  return roles.includes(user.role);
}

export function getSingleRoleLabel(role: string) {
  switch (role) {
    case "ADMINISTRATOR":
      return "Administrator";
    case "CITIZEN":
      return "Citizen";
    case "PUBLIC_RELATIONS":
      return "Public Relations";
    case "CULTURE_EVENTS_TOURISM_SPORTS":
      return "Culture, Events, Tourism and Sports";
    case "LOCAL_PUBLIC_SERVICES":
      return "Local Public Services";
    case "EDUCATION_SERVICES":
      return "Education Services";
    case "PUBLIC_RESIDENTIAL_HOUSING":
      return "Public Residential Housing";
    case "INFORMATION_SYSTEMS":
      return "Information Systems (IT)";
    case "MUNICIPAL_BUILDING_MAINTENANCE":
      return "Municipal Building Maintenance";
    case "PRIVATE_BUILDINGS":
      return "Private Buildings";
    case "INFRASTRUCTURES":
      return "Infrastructures";
    case "GREENSPACES_AND_ANIMAL_PROTECTION":
      return "Green Spaces & Animal Protection";
    case "WASTE_MANAGEMENT":
      return "Waste Management";
    case "ROAD_MAINTENANCE":
      return "Road Maintenance";
    case "CIVIL_PROTECTION":
      return "Civil Protection";
    case "EXTERNAL_MAINTAINER":
      return "External Maintainer";
    default:
      return role;
  }
}
