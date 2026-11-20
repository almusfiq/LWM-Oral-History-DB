import { useState, useRef } from 'react';
import type { Page } from '../App';
import AdminSidebar from '../components/AdminSidebar';
import AdminTopbar from '../components/AdminTopbar';
import { num, useLang } from '../i18n';
import { saveStory, uploadDocxFiles, uploadZipFile, uploadSchoolPhotos } from '../api/client';

interface UploadPageProps {
  navigate: (page: Page, opts?: Record<string, unknown>) => void;
  onLogout: () => void;
}

type UploadTab = 'bulk' | 'manual' | 'photos';

export default function UploadPage({ navigate, onLogout }: UploadPageProps) {
  const { t, lang } = useLang();
  const bn = lang === 'bn';

  const [activeTab, setActiveTab] = useState<UploadTab>('bulk');

  // Manual Form State
  const [form, setForm] = useState({
    title: '',
    titleBn: '',
    content: '',
    respondentName: '',
    respondentAge: '',
    collectorName: '',
    school: '',
    division: '',
    district: '',
    upazila: '',
    area: '',
    language: 'bangla',
    access: 'public',
    notes: '',
  });
  const [manualSaving, setManualSaving] = useState(false);
  const [manualSaved, setManualSaved] = useState(false);

  // Bulk Upload State
  const [bulkFiles, setBulkFiles] = useState<File[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkResult, setBulkResult] = useState<{
    success: boolean;
    filesProcessed?: number;
    storiesExtracted?: number;
    databaseInserted?: number;
    photosSaved?: number;
    schoolAlbumsUpdated?: number;
    sampleStories?: any[];
    error?: string;
  } | null>(null);

  // School Photos State
  const [photoDistrict, setPhotoDistrict] = useState('');
  const [photoSchool, setPhotoSchool] = useState('');
  const [selectedPhotos, setSelectedPhotos] = useState<File[]>([]);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoSuccess, setPhotoSuccess] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const zipInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const set = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  // Handle Manual Save
  const handleManualSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setManualSaving(true);
    try {
      const storyData = {
        title: form.titleBn.trim() || form.title.trim() || 'Untitled story',
        respondent: form.respondentName.trim() || 'তথ্য নেই',
        collector: form.collectorName.trim() || 'তথ্য নেই',
        school: form.school.trim() || 'তথ্য নেই',
        division: form.division.trim(),
        district: form.district.trim() || 'বাগেরহাট',
        upazila: form.upazila.trim(),
        area: form.area.trim(),
        access: form.access === 'restricted' ? 'restricted' : 'public',
        content: form.content.trim(),
      };
      await saveStory(storyData);
      setManualSaved(true);
      setTimeout(() => setManualSaved(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Error saving story');
    } finally {
      setManualSaving(false);
    }
  };

  // Handle Bulk DOCX Upload
  const handleBulkUpload = async () => {
    if (bulkFiles.length === 0) return;
    setBulkLoading(true);
    setBulkResult(null);

    try {
      const isZip = bulkFiles.some((f) => f.name.toLowerCase().endsWith('.zip'));
      if (isZip && bulkFiles.length === 1) {
        // ZIP upload
        const res = await uploadZipFile(bulkFiles[0]);
        setBulkResult(res);
      } else {
        // Multiple DOCX upload
        const docxFiles = bulkFiles.filter((f) => f.name.toLowerCase().endsWith('.docx') || f.name.toLowerCase().endsWith('.doc'));
        const res = await uploadDocxFiles(docxFiles);
        setBulkResult(res);
      }
      setBulkFiles([]);
    } catch (err: any) {
      setBulkResult({ success: false, error: err.message || 'Upload failed' });
    } finally {
      setBulkLoading(false);
    }
  };

  // Handle School Photos Upload
  const handlePhotoUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoDistrict || !photoSchool || selectedPhotos.length === 0) return;
    setPhotoUploading(true);
    setPhotoSuccess(null);
    try {
      const updated = await uploadSchoolPhotos(photoDistrict, photoSchool, selectedPhotos);
      setPhotoSuccess(
        bn
          ? `${selectedPhotos.length}টি ফটো সফলভাবে "${photoSchool}" অ্যালবামে সংরক্ষিত হয়েছে। মোট ফটো: ${updated.length}`
          : `${selectedPhotos.length} photos uploaded to "${photoSchool}". Total: ${updated.length}`
      );
      setSelectedPhotos([]);
    } catch (err: any) {
      alert(err.message || 'Photo upload failed');
    } finally {
      setPhotoUploading(false);
    }
  };

  const wordCount = form.content.trim() ? form.content.trim().split(/\s+/).length : 0;
  const place = [form.area, form.upazila, form.district, form.division].map((value) => value.trim()).filter(Boolean).join(', ');

  return (
    <div className="min-h-screen bg-[#F2EEE5] flex flex-col lg:flex-row">
      <AdminSidebar active="Upload Story" navigate={navigate} />

      <div className="flex-1 min-w-0 flex flex-col">
        <AdminTopbar
          title="Upload to Database"
          titleBn="ডেটাবেজে নতুন তথ্য ও গল্প যোগ করুন"
          backLabel={t('Back to Overview', 'সারসংক্ষেপে ফিরে যান')}
          onBack={() => navigate('admin', { adminSection: 'Overview' })}
          onLogout={onLogout}
        />

        <div className="flex-1 p-5 sm:p-8">
          <div className="mx-auto max-w-6xl">
            {/* Mode Switcher Tabs */}
            <div className="mb-6 flex flex-wrap items-center gap-2 rounded-2xl border border-line bg-white p-1.5 shadow-xs">
              <button
                type="button"
                onClick={() => setActiveTab('bulk')}
                className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all ${
                  activeTab === 'bulk'
                    ? 'bg-forest text-white shadow-sm'
                    : 'text-ink-muted hover:bg-forest-pale/60 hover:text-ink'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242M12 12v9m-4-4 4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {t('Bulk DOCX / ZIP Upload', 'বাল্ক DOCX ও জিপ ফাইল আপলোড')}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('photos')}
                className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all ${
                  activeTab === 'photos'
                    ? 'bg-forest text-white shadow-sm'
                    : 'text-ink-muted hover:bg-forest-pale/60 hover:text-ink'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {t('School Photo Albums', 'স্কুল ফটো অ্যালবাম আপলোড')}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('manual')}
                className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all ${
                  activeTab === 'manual'
                    ? 'bg-forest text-white shadow-sm'
                    : 'text-ink-muted hover:bg-forest-pale/60 hover:text-ink'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path d="M11 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5m-1.414-9.414a2 2 0 1 1 2.828 2.828L11.828 15H9v-2.828l8.586-8.586z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {t('Single Story Form', 'একক গল্প ফরম')}
              </button>
            </div>

            {/* TAB 1: BULK DOCX / ZIP UPLOAD */}
            {activeTab === 'bulk' && (
              <div className="space-y-6">
                <div className="rounded-3xl border border-line bg-white p-6 sm:p-8 shadow-xs">
                  <div className="max-w-2xl">
                    <h2 className="text-xl font-bold text-ink" style={{ fontFamily: "'Noto Sans Bengali', sans-serif" }}>
                      {t('Bulk Ingestion & Auto-Parsing Engine', 'বাল্ক ইনজেশন ও স্বয়ংক্রিয় পার্সিং ইঞ্জিন')}
                    </h2>
                    <p className="mt-2 text-sm text-ink-muted leading-relaxed">
                      {bn
                        ? 'আপনার ২০,০০০+ স্মৃতিকথা ফাইল আপলোড করুন। সিস্টেম স্বয়ংক্রিয়ভাবে সিঙ্গেল-স্টোরি ফাইল এবং মাল্টি-স্টোরি ফাইল (এক ফাইলে একাধিক গল্প) চিহ্নিত করে শিরোনাম, মূল বিবরণ, সূত্র নম্বর, সংগ্রাহক ও বর্ণনাকারীর তথ্য আলাদা করে সরাসরি ডেটাবেজে যুক্ত করবে।'
                        : 'Upload your bulk oral history documents. The engine automatically splits multi-story files, extracts metadata (Archive source, Collector, School, Witness), and bulk inserts into the database.'}
                    </p>
                  </div>

                  {/* Drag and Drop Zone */}
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (e.dataTransfer.files?.length) {
                        setBulkFiles((prev) => [...prev, ...Array.from(e.dataTransfer.files)]);
                      }
                    }}
                    className="mt-6 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-line bg-surface p-8 sm:p-12 text-center transition hover:border-forest/50 hover:bg-forest-pale/20"
                  >
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-forest-pale text-forest">
                      <svg className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                        <path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>

                    <h3 className="mt-4 text-base font-semibold text-ink" style={{ fontFamily: "'Noto Sans Bengali', sans-serif" }}>
                      {bn ? 'এখানে DOCX ফাইল বা ZIP ফাইল ড্র্যাগ করুন' : 'Drag & drop DOCX files or a ZIP archive here'}
                    </h3>
                    <p className="mt-1 text-xs text-ink-muted">
                      {bn ? 'একসাথে শত শত DOCX অথবা সম্পূর্ণ ফোল্ডারের ZIP সাপোর্ট করে' : 'Supports hundreds of .docx files or a complete folder .zip archive'}
                    </p>

                    <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept=".docx,.doc"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.length) {
                            setBulkFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="rounded-xl border border-line bg-white px-4 py-2 text-sm font-semibold text-ink shadow-xs hover:border-forest/40"
                      >
                        {bn ? 'DOCX ফাইল সিলেক্ট করুন' : 'Select DOCX Files'}
                      </button>

                      <input
                        ref={zipInputRef}
                        type="file"
                        accept=".zip"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.length) {
                            setBulkFiles([e.target.files[0]]);
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => zipInputRef.current?.click()}
                        className="rounded-xl border border-line bg-white px-4 py-2 text-sm font-semibold text-ink shadow-xs hover:border-forest/40"
                      >
                        {bn ? 'ZIP আর্কাইভ সিলেক্ট করুন' : 'Select ZIP Archive'}
                      </button>
                    </div>
                  </div>

                  {/* Selected files preview */}
                  {bulkFiles.length > 0 && (
                    <div className="mt-6 rounded-2xl border border-line bg-surface p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-ink">
                          {bn ? `নির্বাচিত ফাইলসমূহ (${num(bulkFiles.length, lang)}টি)` : `Selected files (${bulkFiles.length})`}
                        </span>
                        <button
                          type="button"
                          onClick={() => setBulkFiles([])}
                          className="text-xs text-rose-600 hover:underline"
                        >
                          {bn ? 'সব মুছুন' : 'Clear all'}
                        </button>
                      </div>

                      <div className="mt-3 max-h-48 overflow-y-auto space-y-1.5 text-xs text-ink-muted">
                        {bulkFiles.slice(0, 15).map((f, i) => (
                          <div key={i} className="flex items-center justify-between rounded-lg bg-white px-3 py-2 border border-line/60">
                            <span className="truncate max-w-md font-mono">{f.name}</span>
                            <span className="shrink-0 text-ink-faint">{(f.size / 1024).toFixed(1)} KB</span>
                          </div>
                        ))}
                        {bulkFiles.length > 15 && (
                          <p className="text-center text-ink-faint pt-1">
                            {bn ? `...এবং আরও ${num(bulkFiles.length - 15, lang)}টি ফাইল` : `...and ${bulkFiles.length - 15} more files`}
                          </p>
                        )}
                      </div>

                      <div className="mt-4 flex items-center justify-end">
                        <button
                          type="button"
                          disabled={bulkLoading}
                          onClick={handleBulkUpload}
                          className="flex items-center gap-2 rounded-xl bg-forest px-6 py-2.5 font-semibold text-white shadow-sm hover:bg-forest-deep disabled:opacity-50"
                        >
                          {bulkLoading ? (
                            <>
                              <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                              {bn ? 'পার্সিং ও ডেটাবেজে সেভ হচ্ছে...' : 'Parsing & Saving to DB...'}
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                              {bn ? 'ডেটাবেজে আপলোড শুরু করুন' : 'Start Ingestion into Database'}
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Bulk Result Report */}
                  {bulkResult && (
                    <div className="mt-6 rounded-2xl border border-forest/30 bg-forest-pale/40 p-5">
                      {bulkResult.success ? (
                        <div>
                          <div className="flex items-center gap-2 text-forest-deep font-bold text-base">
                            <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                              <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            {bn ? 'ইনজেশন সফলভাবে সম্পন্ন হয়েছে!' : 'Ingestion Completed Successfully!'}
                          </div>
                          <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                            <div className="rounded-xl bg-white p-3 border border-line">
                              <p className="text-xs text-ink-muted">{bn ? 'প্রসেসকৃত ফাইল' : 'Files Processed'}</p>
                              <p className="text-lg font-bold text-ink">{num(bulkResult.filesProcessed ?? (bulkResult as any).docxFilesFound ?? 1, lang)}</p>
                            </div>
                            <div className="rounded-xl bg-white p-3 border border-line">
                              <p className="text-xs text-ink-muted">{bn ? 'এক্সট্র্যাক্টকৃত গল্প' : 'Stories Extracted'}</p>
                              <p className="text-lg font-bold text-forest-deep">{num(bulkResult.storiesExtracted ?? 0, lang)}</p>
                            </div>
                            <div className="rounded-xl bg-white p-3 border border-line">
                              <p className="text-xs text-ink-muted">{bn ? 'ডেটাবেজে সেভকৃত' : 'Saved in DB'}</p>
                              <p className="text-lg font-bold text-emerald-700">{num(bulkResult.databaseInserted ?? 0, lang)}</p>
                            </div>
                            {bulkResult.photosSaved !== undefined && (
                              <div className="rounded-xl bg-white p-3 border border-line">
                                <p className="text-xs text-ink-muted">{bn ? 'স্কুল ফটো সংরক্ষিত' : 'Photos Saved'}</p>
                                <p className="text-lg font-bold text-amber-700">{num(bulkResult.photosSaved, lang)}</p>
                              </div>
                            )}
                          </div>

                          <div className="mt-4 flex items-center justify-between">
                            <span className="text-xs text-ink-muted">
                              {bn ? 'সিস্টেম স্বয়ংক্রিয়ভাবে লাইভ আপডেট হয়েছে।' : 'System has been synced with database.'}
                            </span>
                            <button
                              type="button"
                              onClick={() => navigate('admin', { adminSection: 'All Stories' })}
                              className="text-xs font-semibold text-forest underline hover:text-forest-deep"
                            >
                              {bn ? 'সংগ্রহশালায় সব গল্প দেখুন →' : 'View All Stories in Archive →'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-rose-700">
                          <p className="font-bold">{bn ? 'আপলোডে সমস্যা হয়েছে:' : 'Error during upload:'}</p>
                          <p className="mt-1">{bulkResult.error}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: SCHOOL PHOTOS UPLOAD */}
            {activeTab === 'photos' && (
              <div className="rounded-3xl border border-line bg-white p-6 sm:p-8 shadow-xs">
                <div className="max-w-2xl">
                  <h2 className="text-xl font-bold text-ink" style={{ fontFamily: "'Noto Sans Bengali', sans-serif" }}>
                    {t('School Photo Albums & Galleries', 'বিদ্যালয়ভিত্তিক ফটো অ্যালবাম সংযোজন')}
                  </h2>
                  <p className="mt-2 text-sm text-ink-muted leading-relaxed">
                    {bn
                      ? 'প্রতিটি বিদ্যালয়ের সংগ্রহকারী ও শিক্ষার্থীদের মৌখিক ইতিহাস ক্যাম্পেইনের ছবি আপলোড করুন। স্টোরি পেজে ঐ বিদ্যালয় ও জেলার পাঠকদের সামনে এই ফটোগুলো স্লাইডশো আকারে স্বয়ংক্রিয়ভাবে প্রদর্শিত হবে।'
                      : 'Upload oral history campaign photos for specific schools. These photos automatically appear in the interactive slideshow on matching story pages.'}
                  </p>
                </div>

                <form onSubmit={handlePhotoUpload} className="mt-6 max-w-xl space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label={t('District', 'জেলা')} required>
                      <input
                        value={photoDistrict}
                        onChange={(e) => setPhotoDistrict(e.target.value)}
                        placeholder={t('e.g. Bagerhat', 'যেমন: বাগেরহাট বা কুমিল্লা')}
                        required
                        className={inputClass}
                        style={{ fontFamily: "'Noto Sans Bengali', sans-serif" }}
                      />
                    </Field>

                    <Field label={t('School Name', 'বিদ্যালয়ের নাম')} required>
                      <input
                        value={photoSchool}
                        onChange={(e) => setPhotoSchool(e.target.value)}
                        placeholder={t('e.g. Bagerhat Govt High School', 'যেমন: মধুদিয়া ইচ্ছাময়ী মাধ্যমিক বিদ্যালয়')}
                        required
                        className={inputClass}
                        style={{ fontFamily: "'Noto Sans Bengali', sans-serif" }}
                      />
                    </Field>
                  </div>

                  <Field label={t('Select Photos (JPEG / PNG)', 'ফটো সিলেক্ট করুন (JPEG / PNG)')} required>
                    <input
                      ref={photoInputRef}
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files) setSelectedPhotos(Array.from(e.target.files));
                      }}
                      className={inputClass}
                    />
                  </Field>

                  {selectedPhotos.length > 0 && (
                    <div className="rounded-xl border border-line bg-surface p-3 text-xs text-ink-muted">
                      {bn ? `${num(selectedPhotos.length, lang)}টি ফটো নির্বাচিত হয়েছে।` : `${selectedPhotos.length} photos selected.`}
                    </div>
                  )}

                  {photoSuccess && (
                    <div className="rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-800 border border-emerald-200">
                      {photoSuccess}
                    </div>
                  )}

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={photoUploading || selectedPhotos.length === 0}
                      className="flex items-center gap-2 rounded-xl bg-forest px-6 py-2.5 font-semibold text-white shadow-sm hover:bg-forest-deep disabled:opacity-50"
                    >
                      {photoUploading ? (
                        bn ? 'ফটো আপলোড হচ্ছে...' : 'Uploading photos...'
                      ) : (
                        bn ? 'অ্যালবামে সেভ করুন' : 'Save to School Album'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* TAB 3: SINGLE STORY FORM */}
            {activeTab === 'manual' && (
              <form onSubmit={handleManualSave} className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
                <div className="space-y-6">
                  <FormSection step={1} title="Story title" titleBn="গল্পের শিরোনাম">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Field label={t('Title (English)', 'শিরোনাম (ইংরেজি)')}>
                        <input value={form.title} onChange={(e) => set('title', e.target.value)} placeholder={t('Enter a story title', 'গল্পের শিরোনাম লিখুন')} className={inputClass} />
                      </Field>
                      <Field label={t('Title (Bangla)', 'শিরোনাম (বাংলা)')} optional>
                        <input value={form.titleBn} onChange={(e) => set('titleBn', e.target.value)} placeholder={t('e.g. মুক্তির সেই রাত', 'যেমন: মুক্তির সেই রাত')} className={inputClass} style={{ fontFamily: "'Noto Sans Bengali', 'Inter', sans-serif" }} />
                      </Field>
                    </div>
                  </FormSection>

                  <FormSection
                    step={2}
                    title="Story content"
                    titleBn="গল্পের বিবরণ"
                    aside={
                      <label className="inline-flex items-center gap-2 text-sm text-ink-muted">
                        {t('Language', 'ভাষা')}
                        <select value={form.language} onChange={(e) => set('language', e.target.value)} className="rounded-lg border border-line bg-surface px-2.5 py-1.5 text-sm text-ink outline-none focus:border-forest focus:ring-4 focus:ring-forest/10">
                          <option value="bangla">{t('Bangla', 'বাংলা')}</option>
                          <option value="english">{t('English', 'ইংরেজি')}</option>
                          <option value="both">{t('Both', 'উভয়')}</option>
                        </select>
                      </label>
                    }
                  >
                    <textarea
                      value={form.content}
                      onChange={(e) => set('content', e.target.value)}
                      placeholder={t('Enter the full story text here. Bangla and/or English content is accepted...', 'এখানে গল্পের পূর্ণ বিবরণ লিখুন। বাংলা ও/অথবা ইংরেজি লেখা যাবে...')}
                      rows={12}
                      className={`${inputClass} resize-y py-3 leading-7`}
                      style={{ fontFamily: "'Noto Sans Bengali', 'Inter', sans-serif" }}
                    />
                    <p className="mt-2 text-right text-xs tabular-nums text-ink-faint">{lang === 'bn' ? `${num(wordCount, lang)} শব্দ` : `${wordCount} ${wordCount === 1 ? 'word' : 'words'}`}</p>
                  </FormSection>

                  <FormSection step={3} title="People" titleBn="বর্ণনাকারী ও সংগ্রাহক">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        { key: 'respondentName', label: t('Respondent name', 'বর্ণনাকারীর নাম'), placeholder: t('Full name of the person interviewed', 'সাক্ষাৎকারদাতার পূর্ণ নাম'), required: true },
                        { key: 'respondentAge', label: t('Respondent age', 'বর্ণনাকারীর বয়স'), placeholder: t('Age at time of interview', 'সাক্ষাৎকারের সময় বয়স'), required: false },
                        { key: 'collectorName', label: t('Collector name', 'সংগ্রাহকের নাম'), placeholder: t('Name of the student collector', 'শিক্ষার্থী সংগ্রাহকের নাম'), required: true },
                        { key: 'school', label: t('School', 'বিদ্যালয়'), placeholder: t('School name', 'বিদ্যালয়ের নাম'), required: true },
                      ].map(({ key, label, placeholder, required }) => (
                        <Field key={key} label={label} required={required} optional={!required}>
                          <input
                            value={form[key as keyof typeof form]}
                            onChange={(e) => set(key, e.target.value)}
                            placeholder={placeholder}
                            required={required}
                            className={inputClass}
                            style={{ fontFamily: "'Noto Sans Bengali', 'Inter', sans-serif" }}
                          />
                        </Field>
                      ))}
                    </div>
                  </FormSection>

                  <FormSection step={4} title="Location" titleBn="যেখানে ঘটনাটি ঘটেছিল">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[
                        { key: 'division', label: t('Division', 'বিভাগ'), placeholder: t('e.g. Khulna', 'যেমন: খুলনা বিভাগ') },
                        { key: 'district', label: t('District', 'জেলা'), placeholder: t('e.g. Bagerhat', 'যেমন: বাগেরহাট') },
                        { key: 'upazila', label: t('Upazila', 'উপজেলা'), placeholder: t('e.g. Rampal', 'যেমন: রামপাল') },
                        { key: 'area', label: t('Area / Village', 'গ্রাম / এলাকা'), placeholder: t('e.g. Islamganj', 'যেমন: ইসলামগঞ্জ') },
                      ].map(({ key, label, placeholder }) => (
                        <Field key={key} label={label}>
                          <input value={form[key as keyof typeof form]} onChange={(e) => set(key, e.target.value)} placeholder={placeholder} className={inputClass} style={{ fontFamily: "'Noto Sans Bengali', 'Inter', sans-serif" }} />
                        </Field>
                      ))}
                    </div>
                  </FormSection>

                  <FormSection step={5} title="Visibility / Access" titleBn="কারা পড়তে পারবেন">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        { value: 'public', label: t('Public', 'উন্মুক্ত'), desc: t('Visible to all visitors of the Oral History archive', 'মৌখিক ইতিহাস আর্কাইভের সকল দর্শনার্থী দেখতে পাবেন'), icon: <><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" /><circle cx={12} cy={12} r={3} /></> },
                        { value: 'restricted', label: t('Restricted', 'সীমাবদ্ধ'), desc: t('Hidden from public visitors; available to authorized archive administrators', 'সাধারণ দর্শনার্থীদের কাছে গোপন; কেবল অনুমোদিত আর্কাইভ প্রশাসকরা দেখতে পাবেন'), icon: <><rect x={4} y={11} width={16} height={10} rx={2} /><path d="M8 11V7a4 4 0 0 1 8 0v4" strokeLinecap="round" /></> },
                      ].map(({ value, label, desc, icon }) => {
                        const checked = form.access === value;
                        return (
                          <label key={value} className={`relative flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-all ${checked ? 'border-forest bg-forest-pale shadow-[0_10px_24px_-16px_rgba(11,15,13,0.18)]' : 'border-line bg-white hover:border-forest/40'}`}>
                            <input type="radio" name="access" value={value} checked={checked} onChange={(e) => set('access', e.target.value)} className="sr-only" />
                            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${checked ? 'bg-forest text-white' : 'bg-surface text-ink-muted'}`}>
                              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" aria-hidden="true">{icon}</svg>
                            </span>
                            <span>
                              <span className="block text-sm font-semibold text-ink">{label}</span>
                              <span className="mt-0.5 block text-xs leading-relaxed text-ink-muted">{desc}</span>
                            </span>
                            <span aria-hidden="true" className={`absolute right-4 top-4 flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors ${checked ? 'border-forest bg-forest' : 'border-line'}`}>
                              {checked && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </FormSection>
                </div>

                {/* Right summary & save actions */}
                <aside className="xl:sticky xl:top-28 space-y-4">
                  <div className="relative overflow-hidden rounded-3xl border border-line bg-surface-sunken p-6 shadow-[0_24px_60px_-30px_rgba(11,15,13,0.55)]">
                    <span aria-hidden="true" className="pointer-events-none absolute inset-2 rounded-[18px] border border-gold/30" />
                    <div className="relative">
                      <p className="text-sm text-gold-dark">{t('Record preview', 'রেকর্ডের পূর্বরূপ')}</p>
                      <p className="mt-3 text-2xl font-bold leading-snug text-ink" style={{ fontFamily: "'Noto Sans Bengali', sans-serif" }}>
                        {form.titleBn.trim() || form.title.trim() || <span className="text-ink-faint/70">{t('Untitled story', 'শিরোনামহীন গল্প')}</span>}
                      </p>
                      {form.titleBn.trim() && form.title.trim() && <p className="mt-1 text-sm text-ink-muted">{form.title}</p>}
                      <dl className="mt-5 space-y-3 border-t border-gold/25 pt-4 text-sm" style={{ fontFamily: "'Noto Sans Bengali', 'Inter', sans-serif" }}>
                        {[
                          [t('Respondent', 'বর্ণনাকারী'), form.respondentName + (form.respondentAge.trim() ? `, ${form.respondentAge}` : '')],
                          [t('Collector', 'সংগ্রাহক'), form.collectorName],
                          [t('School', 'বিদ্যালয়'), form.school],
                          [t('Place', 'স্থান'), place],
                        ].map(([label, value]) => (
                          <div key={label} className="flex justify-between gap-4">
                            <dt className="shrink-0 text-ink-muted">{label}</dt>
                            <dd className={`truncate text-right font-semibold ${value.trim() ? 'text-ink' : 'font-normal text-ink-faint/70'}`}>{value.trim() || t('Not added yet', 'এখনো যোগ করা হয়নি')}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-4">
                    <button
                      type="submit"
                      disabled={manualSaving}
                      className={`flex items-center justify-center gap-2 rounded-xl px-6 py-3 font-semibold text-white transition-colors ${manualSaved ? 'bg-emerald-600' : 'bg-forest hover:bg-forest-dark disabled:opacity-50'}`}
                    >
                      {manualSaved ? (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                          {t('Story Saved in DB', 'গল্পটি ডেটাবেজে সংরক্ষিত হয়েছে')}
                        </>
                      ) : manualSaving ? (
                        t('Saving...', 'সংরক্ষণ হচ্ছে...')
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><path d="M17 21v-8H7v8M7 3v5h8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                          {t('Save Story to DB', 'গল্প ডেটাবেজে সংরক্ষণ করুন')}
                        </>
                      )}
                    </button>
                    <button type="button" onClick={() => navigate('admin')} className="rounded-xl border border-line px-6 py-3 font-semibold text-ink-muted hover:border-forest/60 hover:text-forest-deep">
                      {t('Cancel', 'বাতিল')}
                    </button>
                  </div>
                </aside>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const inputClass = 'w-full rounded-xl border border-line bg-surface px-4 py-2.5 text-[15px] text-ink placeholder-ink-faint/70 outline-none transition focus:border-forest focus:bg-white focus:ring-4 focus:ring-forest/10';

function FormSection({ step, title, titleBn, optional = false, aside, children }: { step: number; title: string; titleBn: string; optional?: boolean; aside?: React.ReactNode; children: React.ReactNode }) {
  const { lang } = useLang();
  const bn = lang === 'bn';
  return (
    <section className="rounded-2xl border border-line bg-white p-6 transition-shadow duration-500 focus-within:border-forest/40 focus-within:shadow-[0_20px_50px_-30px_rgba(11,15,13,0.18)]">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gold/40 bg-gold-pale font-display text-base font-semibold text-gold-dark">{num(step, lang)}</span>
          <div className="leading-tight">
            <h2 className="font-display text-lg font-semibold text-ink">{bn ? titleBn : title} {optional && <span className="font-sans text-sm font-normal text-ink-faint">{bn ? 'ঐচ্ছিক' : 'optional'}</span>}</h2>
          </div>
        </div>
        {aside}
      </div>
      {children}
    </section>
  );
}

function Field({ label, required = false, optional = false, children }: { label: string; required?: boolean; optional?: boolean; children: React.ReactNode }) {
  const { t } = useLang();
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink-muted">
        {label} {required && <span className="text-gold">*</span>}
        {optional && <span className="ml-1 font-normal text-ink-faint">{t('optional', 'ঐচ্ছিক')}</span>}
      </span>
      {children}
    </label>
  );
}
