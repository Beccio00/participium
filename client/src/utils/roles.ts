export const MUNICIPALITY_ROLES = [
  "PUBLIC_RELATIONS",
  "CULTURE_EVENTS_TOURISM_SPORTS",
  "LOCAL_PUBLIC_SERVICES",
  "EDUCATION_SERVICES",
  "PUBLIC_RESIDENTIAL_HOUSING",
  "INFORMATION_SYSTEMS",
  "MUNICIPAL_BUILDING_MAINTENANCE",
  "PRIVATE_BUILDINGS",
  "INFRASTRUCTURES",
  "GREENSPACES_AND_ANIMAL_PROTECTION",
  "WASTE_MANAGEMENT",
  "ROAD_MAINTENANCE",
  "CIVIL_PROTECTION",
];

export const MUNICIPALITY_AND_EXTERNAL_ROLES = [
  ...MUNICIPALITY_ROLES,
  "EXTERNAL_MAINTAINER"
];

export function getRoleLabel(role: string) {
  switch (role) {
    case "ADMINISTRATOR":
      return "Administrator";
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
