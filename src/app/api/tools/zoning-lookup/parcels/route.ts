import { promises as fs } from "node:fs";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";

const PARCEL_DATA_PATH = path.join(
  process.cwd(),
  "src",
  "data",
  "zoning-tool",
  "nantucket-tax-parcels.clean.geojson",
);

export async function GET(request: NextRequest) {
  try {
    const fileContent = await fs.readFile(PARCEL_DATA_PATH, "utf8");
    const url = new URL(request.url);
    const wantsDownload = url.searchParams.get("download") === "1";

    return new NextResponse(fileContent, {
      status: 200,
      headers: {
        "Content-Type": "application/geo+json; charset=utf-8",
        ...(wantsDownload
          ? {
              "Content-Disposition":
                'attachment; filename="nantucket-tax-parcels.clean.geojson"',
            }
          : {}),
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Parcel dataset is not available." },
      { status: 500 },
    );
  }
}
