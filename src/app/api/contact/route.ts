import { NextResponse } from "next/server";
import { Resend } from "resend";

type ContactFormData = {
  name: string;
  email: string;
  phone?: string;
  message?: string;
  propertyType?: string;
  timeline?: string;
  source?: string; // Which form submitted (homepage, market-index, etc.)
};

export async function POST(request: Request) {
  try {
    const body: ContactFormData = await request.json();
    
    // Validate required fields
    if (!body.name || !body.email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    // Check for Resend API key
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error("Missing RESEND_API_KEY environment variable");
      // In development, log the submission instead of failing
      console.log("Form submission (email not sent - no API key):", body);
      return NextResponse.json({
        success: true,
        message: "Form received (email delivery not configured)",
      });
    }

    const resend = new Resend(apiKey);

    // Build email content
    const emailHtml = `
      <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1A2A3A; padding: 20px; text-align: center;">
          <h1 style="color: #C9A227; margin: 0; font-size: 24px;">New Inquiry from NantucketHouses.com</h1>
        </div>
        
        <div style="padding: 30px; background: #FAF8F5;">
          <h2 style="color: #1A2A3A; margin-top: 0;">Contact Details</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #E8E8E8; font-weight: bold; color: #1A2A3A;">Name:</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #E8E8E8; color: #1A2A3A;">${body.name}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #E8E8E8; font-weight: bold; color: #1A2A3A;">Email:</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #E8E8E8;">
                <a href="mailto:${body.email}" style="color: #C9A227;">${body.email}</a>
              </td>
            </tr>
            ${body.phone ? `
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #E8E8E8; font-weight: bold; color: #1A2A3A;">Phone:</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #E8E8E8;">
                <a href="tel:${body.phone}" style="color: #C9A227;">${body.phone}</a>
              </td>
            </tr>
            ` : ""}
            ${body.propertyType ? `
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #E8E8E8; font-weight: bold; color: #1A2A3A;">Property Interest:</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #E8E8E8; color: #1A2A3A;">${body.propertyType}</td>
            </tr>
            ` : ""}
            ${body.timeline ? `
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #E8E8E8; font-weight: bold; color: #1A2A3A;">Timeline:</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #E8E8E8; color: #1A2A3A;">${body.timeline}</td>
            </tr>
            ` : ""}
          </table>
          
          ${body.message ? `
          <div style="margin-top: 20px;">
            <h3 style="color: #1A2A3A; margin-bottom: 10px;">Message:</h3>
            <div style="background: white; padding: 15px; border-radius: 4px; border: 1px solid #D6C8B0;">
              <p style="color: #1A2A3A; margin: 0; white-space: pre-wrap;">${body.message}</p>
            </div>
          </div>
          ` : ""}
        </div>
        
        <div style="background: #E8E8E8; padding: 15px; text-align: center; font-size: 12px; color: #1A2A3A;">
          <p style="margin: 0;">
            Submitted from: ${body.source || "NantucketHouses.com"}<br>
            ${new Date().toLocaleString("en-US", { timeZone: "America/New_York" })} EST
          </p>
        </div>
      </div>
    `;

    const emailText = `
New Inquiry from NantucketHouses.com

Name: ${body.name}
Email: ${body.email}
${body.phone ? `Phone: ${body.phone}` : ""}
${body.propertyType ? `Property Interest: ${body.propertyType}` : ""}
${body.timeline ? `Timeline: ${body.timeline}` : ""}

${body.message ? `Message:\n${body.message}` : ""}

---
Submitted from: ${body.source || "NantucketHouses.com"}
${new Date().toLocaleString("en-US", { timeZone: "America/New_York" })} EST
    `.trim();

    // Send email via Resend
    // Using Resend's shared domain until nantuckethouses.com is verified
    const { data, error } = await resend.emails.send({
      from: "Nantucket Houses <onboarding@resend.dev>",
      to: ["stephen@maury.net"],
      replyTo: body.email,
      subject: `New Inquiry: ${body.name}${body.propertyType ? ` - ${body.propertyType}` : ""}`,
      html: emailHtml,
      text: emailText,
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json(
        { error: "Failed to send email", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      messageId: data?.id,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Contact API error:", message);
    
    return NextResponse.json(
      { error: "Failed to process request", details: message },
      { status: 500 }
    );
  }
}
