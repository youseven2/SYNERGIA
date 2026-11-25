import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

declare global {
  var __synergiaServerState: unknown;
}

async function getStoreFilePath(): Promise<string> {
  const localPath = path.join(process.cwd(), ".synergia-state.json");
  try {
    await fs.access(process.cwd(), fs.constants.W_OK);
    return localPath;
  } catch {
    return "/tmp/synergia-state.json";
  }
}

async function readStoredState(): Promise<unknown | null> {
  if (globalThis.__synergiaServerState) {
    return globalThis.__synergiaServerState;
  }
  try {
    const filePath = await getStoreFilePath();
    const raw = await fs.readFile(filePath, "utf8");
    const parsed = JSON.parse(raw);
    globalThis.__synergiaServerState = parsed;
    return parsed;
  } catch {
    return null;
  }
}

async function writeStoredState(data: unknown): Promise<void> {
  globalThis.__synergiaServerState = data;
  try {
    const filePath = await getStoreFilePath();
    await fs.writeFile(filePath, JSON.stringify(data), "utf8");
  } catch {
    // Keep in-memory state even if filesystem is read-only
  }
}

export async function GET() {
  const state = await readStoredState();
  return NextResponse.json({ state });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body || typeof body !== "object") {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
    const nextState = "state" in body ? body.state : body;
    await writeStoredState(nextState);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
