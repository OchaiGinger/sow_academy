import { readFileSync } from "node:fs";
import { inflateRawSync } from "node:zlib";
import { config } from "dotenv";
import { hashPassword } from "better-auth/crypto";

config();

function readZip(path: string): Map<string, Buffer> {
  const buf = readFileSync(path);
  const list: { name: string; method: number; compSize: number; offset: number }[] = [];
  let eocd = -1;
  for (let i = buf.length - 22; i >= 0; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  }
  const count = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  for (let n = 0; n < count; n++) {
    const method = buf.readUInt16LE(p + 10);
    const compSize = buf.readUInt32LE(p + 20);
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const commentLen = buf.readUInt16LE(p + 32);
    const offset = buf.readUInt32LE(p + 42);
    list.push({ name: buf.slice(p + 46, p + 46 + nameLen).toString("utf8"), method, compSize, offset });
    p += 46 + nameLen + extraLen + commentLen;
  }
  const out = new Map<string, Buffer>();
  for (const e of list) {
    const lh = e.offset;
    const dataStart = lh + 30 + buf.readUInt16LE(lh + 26) + buf.readUInt16LE(lh + 28);
    const data = buf.slice(dataStart, dataStart + e.compSize);
    out.set(e.name, e.method === 0 ? data : inflateRawSync(data));
  }
  return out;
}

const dec = (s: string) =>
  s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)))
    .replace(/&amp;/g, "&");

function colIndex(ref: string): number {
  let n = 0;
  for (const ch of ref.replace(/[0-9]/g, "")) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
}

function parseSheet(path: string): Record<number, string>[] {
  const zip = readZip(path);
  const sstName = [...zip.keys()].find((k) => k.endsWith("sharedStrings.xml"));
  const sst: string[] = [];
  if (sstName) {
    const xml = zip.get(sstName)!.toString("utf8");
    const siRe = /<si>([\s\S]*?)<\/si>|<si\/>/g;
    let m: RegExpExecArray | null;
    while ((m = siRe.exec(xml))) {
      let text = "";
      const tRe = /<t[^>]*>([\s\S]*?)<\/t>/g;
      let t: RegExpExecArray | null;
      while ((t = tRe.exec(m[1] ?? ""))) text += t[1];
      sst.push(dec(text));
    }
  }
  const sheetName = [...zip.keys()].find((k) => /^xl\/worksheets\/sheet\d+\.xml$/.test(k))!;
  const xml = zip.get(sheetName)!.toString("utf8");
  const rows: Record<number, string>[] = [];
  const rowRe = /<row[^>]*r="(\d+)"[^>]*>([\s\S]*?)<\/row>/g;
  let r: RegExpExecArray | null;
  while ((r = rowRe.exec(xml))) {
    const cells: Record<number, string> = {};
    const cellRe = /<c\b([^>]*)(?:\/>|>([\s\S]*?)<\/c>)/g;
    let c: RegExpExecArray | null;
    while ((c = cellRe.exec(r[2]))) {
      const attrs = c[1] ?? "";
      const inner = c[2] ?? "";
      const refM = /r="([A-Z]+)\d+"/.exec(attrs);
      if (!refM) continue;
      const idx = colIndex(refM[1]);
      const t = /t="([^"]+)"/.exec(attrs)?.[1] ?? "n";
      let v = "";
      if (t === "s") v = sst[Number(/<v>([\s\S]*?)<\/v>/.exec(inner)?.[1])] ?? "";
      else if (t === "inlineStr") {
        let text = "";
        const tRe = /<t[^>]*>([\s\S]*?)<\/t>/g;
        let tm: RegExpExecArray | null;
        while ((tm = tRe.exec(inner))) text += tm[1];
        v = text;
      } else v = /<v>([\s\S]*?)<\/v>/.exec(inner)?.[1] ?? "";
      cells[idx] = dec(v).trim();
    }
    rows[Number(r[1])] = cells;
  }
  return rows;
}

function parseDob(v: string | undefined): string | undefined {
  if (!v) return undefined;
  const num = Number(v);
  if (Number.isFinite(num) && num > 2000 && num < 100000) {
    const epoch = new Date(Date.UTC(1899, 11, 30));
    const ms = epoch.getTime() + Math.round(num) * 86400 * 1000;
    const d = new Date(ms);
    return d.toISOString().slice(0, 10);
  }
  const m = v.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (m) {
    const dd = m[1].padStart(2, "0");
    const mm = m[2].padStart(2, "0");
    const yyyy = m[3];
    return `${yyyy}-${mm}-${dd}`;
  }
  return undefined;
}

async function getOrCreateClass(db: any, name: string) {
  const existing = await db.class.findUnique({ where: { name } });
  if (existing) return existing;
  return db.class.create({ data: { name, level: "JSS1", arm: name.replace("JSS1", "") } });
}

async function main() {
  const { db } = await import("./src/lib/prisma");
  const { auth } = await import("./src/lib/auth");
  const { hashPassword } = await import("better-auth/crypto");

  const rows = parseSheet("JSS1B Roster Extraction.xlsx");
  const nums = Object.keys(rows).map(Number).sort((a, b) => a - b).filter((n) => n > 1);
  console.log(`rows: ${nums.length}`);

  const maxAdm = await db.student.findFirst({ orderBy: { admissionNo: "desc" }, select: { admissionNo: true } });
  let seq = Number(maxAdm?.admissionNo?.split("/").pop() ?? "0") + 1;

  const cls = await getOrCreateClass(db, "JSS1B");
  let created = 0;
  for (const n of nums) {
    const c = rows[n];
    const rawName = (c[0] ?? "").trim();
    const gender = (c[1] ?? "").trim();
    const email = (c[2] ?? "").trim();
    const dobRaw = (c[3] ?? "").trim();
    const guardianName = (c[4] ?? "").trim();
    const guardianPhone = (c[5] ?? "").replace(/\D/g, "");
    if (!rawName || !gender || !email) continue;

    seq++;
    const admissionNo = `SOWA/ST/26/${seq.toString().padStart(3, "0")}`;
    const wantGender = /female/i.test(gender) ? "FEMALE" : "MALE";
    const dobIso = parseDob(dobRaw);
    const dateOfBirth = dobIso ? new Date(dobIso) : null;

    try {
      const user = await auth.api.signUpEmail({
        headers: { get: () => Promise.resolve("") },
        body: { email, password: admissionNo, name: rawName },
      });
      if (!user) continue;
      await db.$transaction([
        db.user.update({ where: { id: user.user.id }, data: { role: "STUDENT", phone: guardianPhone || null } }),
        db.student.create({
          data: { userId: user.user.id, admissionNo, classId: cls.id, dateOfBirth, gender: wantGender as any, guardianName: guardianName || null, guardianPhone: guardianPhone || null },
        }),
      ]);
      const hashed = await hashPassword(admissionNo);
      await db.account.updateMany({ where: { userId: user.user.id, providerId: "credential" }, data: { password: hashed, accountId: email } });
      created++;
    } catch (e) {
      console.error("fail", email, e);
    }
  }
  console.log("created", created);
  await db.$disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
