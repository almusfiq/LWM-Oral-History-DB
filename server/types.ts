export interface StoryRecord {
  id: string;
  archiveNumber: string;
  district: string;
  division?: string;
  title: string;
  collector: string;
  school: string;
  collectorClass?: string;
  collectorRoll?: string;
  respondent: string;
  respondentAddress?: string;
  respondentAge?: string;
  relationship?: string;
  content: string;
  details?: string[];
  access: 'public' | 'restricted';
  sourceFile?: string;
  dateAdded: string;
}

export interface SchoolAlbumRecord {
  district: string;
  school: string;
  pictures: string[];
}

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
  stories: StoryRecord[];
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
