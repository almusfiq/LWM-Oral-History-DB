import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import { DatabaseSync } from 'node:sqlite';
import type { StoryRecord, SchoolAlbumRecord, StoryQueryParams, StoryListResponse, SystemStats } from './types';
import { DISTRICT_TO_DIVISION } from './docxParser';

const DIVISION_ALIASES_MAP: Record<string, string> = {
  'barishal': 'বরিশাল',
  'barisal': 'বরিশাল',
  'বরিশাল': 'বরিশাল',
  'বরিশাল বিভাগ': 'বরিশাল',
  'chattogram': 'চট্টগ্রাম',
  'chittagong': 'চট্টগ্রাম',
  'চট্টগ্রাম': 'চট্টগ্রাম',
  'চট্টগ্রাম বিভাগ': 'চট্টগ্রাম',
  'dhaka': 'ঢাকা',
  'ঢাকা': 'ঢাকা',
  'ঢাকা বিভাগ': 'ঢাকা',
  'khulna': 'খুলনা',
  'খুলনা': 'খুলনা',
  'খুলনা বিভাগ': 'খুলনা',
  'mymensingh': 'ময়মনসিংহ',
  'ময়মনসিংহ': 'ময়মনসিংহ',
  'ময়মনসিংহ বিভাগ': 'ময়মনসিংহ',
  'rajshahi': 'রাজশাহী',
  'রাজশাহী': 'রাজশাহী',
  'রাজশাহী বিভাগ': 'রাজশাহী',
  'rangpur': 'রংপুর',
  'রংপুর': 'রংপুর',
  'রংপুর বিভাগ': 'রংপুর',
  'sylhet': 'সিলেট',
  'সিলেট': 'সিলেট',
  'সিলেট বিভাগ': 'সিলেট',
};

const DISTRICT_EN_TO_BN: Record<string, string> = {
  'bagerhat': 'বাগেরহাট',
  'bandarban': 'বান্দরবান',
  'barguna': 'বরগুনা',
  'barishal': 'বরিশাল',
  'barisal': 'বরিশাল',
  'bhola': 'ভোলা',
  'bogura': 'বগুড়া',
  'bogra': 'বগুড়া',
  'brahmanbaria': 'ব্রাহ্মণবাড়িয়া',
  'chandpur': 'চাঁদপুর',
  'chapainawabganj': 'চাঁপাইনবাবগঞ্জ',
  'chattogram': 'চট্টগ্রাম',
  'chittagong': 'চট্টগ্রাম',
  'chuadanga': 'চুয়াডাঙ্গা',
  'comilla': 'কুমিল্লা',
  'cumilla': 'কুমিল্লা',
  'coxs bazar': 'কক্সবাজার',
  "cox's bazar": 'কক্সবাজার',
  'dhaka': 'ঢাকা',
  'dinajpur': 'দিনাজপুর',
  'faridpur': 'ফরিদপুর',
  'feni': 'ফেনী',
  'gaibandha': 'গাইবান্ধা',
  'gazipur': 'গাজীপুর',
  'gopalganj': 'গোপালগঞ্জ',
  'habiganj': 'হবিগঞ্জ',
  'jamalpur': 'জামালপুর',
  'jashore': 'যশোর',
  'jessore': 'যশোর',
  'jhalokati': 'ঝালকাঠি',
  'jhenaidah': 'ঝিনাইদহ',
  'joypurhat': 'জয়পুরহাট',
  'khagrachhari': 'খাগড়াছড়ি',
  'khulna': 'খুলনা',
  'kishoreganj': 'কিশোরগঞ্জ',
  'kurigram': 'কুড়িগ্রাম',
  'kushtia': 'কুষ্টিয়া',
  'lakshmipur': 'লক্ষ্মীপুর',
  'lalmonirhat': 'লালমনিরহাট',
  'madaripur': 'মাদারীপুর',
  'magura': 'মাগুরা',
  'manikganj': 'মানিকগঞ্জ',
  'meherpur': 'মেহেরপুর',
  'moulvibazar': 'মৌলভীবাজার',
  'munshiganj': 'মুন্সিগঞ্জ',
  'mymensingh': 'ময়মনসিংহ',
  'naogaon': 'নওগাঁ',
  'narail': 'নড়াইল',
  'narayanganj': 'নারায়ণগঞ্জ',
  'narsingdi': 'নরসিংদী',
  'natore': 'নাটোর',
  'netrokona': 'নেত্রকোণা',
  'nilphamari': 'নীলফামারী',
  'noakhali': 'নোয়াখালী',
  'pabna': 'পাবনা',
  'panchagarh': 'পঞ্চগড়',
  'patuakhali': 'পটুয়াখালী',
  'pirojpur': 'পিরোজপুর',
  'rajbari': 'রাজবাড়ী',
  'rajshahi': 'রাজশাহী',
  'rangamati': 'রাঙ্গামাটি',
  'rangpur': 'রংপুর',
  'satkhira': 'সাতক্ষীরা',
  'shariatpur': 'শরীয়তপুর',
  'sherpur': 'শেরপুর',
  'sirajganj': 'সিরাজগঞ্জ',
  'sunamganj': 'সুনামগঞ্জ',
  'sylhet': 'সিলেট',
  'tangail': 'টাঙ্গাইল',
  'thakurgaon': 'ঠাকুরগাঁও',
};

