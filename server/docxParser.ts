import AdmZip from 'adm-zip';
import path from 'path';
import type { StoryRecord } from './types';

export interface ParsedDocxResult {
  filename: string;
  isMultiStory: boolean;
  stories: StoryRecord[];
  errors: string[];
}

// Map English or phonetic division names to Standard Bengali
export const DIVISION_MAP: Record<string, string> = {
  barisal: 'বরিশাল বিভাগ',
  বরিশাল: 'বরিশাল বিভাগ',
  chattogram: 'চট্টগ্রাম বিভাগ',
  chittagong: 'চট্টগ্রাম বিভাগ',
  চট্টগ্রাম: 'চট্টগ্রাম বিভাগ',
  dhaka: 'ঢাকা বিভাগ',
  ঢাকা: 'ঢাকা বিভাগ',
  khulna: 'খুলনা বিভাগ',
  খুলনা: 'খুলনা বিভাগ',
  mymensingh: 'ময়মনসিংহ বিভাগ',
  ময়মনসিংহ: 'ময়মনসিংহ বিভাগ',
  rangpur: 'রংপুর বিভাগ',
  রংপুর: 'রংপুর বিভাগ',
  rajshahi: 'রাজশাহী বিভাগ',
  রাজশাহী: 'রাজশাহী বিভাগ',
  sylhet: 'সিলেট বিভাগ',
  সিলেট: 'সিলেট বিভাগ',
};

// Map District to Division
export const DISTRICT_TO_DIVISION: Record<string, string> = {
  'বাগেরহাট': 'খুলনা বিভাগ',
  'সাতক্ষীরা': 'খুলনা বিভাগ',
  'খুলনা': 'খুলনা বিভাগ',
  'যশোর': 'খুলনা বিভাগ',
  'বরিশাল': 'বরিশাল বিভাগ',
  'পটুয়াখালী': 'বরিশাল বিভাগ',
  'ভোলা': 'বরিশাল বিভাগ',
  'পিরোজপুর': 'বরিশাল বিভাগ',
  'বরগুনা': 'বরিশাল বিভাগ',
  'ঝালকাঠি': 'বরিশাল বিভাগ',
  'কুমিল্লা': 'চট্টগ্রাম বিভাগ',
  'নোয়াখালী': 'চট্টগ্রাম বিভাগ',
  'ব্রাহ্মণবাড়িয়া': 'চট্টগ্রাম বিভাগ',
  'চট্টগ্রাম': 'চট্টগ্রাম বিভাগ',
  'কক্সবাজার': 'চট্টগ্রাম বিভাগ',
  'ফরিদপুর': 'ঢাকা বিভাগ',
  'রাজবাড়ি': 'ঢাকা বিভাগ',
  'ঢাকা': 'ঢাকা বিভাগ',
  'মুন্সিগঞ্জ': 'ঢাকা বিভাগ',
  'গোপালগঞ্জ': 'ঢাকা বিভাগ',
  'মাদারীপুর': 'ঢাকা বিভাগ',
  'ময়মনসিংহ': 'ময়মনসিংহ বিভাগ',
  'জামালপুর': 'ময়মনসিংহ বিভাগ',
  'নেত্রকোণা': 'ময়মনসিংহ বিভাগ',
  'শেরপুর': 'ময়মনসিংহ বিভাগ',
  'কুড়িগ্রাম': 'রংপুর বিভাগ',
  'নীলফামারী': 'রংপুর বিভাগ',
  'পঞ্চগড়': 'রংপুর বিভাগ',
  'রংপুর': 'রংপুর বিভাগ',
  'দিনাজপুর': 'রংপুর বিভাগ',
  'জয়পুরহাট': 'রাজশাহী বিভাগ',
  'নওগাঁ': 'রাজশাহী বিভাগ',
  'রাজশাহী': 'রাজশাহী বিভাগ',
  'বগুড়া': 'রাজশাহী বিভাগ',
  'সিলেট': 'সিলেট বিভাগ',
  'সুনামগঞ্জ': 'সিলেট বিভাগ',
  'মৌলভীবাজার': 'সিলেট বিভাগ',
  'হবিগঞ্জ': 'সিলেট বিভাগ',
};

export function extractParagraphsFromZip(zip: AdmZip): string[] {
  const xml = zip.readAsText('word/document.xml');
  if (!xml) return [];

  const paras: string[] = [];
  const pRegex = /<w:p\b[^>]*>([\s\S]*?)<\/w:p>/g;
  let match;
  while ((match = pRegex.exec(xml)) !== null) {
    const pContent = match[1];
    let text = '';
    const tRegex = /<w:t\b[^>]*>([^<]*)<\/w:t>/g;
    let tMatch;
    while ((tMatch = tRegex.exec(pContent)) !== null) {
      text += tMatch[1];
    }
    text = text.trim();
    if (text) paras.push(text);
  }
  return paras;
}

