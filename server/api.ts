import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import AdmZip from 'adm-zip';
import {
  getStories,
  getStoryById,
  upsertStory,
  upsertStoriesBulk,
  deleteStory,
  getSystemStats,
  getSchoolAlbums,
  getSchoolPictures,
  upsertSchoolAlbum,
} from './db';
import { parseDocxBuffer, DISTRICT_TO_DIVISION } from './docxParser';
import type { StoryRecord } from './types';

const router = express.Router();

const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB per file
  },
});

// 1. Health and Stats
router.get('/health', async (_req: Request, res: Response) => {
  try {
    const stats = await getSystemStats();
    res.json({
      status: 'ok',
      time: new Date().toISOString(),
      database: stats.databaseType,
      totalStories: stats.totalStories,
    });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const stats = await getSystemStats();
    res.json(stats);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Story queries
router.get('/stories', async (req: Request, res: Response) => {
  try {
    const page = parseInt((req.query.page as string) || '1', 10);
    const limit = parseInt((req.query.limit as string) || '24', 10);
    const search = (req.query.search as string) || '';
    const district = (req.query.district as string) || '';
    const division = (req.query.division as string) || '';
    const school = (req.query.school as string) || '';
    const access = (req.query.access as any) || 'all';

    const result = await getStories({ page, limit, search, district, division, school, access });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/stories/:id', async (req: Request, res: Response) => {
  try {
    const story = await getStoryById(req.params.id);
    if (!story) {
      return res.status(404).json({ error: 'Story not found' });
    }
    res.json(story);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/stories', async (req: Request, res: Response) => {
  try {
    const data = req.body;
    if (!data.title || !data.content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const now = new Date();
    const district = data.district?.trim() || 'বাগেরহাট';
    const division = data.division?.trim() || DISTRICT_TO_DIVISION[district] || 'বাংলাদেশ';
    const archiveNumber = data.archiveNumber?.trim() || `${now.getFullYear()}-${String(now.getTime()).slice(-5)}`;
    const id = data.id || `LWM-OH-${district.toUpperCase()}-${archiveNumber}`;

    const story: StoryRecord = {
      id,
      archiveNumber,
      district,
      division,
      title: data.title.trim(),
      collector: data.collector?.trim() || 'তথ্য নেই',
      school: data.school?.trim() || 'তথ্য নেই',
      collectorClass: data.collectorClass?.trim() || '',
      collectorRoll: data.collectorRoll?.trim() || '',
      respondent: data.respondent?.trim() || 'তথ্য নেই',
      respondentAddress: data.respondentAddress?.trim() || '',
      respondentAge: data.respondentAge?.trim() || '',
      relationship: data.relationship?.trim() || '',
      content: data.content.trim(),
      details: Array.isArray(data.details) ? data.details : [],
      access: data.access === 'restricted' ? 'restricted' : 'public',
      sourceFile: data.sourceFile || 'manual-upload',
      dateAdded: now.toISOString(),
    };

    await upsertStory(story);
    res.status(201).json({ success: true, story });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/stories/:id', async (req: Request, res: Response) => {
  try {
    const deleted = await deleteStory(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Story not found or could not be deleted' });
    }
    res.json({ success: true, message: 'Story deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. DOCX Uploads (Single or Multiple DOCX files)
router.post('/upload/docx', upload.array('files', 100), async (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No DOCX files uploaded' });
    }

    const fallbackDistrict = (req.body.district as string) || '';
    const fallbackDivision = (req.body.division as string) || '';

    let totalExtracted = 0;
    const allExtractedStories: StoryRecord[] = [];
    const processedFilesInfo: any[] = [];

    for (const file of files) {
      // Fix multer latin1 utf8 filename encoding if necessary
      const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
      const parseResult = parseDocxBuffer(file.buffer, originalName, fallbackDistrict, fallbackDivision);

      if (parseResult.stories.length > 0) {
        totalExtracted += parseResult.stories.length;
        allExtractedStories.push(...parseResult.stories);
      }

      processedFilesInfo.push({
        filename: originalName,
        isMultiStory: parseResult.isMultiStory,
        storiesFound: parseResult.stories.length,
        errors: parseResult.errors,
      });
    }

    // Save in bulk to Database
    const dbResult = await upsertStoriesBulk(allExtractedStories);

    res.json({
      success: true,
      filesProcessed: files.length,
      storiesExtracted: totalExtracted,
      databaseInserted: dbResult.inserted,
      files: processedFilesInfo,
      sampleStories: allExtractedStories.slice(0, 3).map((s) => ({
        id: s.id,
        archiveNumber: s.archiveNumber,
        title: s.title,
        district: s.district,
        collector: s.collector,
        respondent: s.respondent,
      })),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Bulk ZIP Upload (for thousands of stories and school pictures in folders)
router.post('/upload/zip', upload.single('zipfile'), async (req: Request, res: Response) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'No zip file provided' });
    }

    const zip = new AdmZip(file.buffer);
    const zipEntries = zip.getEntries();

    let docxCount = 0;
    let photoCount = 0;
    const extractedStories: StoryRecord[] = [];
    const photoAlbumsMap: Record<string, { district: string; school: string; pictures: string[] }> = {};

    for (const entry of zipEntries) {
      if (entry.isDirectory) continue;
      const entryName = entry.entryName;

      // Check if it is a DOCX file
      if (entryName.toLowerCase().endsWith('.docx') && !entry.name.startsWith('~')) {
        docxCount++;
        // Try inferring division and district from zip path: e.g. "খুলনা বিভাগ/বাগেরহাট জেলা/427...docx"
        const pathParts = entryName.split(/[/\\]/);
        let zipDistrict = '';
        let zipDivision = '';
        for (const part of pathParts) {
          if (part.includes('বিভাগ')) zipDivision = part.trim();
          if (part.includes('জেলা')) zipDistrict = part.replace('জেলা', '').trim();
        }

        const buffer = entry.getData();
        const res = parseDocxBuffer(buffer, entry.name, zipDistrict, zipDivision);
        if (res.stories.length > 0) {
          extractedStories.push(...res.stories);
        }
      }

      // Check if it is an image (School photo)
      if (/\.(jpg|jpeg|png|webp)$/i.test(entryName)) {
        photoCount++;
        const pathParts = entryName.split(/[/\\]/);
        // Expecting: "school-pictures/<District>/<School>/photo.jpg" or "<District>/<School>/photo.jpg"
        if (pathParts.length >= 3) {
          const school = pathParts[pathParts.length - 2].trim();
          const district = pathParts[pathParts.length - 3].replace('school-pictures', '').replace('জেলা', '').trim();

          if (district && school) {
            // Write to public/school-pictures/
            const targetDir = path.resolve(process.cwd(), 'public', 'school-pictures', district, school);
            if (!fs.existsSync(targetDir)) {
              fs.mkdirSync(targetDir, { recursive: true });
            }
            const targetFile = path.join(targetDir, entry.name);
            fs.writeFileSync(targetFile, entry.getData());

            const publicUrl = `/school-pictures/${district}/${school}/${entry.name}`;
            const key = `${district}__${school}`;
            if (!photoAlbumsMap[key]) {
              photoAlbumsMap[key] = { district, school, pictures: [] };
            }
            photoAlbumsMap[key].pictures.push(publicUrl);
          }
        }
      }
    }

    // Save extracted stories to Database
    const dbResult = await upsertStoriesBulk(extractedStories);

    // Save photo albums
    for (const alb of Object.values(photoAlbumsMap)) {
      const existingPics = await getSchoolPictures(alb.district, alb.school);
      const combined = Array.from(new Set([...existingPics, ...alb.pictures]));
      await upsertSchoolAlbum(alb.district, alb.school, combined);
    }

    res.json({
      success: true,
      zipName: Buffer.from(file.originalname, 'latin1').toString('utf8'),
      docxFilesFound: docxCount,
      storiesExtracted: extractedStories.length,
      databaseInserted: dbResult.inserted,
      photosSaved: photoCount,
      schoolAlbumsUpdated: Object.keys(photoAlbumsMap).length,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 5. School Photos Management
router.get('/photos', async (_req: Request, res: Response) => {
  try {
    const albums = await getSchoolAlbums();
    res.json(albums);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/photos/:district/:school', async (req: Request, res: Response) => {
  try {
    const { district, school } = req.params;
    const pictures = await getSchoolPictures(district, school);
    res.json({ district, school, pictures });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/photos/upload', upload.array('photos', 50), async (req: Request, res: Response) => {
  try {
    const { district, school } = req.body;
    if (!district || !school) {
      return res.status(400).json({ error: 'District and School are required' });
    }

    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No photos provided' });
    }

    const targetDir = path.resolve(process.cwd(), 'public', 'school-pictures', district.trim(), school.trim());
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const savedUrls: string[] = [];
    for (const f of files) {
      const safeName = `${Date.now()}_${Buffer.from(f.originalname, 'latin1').toString('utf8').replace(/\s+/g, '_')}`;
      const filePath = path.join(targetDir, safeName);
      fs.writeFileSync(filePath, f.buffer);
      savedUrls.push(`/school-pictures/${district.trim()}/${school.trim()}/${safeName}`);
    }

    const existingPics = await getSchoolPictures(district.trim(), school.trim());
    const combined = [...existingPics, ...savedUrls];
    await upsertSchoolAlbum(district.trim(), school.trim(), combined);

    res.json({
      success: true,
      district,
      school,
      photosAdded: savedUrls.length,
      totalPhotos: combined.length,
      pictures: combined,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