const DIVISION_ID_MAP: Record<string, string> = {
  'বরিশাল': '10',
  'চট্টগ্রাম': '20',
  'ঢাকা': '30',
  'খুলনা': '40',
  'ময়মনসিংহ': '45',
  'রাজশাহী': '50',
  'রংপুর': '55',
  'সিলেট': '60',
};

// We use node:sqlite to support local zero-config mode
let sqliteDb: DatabaseSync | null = null;
let pgPool: Pool | null = null;
let isPostgres = false;

const DATA_DIR = path.resolve(process.cwd(), 'data');
const SQLITE_FILE = path.join(DATA_DIR, 'lwm_oral_history.db');

export async function initDatabase(): Promise<{ type: 'PostgreSQL' | 'SQLite (Local)'; status: string }> {
  const dbUrl = process.env.DATABASE_URL;

  if (dbUrl && dbUrl.trim().startsWith('postgres')) {
    try {
      console.log('Connecting to PostgreSQL database...');
      pgPool = new Pool({
        connectionString: dbUrl,
        ssl: dbUrl.includes('localhost') ? false : { rejectUnauthorized: false },
        max: 10,
        idleTimeoutMillis: 30000,
      });

      // Test connection
      const client = await pgPool.connect();
      try {
        await client.query('SELECT 1');
      } finally {
        client.release();
      }

      isPostgres = true;
      console.log('PostgreSQL connected successfully!');
      await setupPostgresTables();
      await checkAndSeedDatabase();
      return { type: 'PostgreSQL', status: 'connected' };
    } catch (err: any) {
      console.error('Failed to connect to PostgreSQL, falling back to local SQLite:', err.message);
      isPostgres = false;
      pgPool = null;
    }
  }

  // Fallback to local SQLite (using Node 24 native node:sqlite)
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    sqliteDb = new DatabaseSync(SQLITE_FILE);
    isPostgres = false;
    console.log(`Using local SQLite database at: ${SQLITE_FILE}`);
    setupSqliteTables();
    await checkAndSeedDatabase();
    return { type: 'SQLite (Local)', status: 'connected' };
  } catch (err: any) {
    console.error('Failed to initialize local SQLite:', err.message);
    throw err;
  }
}

