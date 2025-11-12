export interface MunicipalityUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: 'PUBLIC_RELATIONS' | 'ADMINISTRATOR' | 'TECHNICAL_OFFICE';
}

export interface MunicipalityUserResponse {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: 'PUBLIC_RELATIONS' | 'ADMINISTRATOR' | 'TECHNICAL_OFFICE';
}