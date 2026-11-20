import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { parseDocxBuffer } from '../server/docxParser';
import { initDatabase, upsertStoriesBulk, getSystemStats, upsertSchoolAlbum } from '../server/db';
import type { StoryRecord } from '../server/types';

async function main() {
  const targetDir = process.argv[2] || path.resolve(process.cwd(), '../LWM Project/Oral History/Oral History Stories - Categorized by Location');

  console.log('='.repeat(65));
  console.log('🚀 LWM Oral History - Bulk DOCX Ingestion Pipeline');
  console.log('='.repeat(65));
  console.log(`Scanning target directory: ${targetDir}\n`);

  if (!fs.existsSync(targetDir)) {
    console.error(`Error: Directory not found: ${targetDir}`);
    console.log('Usage: npx tsx scripts/ingest-local-folder.ts <path-to-docx-folder>');
    process.exit(1);
  }

  // 1. Initialize Database
  console.log('Initializing database connection...');
  await initDatabase();

  // 2. Discover all .docx files recursively
  const allDocxFiles: { fullPath: string; division: string; district: string; filename: string }[] = [];

  function scanFolder(dir: string, curDiv = '', curDist = '') {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const ent of entries) {
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        let div = curDiv;
        let dist = curDist;
        if (ent.name.includes('বিভাগ')) div = ent.name;
        if (ent.name.includes('জেলা')) dist = ent.name.replace('জেলা', '').trim();
        scanFolder(full, div, dist);
      } else if (ent.isFile() && ent.name.toLowerCase().endsWith('.docx') && !ent.name.startsWith('~')) {
        allDocxFiles.push({
          fullPath: full,
          division: curDiv,
          district: curDist,
          filename: ent.name,
        });
      }
    }
  }

  scanFolder(targetDir);
  console.log(`Found ${allDocxFiles.length} DOCX files to process.\n`);

  if (allDocxFiles.length === 0) {
    console.log('No .docx files found in directory.');
    process.exit(0);
  }

  // 3. Process files in batches
  let totalStoriesExtracted = 0;
  let totalStoriesSaved = 0;
  let singleStoryFiles = 0;
  let multiStoryFiles = 0;
  const BATCH_SIZE = 50;

  let currentBatch: StoryRecord[] = [];

  for (let i = 0; i < allDocxFiles.length; i++) {
    const file = allDocxFiles[i];
    try {
      const buffer = fs.readFileSync(file.fullPath);
      const res = parseDocxBuffer(buffer, file.filename, file.district, file.division);

      if (res.isMultiStory) {
        multiStoryFiles++;
      } else {
        singleStoryFiles++;
      }

      totalStoriesExtracted += res.stories.length;
      currentBatch.push(...res.stories);

      // Save batch
      if (currentBatch.length >= BATCH_SIZE || i === allDocxFiles.length - 1) {
        const dbRes = await upsertStoriesBulk(currentBatch);
        totalStoriesSaved += dbRes.inserted;
        process.stdout.write(`Processed ${i + 1}/${allDocxFiles.length} files | Extracted: ${totalStoriesExtracted} | Saved: ${totalStoriesSaved}\r`);
        currentBatch = [];
      }
    } catch (err: any) {
      console.error(`\n[!] Error processing ${file.filename}:`, err.message);
    }
  }

  console.log('\n\n' + '='.repeat(65));
  console.log('🎉 INGESTION COMPLETE SUMMARY:');
  console.log('='.repeat(65));
  console.log(`Total DOCX files scanned:   ${allDocxFiles.length}`);
  console.log(`Single-story files:         ${singleStoryFiles}`);
  console.log(`Multi-story files:          ${multiStoryFiles}`);
  console.log(`Total stories extracted:    ${totalStoriesExtracted}`);
  console.log(`Total stories saved in DB:  ${totalStoriesSaved}`);

  const finalStats = await getSystemStats();
  console.log(`\nFinal System Database Stats:`);
  console.log(`- Database Engine:          ${finalStats.databaseType}`);
  console.log(`- Total Stories in Archive: ${finalStats.totalStories}`);
  console.log(`- Total Districts:          ${finalStats.totalDistricts}`);
  console.log(`- Total Schools:            ${finalStats.totalSchools}`);
  console.log('='.repeat(65) + '\n');
}

main().catch(console.error);
