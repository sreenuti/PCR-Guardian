import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PDFDocument, StandardFonts } from "pdf-lib";
import type { Violation, Profile } from "@/types/database";

type NoticeType = "first" | "second" | "pc-209" | "cure-confirmation";

function formatDate(date: Date): string {
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
}

async function generateNoticePdf(
  noticeType: NoticeType,
  violation: Violation,
  profile: Profile | null
) {
  const doc = await PDFDocument.create();
  const page = doc.addPage();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const { width, height } = page.getSize();
  const margin = 50;
  const fontSize = 12;

  const drawLines = (lines: string[], startY: number) => {
    let y = startY;
    for (const line of lines) {
      if (y < margin) break;
      page.drawText(line, {
        x: margin,
        y,
        size: fontSize,
        font,
      });
      y -= fontSize * 1.4;
    }
  };

  const today = new Date();
  const residentName = profile?.full_name ?? "Resident";
  const propertyLine = "Property: [Your property address on file]";

  let title = "";
  let bodyLines: string[] = [];

  if (noticeType === "first") {
    title = "Notice of Design Guideline Violation";
    bodyLines = [
      `Date: ${formatDate(today)}`,
      "",
      `${residentName}`,
      propertyLine,
      "",
      "Re: Notice of Design Guideline Violation",
      "",
      "Dear Resident,",
      "",
      "During a recent inspection, the following violation of the PCR Community Association guidelines was noted:",
      "",
      `- Violation: ${violation.description ?? "Fence maintenance issue."}`,
      "- Requirement: Use approved color Ready Seal Pecan.",
      "",
      "Please remedy this within ten (10) days to avoid further enforcement action.",
      "If you have already corrected this, please upload a photo to the PCR Clarity Portal to stop the clock.",
      "",
      "Sincerely,",
      "Insight Management Team",
    ];
  } else if (noticeType === "second") {
    title = "SECOND REQUEST - ACTION REQUIRED";
    const firstNoticeDate = formatDate(new Date(violation.violation_date));
    bodyLines = [
      `Date: ${formatDate(today)}`,
      "",
      `${residentName}`,
      propertyLine,
      "",
      "Subject: SECOND REQUEST - ACTION REQUIRED",
      "",
      "Dear Resident,",
      "",
      `The Association previously notified you on ${firstNoticeDate} regarding a fence maintenance violation.`,
      "To date, our records show this has not been corrected.",
      "",
      "One of our primary purposes is the protection and enhancement of community property values.",
      "Please remedy this violation within ten (10) days to avoid the escalation of this matter to the Board.",
      "",
      "Sincerely,",
      "Insight Management Team",
    ];
  } else if (noticeType === "pc-209") {
    title = "FINAL NOTICE OF VIOLATION";
    bodyLines = [
      `Date: ${formatDate(today)}`,
      "VIA CERTIFIED MAIL",
      "",
      `${residentName}`,
      propertyLine,
      "",
      "Subject: FINAL NOTICE OF VIOLATION",
      "",
      "Dear Resident,",
      "",
      "This is the Final Notice regarding your fence maintenance violation.",
      "You have ten (10) days from the date of this letter to correct this issue.",
      "",
      "LEGAL CONSEQUENCES OF NON-COMPLIANCE:",
      "- Failure to remedy will result in Violation Fines of $50.00 PER DAY.",
      "- Suspension of common area use.",
      "- Charging of attorney's fees to your account.",
      "",
      "YOUR RIGHTS:",
      "You have the right to request a hearing before the Board.",
      "This request must be received in writing within thirty (30) days of your receipt of this letter.",
      "",
      "Sincerely,",
      "Insight Management Team",
    ];
  } else if (noticeType === "cure-confirmation") {
    title = "Cure Confirmation - Stop-Clock Proof";
    const cureDate = violation.cure_photo_uploaded_at
      ? new Date(violation.cure_photo_uploaded_at)
      : today;
    bodyLines = [
      `Date: ${formatDate(today)}`,
      "",
      `${residentName}`,
      propertyLine,
      "",
      "Re: Cure Confirmation - Fence Maintenance Violation",
      "",
      "Dear Resident,",
      "",
      "Thank you for submitting cure photos through the PCR Clarity Portal.",
      `This letter confirms that your cure photo was recorded on ${formatDate(
        cureDate
      )} and that fine accrual for this violation has been stopped as of that date.`,
      "",
      "Please retain this confirmation for your records.",
      "",
      "Sincerely,",
      "Insight Management Team",
    ];
  }

  page.drawText(title, {
    x: margin,
    y: height - margin,
    size: 16,
    font,
  });

  drawLines(bodyLines, height - margin - 32);

  const pdfBytes = await doc.save();
  const filenameBase =
    noticeType === "first"
      ? "first-notice"
      : noticeType === "second"
      ? "second-notice"
      : noticeType === "pc-209"
      ? "pc-209-notice"
      : "cure-confirmation";

  return new NextResponse(pdfBytes, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filenameBase}.pdf"`,
    },
  });
}

export async function GET(
  _req: Request,
  context: { params: Promise<{ violationId: string; noticeType: NoticeType }> }
) {
  const { violationId, noticeType } = await context.params;

  if (
    noticeType !== "first" &&
    noticeType !== "second" &&
    noticeType !== "pc-209" &&
    noticeType !== "cure-confirmation"
  ) {
    return NextResponse.json({ error: "Invalid notice type" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: violation, error: violationError } = await supabase
    .from("violations")
    .select("*")
    .eq("id", violationId)
    .eq("user_id", user.id)
    .single();

  if (violationError || !violation) {
    return NextResponse.json({ error: "Violation not found" }, { status: 404 });
  }

  if (noticeType === "cure-confirmation") {
    if (!violation.cure_photo_uploaded_at) {
      return NextResponse.json(
        { error: "Cure confirmation not available for this violation" },
        { status: 400 }
      );
    }
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return generateNoticePdf(
    noticeType,
    violation as Violation,
    (profile as Profile) ?? null
  );
}

