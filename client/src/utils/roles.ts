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

export function getRoleLabel(role: string) {
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
