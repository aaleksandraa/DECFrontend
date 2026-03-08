import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  COOKIE_SETTINGS_OPEN_EVENT,
  getCookieConsent,
  saveCookieConsent,
} from '../../utils/cookieConsent';

function formatDateTime(value: string | null): string {
  if (!value) return 'Nije postavljeno';

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Nije postavljeno';

  return parsed.toLocaleString('bs-BA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

type ToggleProps = {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  label: string;
};

function Toggle({ enabled, onChange, label }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label={label}
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
        enabled ? 'bg-blue-500' : 'bg-slate-600'
      }`}
    >
      <span
        className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
          enabled ? 'translate-x-7' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

export function CookieConsentManager() {
  const [isReady, setIsReady] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);
  const [marketingEnabled, setMarketingEnabled] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    const saved = getCookieConsent();

    if (saved) {
      setAnalyticsEnabled(saved.analytics);
      setMarketingEnabled(saved.marketing);
      setLastUpdated(saved.updatedAt);
      setShowBanner(false);
    } else {
      setShowBanner(true);
    }

    const openSettings = () => {
      const current = getCookieConsent();
      if (current) {
        setAnalyticsEnabled(current.analytics);
        setMarketingEnabled(current.marketing);
        setLastUpdated(current.updatedAt);
      }
      setShowModal(true);
    };

    window.addEventListener(COOKIE_SETTINGS_OPEN_EVENT, openSettings);
    setIsReady(true);

    return () => {
      window.removeEventListener(COOKIE_SETTINGS_OPEN_EVENT, openSettings);
    };
  }, []);

  useEffect(() => {
    if (!showModal) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [showModal]);

  const persist = (analytics: boolean, marketing: boolean) => {
    const saved = saveCookieConsent({ analytics, marketing });
    setAnalyticsEnabled(saved.analytics);
    setMarketingEnabled(saved.marketing);
    setLastUpdated(saved.updatedAt);
    setShowBanner(false);
    setShowModal(false);
  };

  const acceptAll = () => {
    persist(true, true);
  };

  const acceptNecessaryOnly = () => {
    persist(false, false);
  };

  if (!isReady) return null;

  return (
    <>
      {showBanner && (
        <div
          className="fixed left-3 right-3 z-[70] rounded-2xl border border-slate-700 bg-slate-900/95 p-4 text-slate-100 shadow-2xl backdrop-blur sm:left-auto sm:right-4 sm:w-[34rem]"
          style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 0.75rem)' }}
        >
          <h3 className="text-lg font-semibold">Kolacici i privatnost</h3>
          <p className="mt-2 text-sm text-slate-300">
            Koristimo neophodne kolacice za rad platforme. Analiticki kolacici
            (Google Analytics) se ucitavaju samo uz vas pristanak.
          </p>

          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
            <button
              type="button"
              onClick={acceptAll}
              className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-600"
            >
              Prihvati sve
            </button>
            <button
              type="button"
              onClick={acceptNecessaryOnly}
              className="rounded-lg border border-slate-500 bg-slate-800/80 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-slate-700"
            >
              Samo neophodni
            </button>
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="rounded-lg border border-blue-400/60 bg-blue-500/10 px-4 py-2 text-sm font-semibold text-blue-200 transition hover:bg-blue-500/20"
            >
              Postavke kolacica
            </button>
          </div>
        </div>
      )}

      {showModal && (
        <div
          className="fixed inset-0 z-[80] flex items-end justify-center bg-black/70 px-2 py-2 sm:items-center sm:px-4 sm:py-6"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 0.5rem)' }}
        >
          <div
            className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-2xl border border-slate-700 bg-slate-950 p-4 text-slate-100 shadow-2xl sm:max-h-[90vh] sm:p-8"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold sm:text-3xl">Postavke kolacica</h2>
                <p className="mt-3 text-sm text-slate-300 sm:text-base">
                  Upravljajte svojim postavkama kolacica. Mozete ih promijeniti u
                  bilo kojem trenutku preko futera.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                aria-label="Zatvori postavke kolacica"
                className="rounded-lg border border-slate-600 px-3 py-2 text-lg leading-none text-slate-200 transition hover:bg-slate-800"
              >
                ×
              </button>
            </div>

            <div className="mt-6 rounded-2xl border border-slate-700 bg-slate-900 p-4 sm:p-6">
              <h3 className="text-xl font-semibold sm:text-2xl">Trenutne postavke</h3>
              <p className="mt-2 text-sm text-slate-400">
                Posljednje azurirano: {formatDateTime(lastUpdated)}
              </p>

              <div className="mt-6 border-b border-slate-700 pb-6 sm:mt-8">
                <div className="flex items-center justify-between gap-3">
                  <h4 className="text-xl font-semibold sm:text-2xl">Neophodni kolacici</h4>
                  <span className="rounded-lg bg-slate-700 px-3 py-2 text-sm font-medium text-slate-200">
                    Uvijek aktivno
                  </span>
                </div>
                <p className="mt-3 text-base text-slate-300 sm:text-lg">
                  Ovi kolacici su neophodni za pravilno funkcionisanje platforme
                  i bez njih stranica ne moze raditi.
                </p>
                <p className="mt-3 text-sm text-slate-400">
                  Cookies used: session_id, csrf_token, locale
                </p>
              </div>

              <div className="mt-6 border-b border-slate-700 pb-6">
                <div className="flex items-center justify-between gap-3">
                  <h4 className="text-xl font-semibold sm:text-2xl">Analiticki kolacici</h4>
                  <Toggle
                    enabled={analyticsEnabled}
                    onChange={setAnalyticsEnabled}
                    label="Analiticki kolacici"
                  />
                </div>
                <p className="mt-3 text-base text-slate-300 sm:text-lg">
                  Pomazu nam da anonimno mjerimo posjete i poboljsamo iskustvo
                  korisnika.
                </p>
                <p className="mt-3 text-sm text-slate-400">
                  Cookies used: _ga, _gid, _gat (Google Analytics)
                </p>
                <p className="mt-2 text-sm text-slate-400">
                  Google Search Console koristimo za SEO izvjestaje i ne postavlja
                  dodatne kolacice u browseru.
                </p>
              </div>

              <div className="mt-6">
                <div className="flex items-center justify-between gap-3">
                  <h4 className="text-xl font-semibold sm:text-2xl">Marketing kolacici</h4>
                  <Toggle
                    enabled={marketingEnabled}
                    onChange={setMarketingEnabled}
                    label="Marketing kolacici"
                  />
                </div>
                <p className="mt-3 text-base text-slate-300 sm:text-lg">
                  Koriste se za personalizovane marketinske kampanje ako ih
                  u buducnosti ukljucimo.
                </p>
                <p className="mt-3 text-sm text-slate-400">
                  Cookies used: trenutno nisu aktivni
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={acceptNecessaryOnly}
                  className="rounded-lg border border-slate-500 bg-slate-800/80 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-slate-700"
                >
                  Odbij opcione
                </button>
                <button
                  type="button"
                  onClick={acceptAll}
                  className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-600"
                >
                  Prihvati sve
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-slate-800"
                >
                  Zatvori
                </button>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <Link
                  to="/politika-privatnosti"
                  className="rounded-lg border border-blue-400/60 px-4 py-2 text-center text-sm font-semibold text-blue-300 transition hover:bg-blue-500/10"
                  onClick={() => setShowModal(false)}
                >
                  Politika privatnosti
                </Link>

                <button
                  type="button"
                  onClick={() => persist(analyticsEnabled, marketingEnabled)}
                  className="rounded-xl bg-white px-6 py-3 text-lg font-semibold text-slate-900 transition hover:bg-slate-100"
                >
                  Sacuvaj promjene
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
