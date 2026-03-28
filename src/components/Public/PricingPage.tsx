import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { MainNavbar } from '../Layout/MainNavbar';
import { PublicFooter } from './PublicFooter';
import {
  CheckIcon,
  SparklesIcon,
  UserGroupIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  BellIcon,
  CreditCardIcon,
} from '@heroicons/react/24/outline';

const STANDARD_PROMO_MONTHLY = 20;
const STANDARD_REGULAR_MONTHLY = 30;
const STANDARD_PROMO_DEADLINE = '01.06.2026';
const LARGE_SALON_MONTHLY = 50;

type Package = {
  name: string;
  subtitle: string;
  price: string;
  features: string[];
  cta: string;
  href: string;
  highlighted?: boolean;
};

const standardFeatures = [
  { icon: CalendarDaysIcon, text: 'Online zakazivanje 24/7' },
  { icon: UserGroupIcon, text: 'Upravljanje osobljem i uslugama' },
  { icon: ChartBarIcon, text: 'Analitika i dnevni izvjestaji' },
  { icon: BellIcon, text: 'Automatske notifikacije klijentima' },
  { icon: CreditCardIcon, text: 'Pracenje prometa i naplate' },
  { icon: SparklesIcon, text: 'Javni profil salona i galerija' },
];

const packages: Package[] = [
  {
    name: 'PLUS',
    subtitle: 'Za salone sa 6-10 radnika',
    price: `${LARGE_SALON_MONTHLY} KM / mjesecno`,
    features: [
      'Sve funkcije iz Standard paketa',
      'Prilagodjeno za veci tim',
      'Vise kapaciteta i veci broj termina',
    ],
    cta: 'Pocni besplatno',
    href: '/register',
    highlighted: true,
  },
  {
    name: 'CUSTOM',
    subtitle: 'Za salone sa vise od 10 radnika',
    price: 'Kontakt za ponudu',
    features: [
      'Sve funkcije iz PLUS paketa',
      'Prilagodjena postavka i onboarding',
      'Cijena po dogovoru',
    ],
    cta: 'Kontaktirajte nas',
    href: '/kontakt',
  },
];

const faq = [
  {
    q: 'Koja je cijena za standardni paket?',
    a: `Standard paket je ${STANDARD_PROMO_MONTHLY} KM mjesecno za salone koji se registruju do ${STANDARD_PROMO_DEADLINE}. Nakon tog datuma cijena je ${STANDARD_REGULAR_MONTHLY} KM mjesecno.`,
  },
  {
    q: 'Koliko kosta paket za vece salone?',
    a: `Za salone sa vise od 5 radnika (6-10) cijena je ${LARGE_SALON_MONTHLY} KM mjesecno.`,
  },
  {
    q: 'Sta ako salon ima vise od 10 radnika?',
    a: 'Za salone sa vise od 10 radnika radimo custom ponudu. Kontaktirajte nas za tacnu cijenu.',
  },
  {
    q: 'Da li je potreban ugovor?',
    a: 'Ne. Nema dugorocne ugovorne obaveze i pretplatu mozete prekinuti bilo kada.',
  },
  {
    q: 'Da li je potrebna kreditna kartica za probu?',
    a: 'Ne. Probni period od 30 dana mozete aktivirati bez kartice.',
  },
  {
    q: 'Koliko brzo salon osjeti rezultat?',
    a: 'Najcesce vec u prvoj sedmici: manje poziva, manje praznih termina i bolja organizacija.',
  },
];

