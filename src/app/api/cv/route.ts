import { type NextRequest } from "next/server";
import { put } from "@vercel/blob";
import mammoth from "mammoth";
import { extractText, getDocumentProxy } from "unpdf";
import { getServerSession } from "@/lib/auth";
import { extractSkills } from "@/lib/anthropic";
import { saveProfile } from "@/lib/profile-index";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_BYTES = 8 * 1024 * 1024;

/** Reads raw text out of a PDF or DOCX résumé. */
async function readCvText(
  bytes: Buffer,
  kind: "pdf" | "docx",
): Promise<string> {
  if (kind === "docx") {
    const { value } = await mammoth.extractRawText({ buffer: bytes });
    return value;
  }
  const pdf = await getDocumentProxy(new Uint8Array(bytes));
  const { text } = await extractText(pdf, { mergePages: true });
  return text;
}

/**
 * CV upload (P10) — the GitHub-less path into AI matching. Stores the
 * file in Vercel Blob, extracts text, and runs skill extraction.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session) {
    return Response.json({ error: "Sign in to upload a CV." }, { status: 401 });
  }

  const form = await req.formData();
  const file = form.get("cv");
  if (!(file instanceof File)) {
    return Response.json({ error: "No file provided." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return Response.json({ error: "File too large — 8MB max." }, { status: 400 });
  }

  const name = file.name.toLowerCase();
  const kind: "pdf" | "docx" | null = name.endsWith(".pdf")
    ? "pdf"
    : name.endsWith(".docx")
      ? "docx"
      : null;
  if (!kind) {
    return Response.json(
      { error: "Upload a PDF or DOCX file." },
      { status: 400 },
    );
  }

  const bytes = Buffer.from(await file.arrayBuffer());

  // 1. Store the CV in Blob, when configured.
  let resumeUrl: string | undefined;
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const blob = await put(
        `cv/${session.user.id}/${Date.now()}-${file.name}`,
        bytes,
        { access: "public", contentType: file.type || undefined },
      );
      resumeUrl = blob.url;
    } catch (err) {
      console.error("Blob upload failed:", err);
    }
  }

  // 2. Extract text.
  let text = "";
  try {
    text = await readCvText(bytes, kind);
  } catch (err) {
    console.error("CV text extraction failed:", err);
  }
  if (!text.trim()) {
    return Response.json(
      { error: "Could not read any text from that file." },
      { status: 422 },
    );
  }

  // 3. Skill extraction + save the profile.
  const extracted = await extractSkills(text);
  await saveProfile(session.user, extracted, { source: "cv", resumeUrl });

  return Response.json({
    ok: true,
    skills: extracted.skills,
    ecosystems: extracted.ecosystems,
  });
}
