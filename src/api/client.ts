import type { ArchiveStory } from '../data/stories';

export interface StoryQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  district?: string;
  division?: string;
  school?: string;
  access?: 'public' | 'restricted' | 'all';
}

export interface StoryListResponse {
  stories: ArchiveStory[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SystemStats {
  totalStories: number;
  totalDistricts: number;
  totalDivisions: number;
  totalSchools: number;
  totalPhotos: number;
  divisionCounts: Record<string, number>;
  databaseType: 'PostgreSQL' | 'SQLite (Local)';
  databaseStatus: 'connected' | 'error';
}

export interface SchoolAlbum {
  district: string;
  school: string;
  pictures: string[];
}

const API_BASE = '/api';

export async function getStats(): Promise<SystemStats> {
  const res = await fetch(`${API_BASE}/stats`);
  if (!res.ok) throw new Error('Failed to fetch stats');
  return res.json();
}

export async function getStories(params: StoryQueryParams = {}): Promise<StoryListResponse> {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  if (params.search) query.set('search', params.search);
  if (params.district) query.set('district', params.district);
  if (params.division) query.set('division', params.division);
  if (params.school) query.set('school', params.school);
  if (params.access) query.set('access', params.access);

  const res = await fetch(`${API_BASE}/stories?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch stories');
  return res.json();
}

export async function getStoryById(id: string): Promise<ArchiveStory | null> {
  const res = await fetch(`${API_BASE}/stories/${encodeURIComponent(id)}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('Failed to fetch story');
  return res.json();
}

export async function saveStory(storyData: Record<string, any>): Promise<ArchiveStory> {
  const res = await fetch(`${API_BASE}/stories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(storyData),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to save story');
  }
  const data = await res.json();
  return data.story;
}

export async function deleteStory(id: string): Promise<boolean> {
  const res = await fetch(`${API_BASE}/stories/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  return res.ok;
}

export async function uploadDocxFiles(
  files: File[],
  district = '',
  division = ''
): Promise<{
  success: boolean;
  filesProcessed: number;
  storiesExtracted: number;
  databaseInserted: number;
  sampleStories: any[];
}> {
  const formData = new FormData();
  for (const f of files) {
    formData.append('files', f);
  }
  if (district) formData.append('district', district);
  if (division) formData.append('division', division);

  const res = await fetch(`${API_BASE}/upload/docx`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Upload failed');
  }
  return res.json();
}

export async function uploadZipFile(file: File): Promise<{
  success: boolean;
  zipName: string;
  docxFilesFound: number;
  storiesExtracted: number;
  databaseInserted: number;
  photosSaved: number;
  schoolAlbumsUpdated: number;
}> {
  const formData = new FormData();
  formData.append('zipfile', file);

  const res = await fetch(`${API_BASE}/upload/zip`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'ZIP extraction failed');
  }
  return res.json();
}

export async function getSchoolAlbums(): Promise<SchoolAlbum[]> {
  const res = await fetch(`${API_BASE}/photos`);
  if (!res.ok) return [];
  return res.json();
}

export async function getSchoolPictures(district: string, school: string): Promise<string[]> {
  const res = await fetch(`${API_BASE}/photos/${encodeURIComponent(district)}/${encodeURIComponent(school)}`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.pictures || [];
}

export async function uploadSchoolPhotos(district: string, school: string, files: File[]): Promise<string[]> {
  const formData = new FormData();
  formData.append('district', district);
  formData.append('school', school);
  for (const f of files) {
    formData.append('photos', f);
  }

  const res = await fetch(`${API_BASE}/photos/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) throw new Error('Failed to upload photos');
  const data = await res.json();
  return data.pictures || [];
}