async function setupPostgresTables() {
  if (!pgPool) return;
  const client = await pgPool.connect();
  try {
    await client.query(`
      CREATE EXTENSION IF NOT EXISTS pg_trgm;

      CREATE TABLE IF NOT EXISTS stories (
        id VARCHAR(120) PRIMARY KEY,
        archive_number VARCHAR(100) UNIQUE NOT NULL,
        district VARCHAR(100) NOT NULL,
        division VARCHAR(100),
        title VARCHAR(500) NOT NULL,
        collector VARCHAR(255),
        school VARCHAR(300),
        collector_class VARCHAR(150),
        collector_roll VARCHAR(100),
        respondent VARCHAR(255),
        respondent_address TEXT,
        respondent_age VARCHAR(50),
        relationship VARCHAR(150),
        content TEXT NOT NULL,
        details JSONB,
        access VARCHAR(50) DEFAULT 'public',
        source_file VARCHAR(255),
        date_added TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS school_albums (
        id SERIAL PRIMARY KEY,
        district VARCHAR(100) NOT NULL,
        school VARCHAR(300) NOT NULL,
        pictures JSONB NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(district, school)
      );

      CREATE TABLE IF NOT EXISTS upload_logs (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL,
        stories_count INT DEFAULT 0,
        status VARCHAR(50) DEFAULT 'success',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_pg_stories_dist ON stories(district);
      CREATE INDEX IF NOT EXISTS idx_pg_stories_div ON stories(division);
      CREATE INDEX IF NOT EXISTS idx_pg_stories_title ON stories USING gin (title gin_trgm_ops);
      CREATE INDEX IF NOT EXISTS idx_pg_stories_content ON stories USING gin (content gin_trgm_ops);
    `);
  } finally {
    client.release();
  }
}

