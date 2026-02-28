import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import sharp from "sharp";

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_WIDTH = 1200;
const WEBP_QUALITY = 75;

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const ticketId = formData.get("ticketId") as string | null;

  if (!file || !ticketId) {
    return NextResponse.json(
      { error: "File and ticketId are required" },
      { status: 400 }
    );
  }

  // Verify ticket belongs to the authenticated user (defense-in-depth)
  const { data: ticket, error: ticketError } = await supabase
    .from("support_tickets")
    .select("id")
    .eq("id", ticketId)
    .eq("user_id", user.id)
    .single();

  if (ticketError || !ticket) {
    return NextResponse.json(
      { error: "Ticket not found or access denied" },
      { status: 403 }
    );
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Invalid file type. Only PNG, JPG, GIF and WebP are accepted." },
      { status: 400 }
    );
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "File too large. Maximum 5MB." },
      { status: 400 }
    );
  }

  const rawBuffer = Buffer.from(await file.arrayBuffer());

  // Compress: resize to max 1200px width, convert to WebP @ 75% quality
  // GIFs lose animation but that's acceptable for support screenshots
  const compressed = await sharp(rawBuffer)
    .resize({ width: MAX_WIDTH, withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY })
    .toBuffer();

  const timestamp = Date.now();
  const safeName = file.name
    .replace(/\.[^.]+$/, "") // remove original extension
    .replace(/[^a-zA-Z0-9.-]/g, "_")
    .substring(0, 50);
  const path = `${user.id}/${ticketId}/${timestamp}-${safeName}.webp`;

  const originalKB = Math.round(rawBuffer.length / 1024);
  const compressedKB = Math.round(compressed.length / 1024);
  console.log(
    `[support/upload] Compressed: ${originalKB}KB → ${compressedKB}KB (${Math.round((1 - compressed.length / rawBuffer.length) * 100)}% reduction)`
  );

  const { error } = await supabase.storage
    .from("ticket-attachments")
    .upload(path, compressed, {
      contentType: "image/webp",
      upsert: false,
    });

  if (error) {
    console.error("[support/upload] Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("ticket-attachments").getPublicUrl(path);

  return NextResponse.json({ url: publicUrl });
}
