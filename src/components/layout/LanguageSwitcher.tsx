import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { LanguageCode } from '@/types';

const OPTIONS: LanguageCode[] = ['EN', 'HI'];

export function LanguageSwitcher({
  current,
  onChange,
}: {
  current: LanguageCode;
  onChange: (lang: LanguageCode) => Promise<void>;
}) {
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);

  async function select(lang: LanguageCode) {
    if (lang === current || saving) return;
    setSaving(true);
    try {
      await onChange(lang);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      role="group"
      aria-label="Language"
      className="flex items-center rounded-xl border border-slate-200 bg-white/70 p-0.5 text-xs font-semibold"
    >
      {OPTIONS.map((lang) => (
        <button
          key={lang}
          type="button"
          disabled={saving}
          onClick={() => select(lang)}
          className={`rounded-lg px-2.5 py-1 transition-colors ${
            current === lang
              ? 'bg-gradient-to-r from-brand-600 to-accent-600 text-white shadow-glow'
              : 'text-slate-500 hover:bg-brand-50 hover:text-brand-700'
          }`}
        >
          {t(`language.${lang.toLowerCase()}`)}
        </button>
      ))}
    </div>
  );
}
