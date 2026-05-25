import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/get-session";
import { getPool } from "@/lib/db";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import sharp from "sharp";

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_WIDTH = 1200;
const WEBP_QUALITY = 75;

const uploadsDir = join(process.cwd(), "public", "uploads");

export async function POST(req: NextRequest) {
  const { user } = await getServerSession();

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

  // Check if user is admin — role lives in better_auth_user, not profiles
  const pool = getPool();
  const { rows: profileRows } = await pool.query(
    `SELECT role FROM better_auth_user WHERE id = $1`,
    [user.id]
  );
  const isAdmin =
    profileRows[0]?.role === "admin" ||
    profileRows[0]?.role === "super_admin";

  // Verify ticket access: admins can upload to any ticket, users only to their own
  if (isAdmin) {
    const { rows: ticketRows } = await pool.query(
      `SELECT id FROM support_tickets WHERE id = $1 LIMIT 1`,
      [ticketId]
    );
    if (ticketRows.length === 0) {
      return NextResponse.json(
        { error: "Ticket not found" },
        { status: 404 }
      );
    }
  } else {
    const { rows: ticketRows } = await pool.query(
      `SELECT id FROM support_tickets WHERE id = $1 AND user_id = $2 LIMIT 1`,
      [ticketId, user.id]
    );
    if (ticketRows.length === 0) {
      return NextResponse.json(
        { error: "Ticket not found or access denied" },
        { status: 403 }
      );
    }
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
  const filename = `${timestamp}-${safeName}.webp`;

  const originalKB = Math.round(rawBuffer.length / 1024);
  const compressedKB = Math.round(compressed.length / 1024);
  console.log(
    `[support/upload] Compressed: ${originalKB}KB → ${compressedKB}KB (${Math.round((1 - compressed.length / rawBuffer.length) * 100)}% reduction)`
  );

  // Save to local filesystem
  const dirPath = join(uploadsDir, user.id, ticketId);
  await mkdir(dirPath, { recursive: true });
  await writeFile(join(dirPath, filename), compressed);

  const publicUrl = `/uploads/${user.id}/${ticketId}/${filename}`;

  return NextResponse.json({ url: publicUrl });
}
