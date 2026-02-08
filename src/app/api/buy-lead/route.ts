import { NextResponse } from "next/server";
import { Resend } from "resend";

type BuyLeadData = {
  lifestyles?: string[];
  amenities?: string[];
  priceRange: string;
  timeline: string;
  fullName: string;
  email: string;
  phone?: string;
  textAlerts?: boolean;
  scheduleCall?: boolean;
};

const PRICE_LABELS: Record<string, string> = {
  "2-5": "$2M – $5M",
  "5-10": "$5M – $10M",
  "10-plus": "$10M+",
  "specific-asset": "Specific off-market asset",
};

const TIMELINE_LABELS: Record<string, string> = {
  asap: "ASAP",
  "3-6-months": "Next 3-6 Months",
  browsing: "Just Browsing",
};

const LIFESTYLE_LABELS: Record<string, string> = {
  "waterfront-views": "Waterfront & Water Views",
  "quiet-secluded": "Quiet & Secluded",
  "active-summer": "Active Summer",
};

const AMENITY_LABELS: Record<string, string> = {
  "private-pool": "Private Pool",
  "guest-cottage": "Guest Cottage/Studio",
  "modern-turnkey": "Modern/Turnkey Design",
  "investment-rental": "Investment/Rental Potential",
  "conservation-border": "Conservation Land Border",
};

export async function POST(request: Request) {
  try {
    const body: BuyLeadData = await request.json();

    if (!body.email || !body.fullName || !body.priceRange || !body.timeline) {
      return NextResponse.json(
        { error: "Full name, email, price range, and timeline are required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.log("Buy lead (email not sent - no API key):", body);
      return NextResponse.json({
        success: true,
        message: "Lead received (email delivery not configured)",
      });
    }

    const resend = new Resend(apiKey);

    const lifestyleList =
      body.lifestyles?.map((v) => LIFESTYLE_LABELS[v] ?? v).join(", ") || "—";
    const amenityList =
      body.amenities?.map((v) => AMENITY_LABELS[v] ?? v).join(", ") || "—";
    const priceLabel = PRICE_LABELS[body.priceRange] ?? body.priceRange;
    const timelineLabel = TIMELINE_LABELS[body.timeline] ?? body.timeline;

    const emailHtml = `
      <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1A2A3A; padding: 20px; text-align: center;">
          <h1 style="color: #C9A227; margin: 0; font-size: 24px;">New Buy Lead — buy.nantuckethouses.com</h1>
        </div>
        <div style="padding: 30px; background: #FAF8F5;">
          <h2 style="color: #1A2A3A; margin-top: 0;">Request access</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #E8E8E8; font-weight: bold; color: #1A2A3A;">Full name:</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #E8E8E8; color: #1A2A3A;">${body.fullName}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #E8E8E8; font-weight: bold; color: #1A2A3A;">Email:</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #E8E8E8;">
                <a href="mailto:${body.email}" style="color: #C9A227;">${body.email}</a>
              </td>
            </tr>
            ${
              body.phone
                ? `
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #E8E8E8; font-weight: bold; color: #1A2A3A;">Mobile:</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #E8E8E8;">
                <a href="tel:${body.phone}" style="color: #C9A227;">${body.phone}</a>
              </td>
            </tr>
            `
                : ""
            }
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #E8E8E8; font-weight: bold; color: #1A2A3A;">Lifestyle (Dream):</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #E8E8E8; color: #1A2A3A;">${lifestyleList}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #E8E8E8; font-weight: bold; color: #1A2A3A;">Must-have amenities:</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #E8E8E8; color: #1A2A3A;">${amenityList}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #E8E8E8; font-weight: bold; color: #1A2A3A;">Price range:</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #E8E8E8; color: #1A2A3A;">${priceLabel}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #E8E8E8; font-weight: bold; color: #1A2A3A;">Timeline:</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #E8E8E8; color: #1A2A3A;">${timelineLabel}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #E8E8E8; font-weight: bold; color: #1A2A3A;">Text me private listing alerts:</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #E8E8E8; color: #1A2A3A;">${body.textAlerts ? "Yes" : "No"}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #E8E8E8; font-weight: bold; color: #1A2A3A;">15-min Market Strategy Call requested:</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #E8E8E8; color: #1A2A3A;">${body.scheduleCall ? "Yes" : "No"}</td>
            </tr>
          </table>
        </div>
        <div style="background: #E8E8E8; padding: 15px; text-align: center; font-size: 12px; color: #1A2A3A;">
          Source: buy.nantuckethouses.com · ${new Date().toLocaleString("en-US", { timeZone: "America/New_York" })} EST
        </div>
      </div>
    `;

    const { data, error } = await resend.emails.send({
      from: "Nantucket Houses <onboarding@resend.dev>",
      to: ["stephen@maury.net"],
      replyTo: body.email,
      subject: `Buy Lead: ${body.fullName} · ${priceLabel}`,
      html: emailHtml,
    });

    if (error) {
      console.error("Resend error (buy-lead):", error);
      return NextResponse.json(
        { error: "Failed to send", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, messageId: data?.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Buy lead API error:", message);
    return NextResponse.json(
      { error: "Failed to process request", details: message },
      { status: 500 }
    );
  }
}