export function parseDocxBuffer(buffer: Buffer, originalFilename: string, fallbackDistrict = '', fallbackDivision = ''): ParsedDocxResult {
  const errors: string[] = [];
  let zip: AdmZip;
  try {
    zip = new AdmZip(buffer);
  } catch (err: any) {
    return {
      filename: originalFilename,
      isMultiStory: false,
      stories: [],
      errors: [`Failed to open docx file: ${err.message}`],
    };
  }

  const paras = extractParagraphsFromZip(zip);
  if (paras.length === 0) {
    return {
      filename: originalFilename,
      isMultiStory: false,
      stories: [],
      errors: ['No readable text found in document.xml'],
    };
  }

  // Infer district & division from filename or fallback
  let inferredDistrict = fallbackDistrict;
  let inferredDivision = fallbackDivision;

  const fnLower = originalFilename.toLowerCase();
  for (const [dist, div] of Object.entries(DISTRICT_TO_DIVISION)) {
    if (originalFilename.includes(dist) || fnLower.includes(dist.toLowerCase())) {
      inferredDistrict = dist;
      inferredDivision = div;
      break;
    }
  }

  // Check how many 'সূত্র' lines are in the document
  const sutroIndices: number[] = [];
  for (let i = 0; i < paras.length; i++) {
    if (/सूत्र|সত্রূ|সুত্ৰ/.test(paras[i])) {
      sutroIndices.push(i);
    }
  }

  const isMultiStory = sutroIndices.length > 1;
  const stories: StoryRecord[] = [];

  if (isMultiStory) {
    // Multi-story document (like Barisal-unicode.docx)
    function findMetaEnd(sutroIdx: number, nextSutroIdx: number): number {
      let idx = sutroIdx + 1;
      const maxIdx = Math.min(sutroIdx + 9, nextSutroIdx);
      while (idx < maxIdx) {
        const l = paras[idx];
        if (/সংগ্রহকারী|বর্ণনাকারী|বিদ্যালয়|স্কুল|কলেজ|ইনস্টিটিউট|ইনস্টিটিউশন|শ্রেণি|রোল|শাখা|বয়স|সম্পর্ক|গ্রাম|পোস্ট|থানা|উপজেলা|জেলা|স্বামী|পিতা|মাতা/i.test(l)) {
          idx++;
        } else if (idx <= sutroIdx + 4 && l.length < 80) {
          idx++;
        } else {
          break;
        }
      }
      return idx;
    }

    let lastMetaEnd = 0;
    for (let k = 0; k < sutroIndices.length; k++) {
      const sutroIdx = sutroIndices[k];
      const nextSutroIdx = k + 1 < sutroIndices.length ? sutroIndices[k + 1] : paras.length;
      const metaEnd = findMetaEnd(sutroIdx, nextSutroIdx);

      // Raw paragraphs for this story
      const storyParas = paras.slice(lastMetaEnd, sutroIdx).filter((p) => {
        const compact = p.replace(/\s+/g, '');
        return !compact.includes('জেলা') && !compact.includes('বিভাগ');
      });

      let title = '';
      let contentParas: string[] = [];

      if (storyParas.length > 0) {
        title = storyParas[0].replace(/^\d+[\s\.\-]+/, '').trim();
        contentParas = storyParas.slice(1);
      } else {
        title = `মুক্তিযুদ্ধের স্মৃতিকথা - সূত্র ${k + 1}`;
      }

      const metaLines = paras.slice(sutroIdx, metaEnd);
      const story = buildStoryFromBlocks(title, contentParas, metaLines, inferredDistrict, inferredDivision, originalFilename);
      stories.push(story);

      lastMetaEnd = metaEnd;
    }
  } else {
    // Single-story document (like 427 বাবা, না কেঁদে কলা খান সূত্র ১১৮৩০.docx)
    let sutroIdx = sutroIndices.length > 0 ? sutroIndices[0] : -1;
    let title = paras[0].replace(/^\d+[\s\.\-]+/, '').trim();
    
    // If title has sutro in filename: e.g. "427 বাবা, না কেঁদে কলা খান সূত্র ১১৮৩০.docx"
    const fnClean = path.basename(originalFilename, path.extname(originalFilename));
    const fnTitleMatch = fnClean.match(/^\d*\s*(.+?)(?:\s*সূত্র\s*[\d০-৯\w\-]+)?$/);
    if (fnTitleMatch && fnTitleMatch[1] && (!title || title.length > 150)) {
      title = fnTitleMatch[1].trim();
    }

    let contentParas: string[] = [];
    let metaLines: string[] = [];

    if (sutroIdx !== -1) {
      contentParas = paras.slice(1, sutroIdx);
      metaLines = paras.slice(sutroIdx);
    } else {
      // Find metadata by keywords at bottom
      const metaStart = paras.findIndex((p, idx) => idx > 0 && /সংগ্রহকারী|বর্ণনাকারী|সূত্র|সত্রূ/.test(p));
      if (metaStart !== -1) {
        contentParas = paras.slice(1, metaStart);
        metaLines = paras.slice(metaStart);
      } else {
        contentParas = paras.slice(1);
      }
    }

    const story = buildStoryFromBlocks(title, contentParas, metaLines, inferredDistrict, inferredDivision, originalFilename);
    stories.push(story);
  }

  return {
    filename: originalFilename,
    isMultiStory,
    stories,
    errors,
  };
}

