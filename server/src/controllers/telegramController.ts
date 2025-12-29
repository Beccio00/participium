import { Request, Response } from "express";
import {
  generateTelegramLinkToken,
  linkTelegramAccount,
  getTelegramStatus,
  unlinkTelegramAccount,
  createReportFromTelegram,
} from "../services/telegramService";
import type { TelegramLinkRequestDTO, TelegramCreateReportRequestDTO } from "../interfaces/TelegramDTO";
import { UserRepository } from "../repositories/UserRepository";

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

export async function createReport(req: Request, res: Response): Promise<void> {
  const data = req.body as TelegramCreateReportRequestDTO;
  const result = await createReportFromTelegram(data);
  res.status(201).json(result);
}

export async function checkLinked(req: Request, res: Response): Promise<void> {
  const { telegramId } = req.body as { telegramId?: string };
  if (!telegramId) {
    res.status(400).json({ linked: false, message: "telegramId is required" });
    return;
  }
  const userRepo = new UserRepository();
  const user = await userRepo.findByTelegramId(telegramId);
  res.status(200).json({ linked: !!user });
}
