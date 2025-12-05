import { ReportCategory } from "./ReportTypes";

export interface CreateExternalCompanyData {
  name: string;
  categories: ReportCategory[];
  platformAccess: boolean;
}

export interface ExternalCompanyResponse {
  id: number;
  name: string;
  categories: ReportCategory[];
  platformAccess: boolean;
}

export interface CreateExternalMaintainerData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  externalCompanyId: string;
}

export interface ExternalMaintainerResponse {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  company: {
    id:number,
    name:string
  };
}

export interface AssignReportToExternalResponse {
  message: string;
  report: any;
}