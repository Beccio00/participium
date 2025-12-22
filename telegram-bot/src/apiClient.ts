import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const API_BASE_URL = process.env.API_BASE_URL;

export async function callBackend(): Promise<string> { 
  const res = await axios.get(`${API_BASE_URL}/health`);
  return res.data.status;
}
