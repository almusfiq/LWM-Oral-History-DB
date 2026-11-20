import { useState } from 'react';
import type { AccountType, Page } from '../App';
import MuseumBrand from '../components/MuseumBrand';
import { LangToggle, useLang } from '../i18n';

interface LoginPageProps {
  navigate: (page: Page, opts?: Record<string, unknown>) => void;
  onLogin: (accountType: AccountType) => void;
  /** 'admin' is the separate sign-in at /admin; the public page never accepts admin accounts. */
  variant?: 'public' | 'admin';
}

const accountTypes: { id: AccountType; name: string; nameBn: string; description: string; descriptionBn: string }[] = [
  { id: 'public', name: 'Public account', nameBn: 'পাবলিক অ্যাকাউন্ট', description: 'Sign in or create an account to bookmark stories.', descriptionBn: 'গল্প সংরক্ষণ করতে সাইন ইন করুন বা অ্যাকাউন্ট খুলুন।' },
  { id: 'official', name: 'Officials', nameBn: 'কর্মকর্তা', description: 'Sign in with an account issued by the museum authority.', descriptionBn: 'জাদুঘর কর্তৃপক্ষের দেওয়া অ্যাকাউন্ট দিয়ে সাইন ইন করুন।' },
  { id: 'admin', name: 'Admin', nameBn: 'অ্যাডমিন', description: 'Manage the archive with authorized admin access.', descriptionBn: 'অনুমোদিত অ্যাডমিন হিসেবে আর্কাইভ পরিচালনা করুন।' },
];

const demoAccounts: Record<AccountType, { email: string; password: string }> = {
  public: { email: 'public@gmail.com', password: 'public123' },
  official: { email: 'official@lwm.local', password: 'OfficialDemo!2026' },
  admin: { email: 'admin@gmail.com', password: 'admin123' },
};

const PUBLIC_ACCOUNTS_KEY = 'lwm-public-accounts';