function buildStoryFromBlocks(
  title: string,
  contentParas: string[],
  metaLines: string[],
  district: string,
  division: string,
  sourceFile: string
): StoryRecord {
  let archiveNumber = '';
  let collector = '';
  let school = '';
  let collectorClass = '';
  let respondent = '';
  let respondentAge = '';
  let relationship = '';
  let respondentAddress = '';

  const details: string[] = [...metaLines];

  // Parse sutro (must have colon or be at start of meta line)
  for (const line of metaLines) {
    const sutroMatch = line.match(/(?:^|\s)(?:সূত্র|সত্রূ|সুত্ৰ)\s*[:ঃ]\s*([০-৯\d\w\s\-_]+)/i);
    if (sutroMatch && !archiveNumber) {
      archiveNumber = sutroMatch[1].trim();
    }
  }

  // If no archiveNumber found in text, extract from filename
  if (!archiveNumber) {
    const fnSutro = sourceFile.match(/(?:সূত্র|সত্রূ|sutro)\s*([০-৯\d\w\-]+)/i);
    if (fnSutro) {
      archiveNumber = fnSutro[1].trim();
    } else {
      // Generate unique fallback
      archiveNumber = `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    }
  }

  let inCollector = false;
  let inRespondent = false;

  for (let i = 0; i < metaLines.length; i++) {
    const line = metaLines[i].trim();
    if (/সংগ্রহকারী/i.test(line)) {
      inCollector = true;
      inRespondent = false;
      const after = line.replace(/.*সংগ্রহকারী\s*[:ঃ]?\s*/i, '').trim();
      if (after && !/বর্ণনাকারী/.test(after)) collector = after;
      continue;
    }
    if (/বর্ণনাকারী/i.test(line)) {
      inRespondent = true;
      inCollector = false;
      const after = line.replace(/.*বর্ণনাকারী\s*[:ঃ]?\s*/i, '').trim();
      if (after) respondent = after;
      continue;
    }

    // Collector info
    if (inCollector) {
      if (/বিদ্যালয়|স্কুল|মাদ্রাসা|কলেজ|ইনস্টিটিউশন|হাইস্কুল/i.test(line)) {
        school = line.replace(/^(?:স্কুল|বিদ্যালয়)\s*[:ঃ]?\s*/i, '').trim();
      } else if (/শ্রেণি|রোল|শাখা/i.test(line)) {
        collectorClass = line;
      } else if (!collector && line.length < 50 && !/সূত্র|বয়স|গ্রাম/.test(line)) {
        collector = line;
      }
    }

    // Respondent info
    if (inRespondent) {
      const ageMatch = line.match(/বয়স\s*[:ঃ]?\s*([০-৯\d]+(?:\s*বছর)?)/i);
      if (ageMatch) respondentAge = ageMatch[1].trim();

      const relMatch = line.match(/সম্পর্ক\s*[:ঃ]?\s*([^,\n\r]+)/i);
      if (relMatch) relationship = relMatch[1].trim();

      if (/গ্রাম\s*[:ঃ]|ডাকঘর|থানা|পোস্ট|সদর/i.test(line)) {
        respondentAddress = line;
      } else if (!respondent && !ageMatch && !relMatch && line.length < 50) {
        respondent = line;
      }
    }
  }

  // Fallback defaults
  if (!district) {
    for (const [dist, div] of Object.entries(DISTRICT_TO_DIVISION)) {
      if (details.some((d) => d.includes(dist))) {
        district = dist;
        division = div;
        break;
      }
    }
  }

  const cleanDistrict = district || 'অজ্ঞাত জেলা';
  const cleanDivision = division || DISTRICT_TO_DIVISION[cleanDistrict] || 'বাংলাদেশ';
  const cleanId = `LWM-OH-${cleanDistrict.toUpperCase().replace(/\s+/g, '_')}-${archiveNumber}`;

  return {
    id: cleanId,
    archiveNumber,
    district: cleanDistrict,
    division: cleanDivision,
    title: title.trim() || 'শিরোনামহীন স্মৃতিকথা',
    collector: collector || 'অজ্ঞাত',
    school: school || 'তথ্য নেই',
    collectorClass: collectorClass || '',
    respondent: respondent || 'অজ্ঞাত',
    respondentAddress: respondentAddress || '',
    respondentAge: respondentAge || '',
    relationship: relationship || '',
    content: contentParas.join('\n\n').trim(),
    details,
    access: 'public',
    sourceFile,
    dateAdded: new Date().toISOString(),
  };
}
