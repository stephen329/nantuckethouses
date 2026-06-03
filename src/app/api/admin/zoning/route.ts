import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const DATA_FILE = path.join(process.cwd(), "src/data/zoning-districts.json");

type ZoningData = {
  districts: Record<string, Record<string, string>>;
  neighborhoodDistricts: Record<string, string[]>;
};

function readData(): ZoningData {
  const raw = fs.readFileSync(DATA_FILE, "utf-8");
  const parsed = JSON.parse(raw);
  // Migrate old neighborhoodDefaults (string) to neighborhoodDistricts (string[])
  if (parsed.neighborhoodDefaults && !parsed.neighborhoodDistricts) {
    parsed.neighborhoodDistricts = {};
    for (const [name, district] of Object.entries(parsed.neighborhoodDefaults)) {
      parsed.neighborhoodDistricts[name] = [district as string];
    }
    delete parsed.neighborhoodDefaults;
  }
  return parsed as ZoningData;
}

function writeData(data: ZoningData) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
}

/** GET /api/admin/zoning — list all districts + neighborhood mappings */
export async function GET() {
  const data = readData();
  return NextResponse.json(data);
}

/** PUT /api/admin/zoning — update a district or create a new one */
export async function PUT(request: Request) {
  const { code, district } = await request.json();
  if (!code || !district) {
    return NextResponse.json({ error: "code and district required" }, { status: 400 });
  }

  const data = readData();
  data.districts[code] = district;
  writeData(data);

  return NextResponse.json({ success: true, code });
}

/** DELETE /api/admin/zoning — remove a district */
export async function DELETE(request: Request) {
  const { code } = await request.json();
  if (!code) {
    return NextResponse.json({ error: "code required" }, { status: 400 });
  }

  const data = readData();
  delete data.districts[code];
  // Also remove from any neighborhood mappings
  for (const [name, districts] of Object.entries(data.neighborhoodDistricts)) {
    data.neighborhoodDistricts[name] = districts.filter((d) => d !== code);
  }
  writeData(data);

  return NextResponse.json({ success: true });
}

/** PATCH /api/admin/zoning — update neighborhood district assignments */
export async function PATCH(request: Request) {
  const { neighborhood, districts } = await request.json();
  if (!neighborhood || !Array.isArray(districts)) {
    return NextResponse.json({ error: "neighborhood and districts[] required" }, { status: 400 });
  }

  const data = readData();
  data.neighborhoodDistricts[neighborhood] = districts;
  writeData(data);

  return NextResponse.json({ success: true, neighborhood, districts });
}