export default function LoginPage({ navigate, onLogin, variant = 'public' }: LoginPageProps) {
  const isAdminLogin = variant === 'admin';
  const { t, lang } = useLang();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [accountType, setAccountType] = useState<AccountType>(isAdminLogin ? 'admin' : 'public');
  const [showPassword, setShowPassword] = useState(false);
  const [notice, setNotice] = useState('');
  const [isSigningUp, setIsSigningUp] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSigningUp && accountType === 'public') {
      const accounts = JSON.parse(localStorage.getItem(PUBLIC_ACCOUNTS_KEY) ?? '[]') as { email: string; password: string }[];
      if (accounts.some((account) => account.email === email.trim().toLowerCase())) {
        setNotice(t('An account with this email already exists. Please sign in.', 'এই ইমেইলে আগেই একটি অ্যাকাউন্ট আছে। অনুগ্রহ করে সাইন ইন করুন।'));
        return;
      }
      accounts.push({ email: email.trim().toLowerCase(), password });
      localStorage.setItem(PUBLIC_ACCOUNTS_KEY, JSON.stringify(accounts));
      onLogin('public');
      return;
    }
    const normalizedEmail = email.trim().toLowerCase();

    // If admin credentials provided, always log in as admin
    if (normalizedEmail === 'admin@gmail.com' && password === 'admin123') {
      onLogin('admin');
      return;
    }

    // Demo accounts work on every build (including the deployed site)
    const demoAccountType = (Object.keys(demoAccounts) as AccountType[]).find(
      (type) => demoAccounts[type].email === normalizedEmail && demoAccounts[type].password === password,
    );
    if (demoAccountType) {
      onLogin(demoAccountType);
      return;
    }

    const registeredPublicAccounts = JSON.parse(localStorage.getItem(PUBLIC_ACCOUNTS_KEY) ?? '[]') as { email: string; password: string }[];
    if (!isAdminLogin && registeredPublicAccounts.some((account) => account.email === normalizedEmail && account.password === password)) {
      onLogin('public');
      return;
    }

    setNotice(t("That email and password don't match an account. Check them and try again.", 'ইমেইল ও পাসওয়ার্ড কোনো অ্যাকাউন্টের সঙ্গে মেলেনি। আবার দেখে চেষ্টা করুন।'));
  };

  const continueAsGuest = () => navigate('landing');

  return (
    <div className="h-dvh overflow-hidden flex" style={{ fontFamily: "'Noto Sans Bengali', sans-serif" }}>
      {/* Left — image panel */}
      <div className="hidden lg:block lg:w-1/2 relative bg-forest-deep overflow-hidden">
        <img
          src="/login-hero.jpg"
          alt={t('Historical archive reading room', 'ঐতিহাসিক আর্কাইভের পাঠকক্ষ')}
          className="hero-kenburns absolute inset-0 w-full h-full object-cover object-center opacity-45"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-forest-deep via-forest-deep/70 to-night/50" />
        <div aria-hidden="true" className="absolute inset-0 overflow-hidden pointer-events-none"><div className="film-grain" /></div>
        <div className="relative z-10 h-full flex flex-col justify-between p-10">
          <MuseumBrand light />

          {/* Quote */}
          <div>
            <blockquote className="border-l-4 border-flag pl-6 font-serif text-3xl xl:text-4xl text-white leading-snug max-w-xl text-balance">
              {t('"These memories are a part of our national history."', '"এই স্মৃতিগুলি আমাদের জাতীয় ইতিহাসের অংশ।"')}
            </blockquote>
          </div>
        </div>
      </div>

      {/* Right — login form */}
      <div className="relative h-full flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-16 bg-surface overflow-hidden">
        <LangToggle className="absolute top-4 right-4 sm:top-6 sm:right-6" />
        {/* Mobile logo */}
        <MuseumBrand className="lg:hidden mb-8 self-center" compact />

        <div className="max-w-md w-full mx-auto">
          <h1 className="font-serif text-3xl font-semibold text-ink mb-2">{isAdminLogin ? t('Admin sign in', 'অ্যাডমিন সাইন ইন') : isSigningUp ? t('Create public account', 'পাবলিক অ্যাকাউন্ট খুলুন') : t('Sign in', 'সাইন ইন')}</h1>
          <p className="text-ink-muted text-sm mb-5">{isAdminLogin ? t('For archive administrators only.', 'কেবল আর্কাইভ প্রশাসকদের জন্য।') : isSigningUp ? t('Create an account to save stories to your collection.', 'আপনার সংগ্রহে গল্প সংরক্ষণ করতে অ্যাকাউন্ট খুলুন।') : t('Access the Oral History archive system.', 'মৌখিক ইতিহাস আর্কাইভে প্রবেশ করুন।')}</p>
          {!isAdminLogin && <div className="flex gap-5 mb-6 text-sm">
            <button type="button" onClick={() => { setIsSigningUp(false); setNotice(''); }} className={!isSigningUp ? 'font-semibold text-gold' : 'text-ink-muted hover:text-ink'}>{t('Sign in', 'সাইন ইন')}</button>
            <button type="button" onClick={() => { setIsSigningUp(true); setAccountType('public'); setNotice(''); }} className={isSigningUp ? 'font-semibold text-gold' : 'text-ink-muted hover:text-ink'}>{t('Sign up for public account', 'পাবলিক অ্যাকাউন্ট খুলুন')}</button>
          </div>}

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isAdminLogin && <fieldset>
              <legend className="block text-xs font-semibold text-ink-faint uppercase tracking-wider mb-2">
                {t('Account type', 'অ্যাকাউন্টের ধরন')}
              </legend>
              <div className="space-y-2">
                {accountTypes.filter(({ id }) => id !== 'admin' && (!isSigningUp || id === 'public')).map(({ id, name, nameBn, description, descriptionBn }) => (
                  <label
                    key={id}
                    className={`flex items-start gap-3 p-3 border rounded-xl cursor-pointer transition-colors ${
                      accountType === id
                        ? 'border-forest bg-forest-pale'
                        : 'border-line bg-surface-raised hover:border-forest/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="accountType"
                      value={id}
                      checked={accountType === id}
                      onChange={() => {
                        setAccountType(id);
                        setIsSigningUp(false);
                        setNotice('');
                      }}
                      className="mt-0.5 accent-forest"
                    />
                    <span>
                      <span className="block text-sm font-semibold text-ink">{t(name, nameBn)}</span>
                      <span className="block text-xs text-ink-muted mt-0.5">{t(description, descriptionBn)}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>}

            <div>
              <label className="block text-xs font-semibold text-ink-faint uppercase tracking-wider mb-1.5">
                {t('Email address', 'ইমেইল ঠিকানা')}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full bg-surface-raised border border-line rounded-xl px-4 py-3 text-sm text-ink placeholder-muted-light outline-none focus:border-forest focus:ring-1 focus:ring-forest"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-faint uppercase tracking-wider mb-1.5">
                {t('Password', 'পাসওয়ার্ড')}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-surface-raised border border-line rounded-xl px-4 py-3 text-sm text-ink placeholder-muted-light outline-none focus:border-forest focus:ring-1 focus:ring-forest pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? t('Hide password', 'পাসওয়ার্ড লুকান') : t('Show password', 'পাসওয়ার্ড দেখুন')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink-muted"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    {showPassword
                      ? <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1={1} y1={1} x2={23} y2={23} /></>
                      : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx={12} cy={12} r={3} /></>}
                  </svg>
                </button>
              </div>
              <div className="flex justify-end mt-1.5">
                <button type="button" className="text-xs text-gold hover:underline">{t('Forgot password?', 'পাসওয়ার্ড ভুলে গেছেন?')}</button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-forest hover:bg-forest-dark text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {isSigningUp ? t('Create account', 'অ্যাকাউন্ট খুলুন') : t('Sign in', 'সাইন ইন')}
            </button>

            <button
              type="button"
              onClick={() => {
                setEmail('admin@gmail.com');
                setPassword('admin123');
                setAccountType('admin');
                onLogin('admin');
              }}
              className="w-full mt-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold py-2.5 rounded-xl transition-colors text-xs flex items-center justify-center gap-1.5"
            >
              <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
              {t('⚡ One-Click Admin Login (Quick Access)', '⚡ এক-ক্লিকে অ্যাডমিন লগইন')}
            </button>
            {notice && (
              <p role="status" className="text-sm text-ink-muted bg-surface-raised border border-line rounded-xl p-3">
                {notice}
              </p>
            )}
          </form>

          {!isAdminLogin && <div className="mt-4 text-center">
            <button
              onClick={continueAsGuest}
              className="text-sm text-gold hover:underline transition-colors"
            >
              {t('Continue as guest without signing in', 'সাইন ইন না করে অতিথি হিসেবে চালিয়ে যান')}
            </button>
          </div>}

          <div className="mt-3 text-center">
            <button
              onClick={() => navigate('landing')}
              className="text-sm text-ink-muted hover:text-forest transition-colors"
            >
              ← {t('Return to Oral History archive', 'মৌখিক ইতিহাস আর্কাইভে ফিরে যান')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
