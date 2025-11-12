export const MUNICIPALITY_ROLES = ['PUBLIC_RELATIONS', 'TECHNICAL_OFFICE'];

export function getRoleLabel(role: string) {
  switch (role) {
    case 'PUBLIC_RELATIONS':
      return 'Public Relations';
    case 'TECHNICAL_OFFICE':
      return 'Technical Office';
    case 'ADMINISTRATOR':
      return 'Administrator';
    default:
      return role;
  }
}
