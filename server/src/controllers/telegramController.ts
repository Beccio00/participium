import { Request, Response } from "express";
import {
  generateTelegramLinkToken,
  linkTelegramAccount,
  getTelegramStatus,
  unlinkTelegramAccount,
} from "../services/telegramService";
import type { TelegramLinkRequestDTO } from "../interfaces/TelegramDTO";

export async function generateToken(req: Request, res: Response): Promise<void> {
  const user = req.user as { id: number };
  const result = await generateTelegramLinkToken(user.id);
  res.status(200).json(result);
}


export async function linkAccount(req: Request, res: Response): Promise<void> {
  const { token, telegramId, telegramUsername } = req.body as TelegramLinkRequestDTO;
  const result = await linkTelegramAccount(token, telegramId, telegramUsername);
  res.status(200).json(result);
}

export async function getStatus(req: Request, res: Response): Promise<void> {
  const user = req.user as { id: number };
  const result = await getTelegramStatus(user.id);
  res.status(200).json(result);
}

export async function unlink(req: Request, res: Response): Promise<void> {
  const user = req.user as { id: number };
  const result = await unlinkTelegramAccount(user.id);
  res.status(200).json(result);
}
