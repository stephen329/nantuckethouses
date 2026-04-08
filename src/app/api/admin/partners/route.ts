import { NextResponse } from "next/server";
import { readFile, writeFile } from "fs/promises";
import path from "path";

const PARTNERS_PATH = path.join(process.cwd(), "src/data/partners.json");

export async function GET() {
  const data = await readFile(PARTNERS_PATH, "utf-8");
  return NextResponse.json(JSON.parse(data));
}

export async function PUT(req: Request) {
  const partners = await req.json();
  await writeFile(PARTNERS_PATH, JSON.stringify(partners, null, 2) + "\n");
  return NextResponse.json({ ok: true });
}