function setupSqliteTables() {
  if (!sqliteDb) return;
  sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS stories (
      id TEXT PRIMARY KEY,
      archive_number TEXT UNIQUE NOT NULL,
      district TEXT NOT NULL,
      division TEXT,
      title TEXT NOT NULL,
      collector TEXT,
      school TEXT,
      collector_class TEXT,
      collector_roll TEXT,
      respondent TEXT,
      respondent_address TEXT,
      respondent_age TEXT,
      relationship TEXT,
      content TEXT NOT NULL,
      details TEXT,
      access TEXT DEFAULT 'public',
      source_file TEXT,
      date_added TEXT
    );

    CREATE TABLE IF NOT EXISTS school_albums (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      district TEXT NOT NULL,
      school TEXT NOT NULL,
      pictures TEXT NOT NULL,
      created_at TEXT,
      UNIQUE(district, school)
    );

    CREATE TABLE IF NOT EXISTS upload_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL,
      stories_count INTEGER DEFAULT 0,
      status TEXT DEFAULT 'success',
      created_at TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_sq_stories_dist ON stories(district);
    CREATE INDEX IF NOT EXISTS idx_sq_stories_div ON stories(division);
  `);
}

async function checkAndSeedDatabase() {
  const stats = await getSystemStats();
  if (stats.totalStories === 0) {
    console.log('Database is empty. Seeding initial stories from src/data/stories.ts...');
    try {
      const storiesPath = path.resolve(process.cwd(), 'src/data/stories.ts');
      if (fs.existsSync(storiesPath)) {
        const fileContent = fs.readFileSync(storiesPath, 'utf-8');
        const match = fileContent.match(/export const stories:\s*ArchiveStory\[\]\s*=\s*(\[[\s\S]*?\]);\s*$/m);
        if (match) {
          const rawStories = JSON.parse(match[1]);
          console.log(`Found ${rawStories.length} initial archive stories to seed.`);
          const parsedRecords: StoryRecord[] = rawStories.map((s: any) => ({
            id: s.id,
            archiveNumber: s.archiveNumber,
            district: s.district,
            division: DISTRICT_TO_DIVISION[s.district] || 'বাংলাদেশ',
            title: s.title,
            collector: s.collector || '',
            school: s.school || '',
            collectorClass: s.collectorClass || '',
            collectorRoll: '',
            respondent: s.respondent || '',
            respondentAddress: s.respondentAddress || '',
            respondentAge: s.respondentAge || '',
            relationship: s.relationship || '',
            content: s.content || '',
            details: s.details || [],
            access: 'public',
            sourceFile: 'seeds/stories.ts',
            dateAdded: new Date().toISOString(),
          }));

          await upsertStoriesBulk(parsedRecords);
          console.log(`Seeded ${parsedRecords.length} stories into the database.`);
        }
      }
    } catch (e: any) {
      console.warn('Could not auto-seed stories:', e.message);
    }
  }

  // Seed school pictures if empty
  if (stats.totalPhotos === 0) {
    try {
      const photosPath = path.resolve(process.cwd(), 'src/data/schoolPictures.ts');
      if (fs.existsSync(photosPath)) {
        const fileContent = fs.readFileSync(photosPath, 'utf-8');
        const match = fileContent.match(/export const schoolAlbums:\s*SchoolAlbum\[\]\s*=\s*(\[[\s\S]*?\]);\s*$/m);
        if (match) {
          const rawAlbums = JSON.parse(match[1]);
          for (const alb of rawAlbums) {
            await upsertSchoolAlbum(alb.district, alb.school, alb.pictures);
          }
          console.log(`Seeded ${rawAlbums.length} school photo albums into database.`);
        }
      }
    } catch (e: any) {
      console.warn('Could not auto-seed school pictures:', e.message);
    }
  }
}

export async function upsertStory(s: StoryRecord): Promise<void> {
  const division = s.division || DISTRICT_TO_DIVISION[s.district] || 'বাংলাদেশ';

  if (isPostgres && pgPool) {
    const query = `
      INSERT INTO stories (
        id, archive_number, district, division, title, collector, school,
        collector_class, collector_roll, respondent, respondent_address,
        respondent_age, relationship, content, details, access, source_file, date_added
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18
      )
      ON CONFLICT (archive_number) DO UPDATE SET
        title = EXCLUDED.title,
        content = EXCLUDED.content,
        district = EXCLUDED.district,
        division = EXCLUDED.division,
        collector = EXCLUDED.collector,
        school = EXCLUDED.school,
        respondent = EXCLUDED.respondent,
        respondent_address = EXCLUDED.respondent_address,
        respondent_age = EXCLUDED.respondent_age,
        relationship = EXCLUDED.relationship,
        details = EXCLUDED.details,
        access = EXCLUDED.access;
    `;
    await pgPool.query(query, [
      s.id,
      s.archiveNumber,
      s.district,
      division,
      s.title,
      s.collector,
      s.school,
      s.collectorClass || '',
      s.collectorRoll || '',
      s.respondent,
      s.respondentAddress || '',
      s.respondentAge || '',
      s.relationship || '',
      s.content,
      JSON.stringify(s.details || []),
      s.access || 'public',
      s.sourceFile || '',
      s.dateAdded || new Date().toISOString(),
    ]);
  } else if (sqliteDb) {
    const stmt = sqliteDb.prepare(`
      INSERT INTO stories (
        id, archive_number, district, division, title, collector, school,
        collector_class, collector_roll, respondent, respondent_address,
        respondent_age, relationship, content, details, access, source_file, date_added
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(archive_number) DO UPDATE SET
        title = excluded.title,
        content = excluded.content,
        district = excluded.district,
        division = excluded.division,
        collector = excluded.collector,
        school = excluded.school,
        respondent = excluded.respondent,
        respondent_address = excluded.respondent_address,
        respondent_age = excluded.respondent_age,
        relationship = excluded.relationship,
        details = excluded.details,
        access = excluded.access;
    `);
    stmt.run(
      s.id,
      s.archiveNumber,
      s.district,
      division,
      s.title,
      s.collector,
      s.school,
      s.collectorClass || '',
      s.collectorRoll || '',
      s.respondent,
      s.respondentAddress || '',
      s.respondentAge || '',
      s.relationship || '',
      s.content,
      JSON.stringify(s.details || []),
      s.access || 'public',
      s.sourceFile || '',
      s.dateAdded || new Date().toISOString()
    );
  }
}

export async function upsertStoriesBulk(stories: StoryRecord[]): Promise<{ inserted: number; updated: number; failed: number }> {
  let inserted = 0;
  let failed = 0;

  if (sqliteDb && !isPostgres) {
    sqliteDb.exec('BEGIN TRANSACTION');
    try {
      for (const s of stories) {
        try {
          await upsertStory(s);
          inserted++;
        } catch (err: any) {
          failed++;
        }
      }
      sqliteDb.exec('COMMIT');
    } catch (e) {
      sqliteDb.exec('ROLLBACK');
      throw e;
    }
    return { inserted, updated: 0, failed };
  }

  for (const s of stories) {
    try {
      await upsertStory(s);
      inserted++;
    } catch (err: any) {
      console.error(`Error inserting story ${s.archiveNumber}:`, err.message);
      failed++;
    }
  }

  return { inserted, updated: 0, failed };
}

export async function getStories(params: StoryQueryParams): Promise<StoryListResponse> {
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(10000, Math.max(1, params.limit || 24));
  const offset = (page - 1) * limit;

  const conditions: string[] = [];
  const args: any[] = [];

  if (params.district && params.district !== 'all') {
    const rawDist = params.district.trim();
    const cleanDist = rawDist.replace(/(?:জেলা|district|সদর)/gi, '').trim().toLowerCase();
    const bnDistName = DISTRICT_EN_TO_BN[cleanDist] || DISTRICT_EN_TO_BN[rawDist.toLowerCase()] || rawDist;
    if (isPostgres) {
      conditions.push(`(district ILIKE $${args.length + 1} OR district ILIKE $${args.length + 2})`);
      args.push(`%${bnDistName}%`, `%${rawDist}%`);
    } else {
      conditions.push(`(district LIKE ? OR district LIKE ?)`);
      args.push(`%${bnDistName}%`, `%${rawDist}%`);
    }
  }

  if (params.division && params.division !== 'all') {
    const rawDiv = params.division.trim();
    const cleanDiv = rawDiv.replace(/(?:বিভাগ|division)/gi, '').trim().toLowerCase();
    const bnDivName = DIVISION_ALIASES_MAP[cleanDiv] || DIVISION_ALIASES_MAP[rawDiv.toLowerCase()] || rawDiv;
    if (isPostgres) {
      conditions.push(`(division ILIKE $${args.length + 1} OR division ILIKE $${args.length + 2})`);
      args.push(`%${bnDivName}%`, `%${rawDiv}%`);
    } else {
      conditions.push(`(division LIKE ? OR division LIKE ?)`);
      args.push(`%${bnDivName}%`, `%${rawDiv}%`);
    }
  }

  if (params.school) {
    args.push(`%${params.school}%`);
    conditions.push(isPostgres ? `school ILIKE $${args.length}` : `school LIKE ?`);
  }

  if (params.access && params.access !== 'all') {
    args.push(params.access);
    conditions.push(isPostgres ? `access = $${args.length}` : `access = ?`);
  }

  if (params.search && params.search.trim()) {
    const s = `%${params.search.trim()}%`;
    args.push(s);
    const searchIdx = args.length;
    if (isPostgres) {
      conditions.push(`(
        title ILIKE $${searchIdx} OR
        content ILIKE $${searchIdx} OR
        collector ILIKE $${searchIdx} OR
        respondent ILIKE $${searchIdx} OR
        archive_number ILIKE $${searchIdx} OR
        school ILIKE $${searchIdx}
      )`);
    } else {
      conditions.push(`(
        title LIKE ? OR
        content LIKE ? OR
        collector LIKE ? OR
        respondent LIKE ? OR
        archive_number LIKE ? OR
        school LIKE ?
      )`);
      // SQLite requires arg repeated for each placeholder
      for (let i = 0; i < 5; i++) {
        args.push(s);
      }
    }
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  let total = 0;
  let rows: any[] = [];

  if (isPostgres && pgPool) {
    const countRes = await pgPool.query(`SELECT COUNT(*) as total FROM stories ${whereClause}`, args);
    total = parseInt(countRes.rows[0].total, 10);

    const queryArgs = [...args, limit, offset];
    const dataRes = await pgPool.query(
      `SELECT * FROM stories ${whereClause} ORDER BY date_added DESC LIMIT $${queryArgs.length - 1} OFFSET $${queryArgs.length}`,
      queryArgs
    );
    rows = dataRes.rows;
  } else if (sqliteDb) {
    const countStmt = sqliteDb.prepare(`SELECT COUNT(*) as total FROM stories ${whereClause}`);
    const countRow = countStmt.get(...args) as { total: number };
    total = countRow ? countRow.total : 0;

    const dataStmt = sqliteDb.prepare(`SELECT * FROM stories ${whereClause} ORDER BY date_added DESC LIMIT ? OFFSET ?`);
    rows = dataStmt.all(...args, limit, offset) as any[];
  }

  const mappedStories: StoryRecord[] = rows.map((r) => ({
    id: r.id,
    archiveNumber: r.archive_number,
    district: r.district,
    division: r.division,
    title: r.title,
    collector: r.collector,
    school: r.school,
    collectorClass: r.collector_class,
    collectorRoll: r.collector_roll,
    respondent: r.respondent,
    respondentAddress: r.respondent_address,
    respondentAge: r.respondent_age,
    relationship: r.relationship,
    content: r.content,
    details: typeof r.details === 'string' ? JSON.parse(r.details || '[]') : r.details || [],
    access: r.access as 'public' | 'restricted',
    sourceFile: r.source_file,
    dateAdded: r.date_added,
  }));

  return {
    stories: mappedStories,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

export async function getStoryById(id: string): Promise<StoryRecord | null> {
  let row: any = null;
  if (isPostgres && pgPool) {
    const res = await pgPool.query('SELECT * FROM stories WHERE id = $1 OR archive_number = $1 LIMIT 1', [id]);
    row = res.rows[0];
  } else if (sqliteDb) {
    const stmt = sqliteDb.prepare('SELECT * FROM stories WHERE id = ? OR archive_number = ? LIMIT 1');
    row = stmt.get(id, id);
  }

  if (!row) return null;
  return {
    id: row.id,
    archiveNumber: row.archive_number,
    district: row.district,
    division: row.division,
    title: row.title,
    collector: row.collector,
    school: row.school,
    collectorClass: row.collector_class,
    collectorRoll: row.collector_roll,
    respondent: row.respondent,
    respondentAddress: row.respondent_address,
    respondentAge: row.respondent_age,
    relationship: row.relationship,
    content: row.content,
    details: typeof row.details === 'string' ? JSON.parse(row.details || '[]') : row.details || [],
    access: row.access as 'public' | 'restricted',
    sourceFile: row.source_file,
    dateAdded: row.date_added,
  };
}

export async function deleteStory(id: string): Promise<boolean> {
  if (isPostgres && pgPool) {
    const res = await pgPool.query('DELETE FROM stories WHERE id = $1 OR archive_number = $1', [id]);
    return (res.rowCount ?? 0) > 0;
  } else if (sqliteDb) {
    const stmt = sqliteDb.prepare('DELETE FROM stories WHERE id = ? OR archive_number = ?');
    const res = stmt.run(id, id);
    return res.changes > 0;
  }
  return false;
}

export async function upsertSchoolAlbum(district: string, school: string, pictures: string[]): Promise<void> {
  if (isPostgres && pgPool) {
    await pgPool.query(
      `
      INSERT INTO school_albums (district, school, pictures)
      VALUES ($1, $2, $3)
      ON CONFLICT (district, school) DO UPDATE SET
        pictures = EXCLUDED.pictures;
    `,
      [district, school, JSON.stringify(pictures)]
    );
  } else if (sqliteDb) {
    const stmt = sqliteDb.prepare(`
      INSERT INTO school_albums (district, school, pictures, created_at)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(district, school) DO UPDATE SET
        pictures = excluded.pictures;
    `);
    stmt.run(district, school, JSON.stringify(pictures), new Date().toISOString());
  }
}

export async function getSchoolAlbums(): Promise<SchoolAlbumRecord[]> {
  let rows: any[] = [];
  if (isPostgres && pgPool) {
    const res = await pgPool.query('SELECT district, school, pictures FROM school_albums ORDER BY district, school');
    rows = res.rows;
  } else if (sqliteDb) {
    const stmt = sqliteDb.prepare('SELECT district, school, pictures FROM school_albums ORDER BY district, school');
    rows = stmt.all() as any[];
  }

  return rows.map((r) => ({
    district: r.district,
    school: r.school,
    pictures: typeof r.pictures === 'string' ? JSON.parse(r.pictures || '[]') : r.pictures || [],
  }));
}

export async function getSchoolPictures(district: string, school: string): Promise<string[]> {
  let row: any = null;
  if (isPostgres && pgPool) {
    const res = await pgPool.query('SELECT pictures FROM school_albums WHERE district = $1 AND school = $2 LIMIT 1', [
      district,
      school,
    ]);
    row = res.rows[0];
  } else if (sqliteDb) {
    const stmt = sqliteDb.prepare('SELECT pictures FROM school_albums WHERE district = ? AND school = ? LIMIT 1');
    row = stmt.get(district, school);
  }

  if (!row) return [];
  return typeof row.pictures === 'string' ? JSON.parse(row.pictures || '[]') : row.pictures || [];
}

export async function getSystemStats(): Promise<SystemStats> {
  let totalStories = 0;
  let totalDistricts = 0;
  let totalDivisions = 0;
  let totalSchools = 0;
  let totalPhotos = 0;
  const divisionCounts: Record<string, number> = {};

  if (isPostgres && pgPool) {
    const sRes = await pgPool.query('SELECT COUNT(*) as c FROM stories');
    totalStories = parseInt(sRes.rows[0]?.c || '0', 10);

    const dRes = await pgPool.query('SELECT COUNT(DISTINCT district) as c FROM stories');
    totalDistricts = parseInt(dRes.rows[0]?.c || '0', 10);

    const divRes = await pgPool.query('SELECT division, COUNT(*) as c FROM stories GROUP BY division');
    totalDivisions = divRes.rows.length;
    for (const r of divRes.rows) {
      if (r.division) {
        const c = parseInt(r.c, 10);
        divisionCounts[r.division] = c;
        const shortName = r.division.replace(/(?:বিভাগ|division)/gi, '').trim();
        divisionCounts[shortName] = c;
        if (DIVISION_ID_MAP[shortName]) divisionCounts[DIVISION_ID_MAP[shortName]] = c;
      }
    }

    const scRes = await pgPool.query('SELECT COUNT(DISTINCT school) as c FROM stories WHERE school != \'\'');
    totalSchools = parseInt(scRes.rows[0]?.c || '0', 10);

    const albRes = await pgPool.query('SELECT pictures FROM school_albums');
    for (const r of albRes.rows) {
      const pics = typeof r.pictures === 'string' ? JSON.parse(r.pictures) : r.pictures;
      if (Array.isArray(pics)) totalPhotos += pics.length;
    }
  } else if (sqliteDb) {
    const sRow = sqliteDb.prepare('SELECT COUNT(*) as c FROM stories').get() as any;
    totalStories = sRow?.c || 0;

    const dRow = sqliteDb.prepare('SELECT COUNT(DISTINCT district) as c FROM stories').get() as any;
    totalDistricts = dRow?.c || 0;

    const divRows = sqliteDb.prepare('SELECT division, COUNT(*) as c FROM stories GROUP BY division').all() as any[];
    totalDivisions = divRows.length;
    for (const r of divRows) {
      if (r.division) {
        const c = r.c;
        divisionCounts[r.division] = c;
        const shortName = r.division.replace(/(?:বিভাগ|division)/gi, '').trim();
        divisionCounts[shortName] = c;
        if (DIVISION_ID_MAP[shortName]) divisionCounts[DIVISION_ID_MAP[shortName]] = c;
      }
    }

    const scRow = sqliteDb.prepare("SELECT COUNT(DISTINCT school) as c FROM stories WHERE school != ''").get() as any;
    totalSchools = scRow?.c || 0;

    const albRows = sqliteDb.prepare('SELECT pictures FROM school_albums').all() as any[];
    for (const r of albRows) {
      const pics = typeof r.pictures === 'string' ? JSON.parse(r.pictures) : r.pictures;
      if (Array.isArray(pics)) totalPhotos += pics.length;
    }
  }

  return {
    totalStories,
    totalDistricts,
    totalDivisions,
    totalSchools,
    totalPhotos,
    divisionCounts,
    databaseType: isPostgres ? 'PostgreSQL' : 'SQLite (Local)',
    databaseStatus: 'connected',
  };
}