export const PricingPage: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Cjenovnik | Frizerino</title>
        <meta
          name="description"
          content="Standard paket 20 KM mjesecno do 01.06.2026, nakon toga 30 KM. Za salone sa 6-10 radnika cijena je 50 KM mjesecno."
        />
        <link rel="canonical" href="https://frizerino.com/cjenovnik" />
      </Helmet>

      <MainNavbar />

      <main className="min-h-screen bg-slate-50">
        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
            <p className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-orange-700">
              <SparklesIcon className="h-4 w-4" />
              Akcijska cijena do {STANDARD_PROMO_DEADLINE}
            </p>
            <h1 className="mt-4 max-w-3xl text-3xl font-bold text-slate-900 sm:text-4xl">
              Cjenovnik bez skrivenih stavki
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
              Standard paket je {STANDARD_PROMO_MONTHLY} KM mjesecno za salone registrovane do {STANDARD_PROMO_DEADLINE}.
              Nakon tog datuma cijena standard paketa je {STANDARD_REGULAR_MONTHLY} KM mjesecno.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 sm:p-5">
            Probni period je 30 dana besplatan: bez kartice, bez ugovora i bez obaveze nastavka.
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 lg:col-span-2">
              <div>
                <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">Standard paket</h2>
                <p className="mt-1 text-sm text-slate-600">Za salone do 5 radnika</p>
              </div>

              <div className="mt-6 rounded-xl border border-orange-100 bg-orange-50 p-4 sm:p-5">
                <p className="text-sm font-medium text-slate-600">Mjesecna cijena</p>
                <div className="mt-2 flex flex-wrap items-end gap-3">
                  <span className="text-4xl font-bold leading-none text-orange-600 sm:text-5xl">
                    {STANDARD_PROMO_MONTHLY} KM
                  </span>
                  <span className="pb-1 text-sm font-semibold text-slate-700">/ mjesecno</span>
                </div>
                <p className="mt-2 text-sm text-slate-600">
                  Vrijedi za registracije do {STANDARD_PROMO_DEADLINE}. Nakon toga cijena je {STANDARD_REGULAR_MONTHLY} KM / mjesecno.
                </p>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {standardFeatures.map((feature) => {
                  const Icon = feature.icon;
                  return (
                    <div
                      key={feature.text}
                      className="flex items-start gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3"
                    >
                      <Icon className="mt-0.5 h-5 w-5 flex-shrink-0 text-orange-600" />
                      <span className="text-sm text-slate-700">{feature.text}</span>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center rounded-xl bg-orange-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-orange-700"
                >
                  Pokreni besplatno
                </Link>
                <Link
                  to="/kontakt"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                >
                  Kontakt prodaja
                </Link>
              </div>
            </div>

            <aside className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
              <h3 className="text-base font-bold text-slate-900">Sta dobijate od prvog dana</h3>
              <ul className="mt-4 space-y-3">
                <li className="flex items-start gap-2 text-sm text-slate-700">
                  <CheckIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600" />
                  Online rezervacije i manje telefonskih poziva
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-700">
                  <CheckIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600" />
                  Jasniji raspored i bolja kontrola termina
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-700">
                  <CheckIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600" />
                  Pregled prometa i dnevnih rezultata
                </li>
              </ul>
              <p className="mt-5 rounded-lg bg-slate-50 p-3 text-xs leading-5 text-slate-600">
                Za salone sa vise od 5 radnika cijena je {LARGE_SALON_MONTHLY} KM mjesecno.
                Za vise od 10 radnika cijena je custom, uz kontakt.
              </p>
            </aside>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-8 sm:px-6 lg:px-8">
          <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">Paketi za vece salone</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {packages.map((pkg) => (
              <article
                key={pkg.name}
                className={`rounded-2xl border bg-white p-5 sm:p-6 ${
                  pkg.highlighted ? 'border-orange-300 shadow-sm' : 'border-slate-200'
                }`}
              >
                <h3 className="text-lg font-bold text-slate-900">{pkg.name}</h3>
                <p className="mt-1 text-sm text-slate-600">{pkg.subtitle}</p>
                <p className="mt-4 text-base font-semibold text-slate-900">{pkg.price}</p>

                <ul className="mt-4 space-y-2">
                  {pkg.features.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-slate-700">
                      <CheckIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600" />
                      {item}
                    </li>
                  ))}
                </ul>

                <Link
                  to={pkg.href}
                  className={`mt-5 inline-flex w-full items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold ${
                    pkg.highlighted
                      ? 'bg-orange-600 text-white hover:bg-orange-700'
                      : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {pkg.cta}
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-8 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
            <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">Cesto postavljana pitanja</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {faq.map((item) => (
                <article key={item.q} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <h3 className="text-sm font-semibold text-slate-900">{item.q}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{item.a}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-12 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-orange-200 bg-orange-50 p-6 text-center sm:p-8">
            <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              Spremni da pojednostavite rezervacije?
            </h2>
            <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
              Aktivirajte besplatni probni period i testirajte Frizerino u svom salonu.
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                to="/register"
                className="inline-flex items-center justify-center rounded-xl bg-orange-600 px-5 py-3 text-sm font-semibold text-white hover:bg-orange-700"
              >
                Isprobaj 30 dana besplatno
              </Link>
              <Link
                to="/kontakt"
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Razgovaraj sa timom
              </Link>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </>
  );
};

export default PricingPage;
