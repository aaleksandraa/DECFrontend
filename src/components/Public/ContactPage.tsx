import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { MainNavbar } from '../Layout/MainNavbar';
import { PublicFooter } from './PublicFooter';
import { publicAPI } from '../../services/api';
import { 
  EnvelopeIcon,
  CheckCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';

interface ContactForm {
  name: string;
  email: string;
  subject: string;
  message: string;
  honeypot: string; // Anti-spam honeypot field
}

export const ContactPage: React.FC = () => {
  const [form, setForm] = useState<ContactForm>({
    name: '',
    email: '',
    subject: '',
    message: '',
    honeypot: '' // Hidden field for bots
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formStartTime] = useState<number>(Date.now()); // Track when form was loaded

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Anti-spam: Check honeypot field (should be empty)
    if (form.honeypot) {
      // Bot detected - silently fail
      setSuccess(true);
      return;
    }

    // Anti-spam: Check minimum time (prevent instant submissions)
    const timeSinceLoad = Date.now() - formStartTime;
    if (timeSinceLoad < 3000) { // Less than 3 seconds
      setError('Molimo sačekajte trenutak prije slanja forme');
      return;
    }
    
    if (!form.name || !form.email || !form.message) {
      setError('Molimo popunite sva obavezna polja');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await publicAPI.sendContactForm({
        name: form.name,
        email: form.email,
        subject: form.subject,
        message: form.message
      });
      
      setSuccess(true);
      setForm({ name: '', email: '', subject: '', message: '', honeypot: '' });
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || 
                          'Greška pri slanju poruke. Pokušajte ponovo ili nas kontaktirajte direktno na podrska@frizerino.com';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Kontakt | Frizerino – Online zakazivanje frizera i salona</title>
        <meta name="description" content="Kontaktirajte Frizerino tim za pitanja o online zakazivanju frizera, registraciji salona ili tehničkoj podršci. Odgovaramo u roku od 24 sata." />
        <link rel="canonical" href="https://frizerino.com/kontakt" />
        
        {/* Schema.org - ContactPage */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ContactPage",
            "name": "Kontakt - Frizerino",
            "description": "Kontaktirajte Frizerino tim za pitanja o online zakazivanju frizera, registraciji salona ili tehničkoj podršci.",
            "url": "https://frizerino.com/kontakt"
          })}
        </script>

        {/* Schema.org - Organization with ContactPoint */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "Frizerino",
            "url": "https://frizerino.com",
            "logo": "https://frizerino.com/logo.png",
            "description": "Online platforma za zakazivanje termina u frizerskim i kozmetičkim salonima širom Bosne i Hercegovine",
            "contactPoint": {
              "@type": "ContactPoint",
              "contactType": "customer support",
              "email": "info@frizerino.com",
              "availableLanguage": ["bs", "hr", "sr"],
              "areaServed": "BA"
            },
            "sameAs": [
              "https://www.facebook.com/frizerino",
              "https://www.instagram.com/frizerino"
            ]
          })}
        </script>
      </Helmet>

      <MainNavbar />

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Kontaktirajte Nas
            </h1>
            <p className="text-xl text-orange-100 max-w-2xl mx-auto">
              Imate pitanja? Tu smo da vam pomognemo. Pišite nam ili nas nazovite.
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* FAQ Section */}
            <div className="space-y-8">
              {/* Email Contact */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="bg-orange-100 p-3 rounded-lg">
                    <EnvelopeIcon className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Email</h3>
                    <p className="text-gray-600">
                      <a href="mailto:info@frizerino.com" className="hover:text-orange-600">
                        info@frizerino.com
                      </a>
                    </p>
                  </div>
                </div>
                <p className="text-sm text-gray-500">
                  Odgovaramo u roku od 24 sata radnim danima
                </p>
              </div>

              {/* FAQ Preview */}
              <div className="bg-orange-50 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Najčešća pitanja</h3>
                <div className="space-y-4">
                  <div>
                    <Link to="/pomoc/kako-zakazati-termin" className="text-orange-600 hover:text-orange-700 font-medium block mb-1">
                      Kako funkcioniše online zakazivanje termina?
                    </Link>
                    <p className="text-sm text-gray-600">
                      Pretražite salone, izaberite uslugu i termin koji vam odgovara. Potvrda stiže odmah.
                    </p>
                  </div>

                  <div className="border-t border-orange-200 pt-4">
                    <Link to="/pomoc/kako-zakazati-termin" className="text-orange-600 hover:text-orange-700 font-medium block mb-1">
                      Da li je rezervacija besplatna za klijente?
                    </Link>
                    <p className="text-sm text-gray-600">
                      Da, zakazivanje termina je potpuno besplatno. Plaćate samo uslugu u salonu.
                    </p>
                  </div>

                  <div className="border-t border-orange-200 pt-4">
                    <Link to="/pomoc/kako-registrovati-salon" className="text-orange-600 hover:text-orange-700 font-medium block mb-1">
                      Kako registrovati frizerski salon?
                    </Link>
                    <p className="text-sm text-gray-600">
                      Registracija je jednostavna - popunite osnovne podatke i počnite primati rezervacije.
                    </p>
                  </div>

                  <div className="border-t border-orange-200 pt-4">
                    <Link to="/pomoc/kako-otkazati-rezervaciju" className="text-orange-600 hover:text-orange-700 font-medium block mb-1">
                      Kako otkazati termin?
                    </Link>
                    <p className="text-sm text-gray-600">
                      Otkazivanje je moguće do 24 sata prije termina kroz vaš profil ili kontaktiranjem salona.
                    </p>
                  </div>

                  <div className="border-t border-orange-200 pt-4">
                    <Link to="/cjenovnik" className="text-orange-600 hover:text-orange-700 font-medium block mb-1">
                      Koliko košta korištenje platforme?
                    </Link>
                    <p className="text-sm text-gray-600">
                      Prvi mjesec je besplatan. Zatim 15 KM mjesečno (ili 10 KM ako platite godišnje unaprijed).
                    </p>
                  </div>
                </div>

                <Link 
                  to="/pomoc/kako-zakazati-termin" 
                  className="block mt-4 text-center text-orange-600 hover:text-orange-700 font-medium text-sm"
                >
                  Pogledaj sve FAQ →
                </Link>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              {/* Info Block Above Form */}
              <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-6 mb-6 border border-orange-100">
                <h2 className="text-xl font-bold text-gray-900 mb-3">
                  Kako vam možemo pomoći?
                </h2>
                <p className="text-gray-700 mb-4">
                  Pišite nam ako imate pitanje o zakazivanju termina, registraciji salona, tehničkoj podršci ili saradnji.
                </p>
                <div className="flex items-center gap-2 text-orange-700">
                  <CheckCircleIcon className="w-5 h-5 flex-shrink-0" />
                  <span className="font-medium">Na većinu upita odgovaramo u roku od 24 sata</span>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Pošaljite nam poruku
                </h2>

                {success ? (
                  <div className="text-center py-12">
                    <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Poruka uspješno poslana!
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Hvala vam na poruci. Odgovorit ćemo vam u najkraćem mogućem roku.
                    </p>
                    <button
                      onClick={() => setSuccess(false)}
                      className="text-orange-600 hover:text-orange-700 font-medium"
                    >
                      Pošalji novu poruku
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Honeypot field - hidden from users, visible to bots */}
                    <div style={{ position: 'absolute', left: '-9999px' }} aria-hidden="true">
                      <label htmlFor="website">Website (leave blank)</label>
                      <input
                        type="text"
                        id="website"
                        name="website"
                        value={form.honeypot}
                        onChange={(e) => setForm({ ...form, honeypot: e.target.value })}
                        tabIndex={-1}
                        autoComplete="off"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Ime i prezime *
                        </label>
                        <input
                          type="text"
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                          placeholder="Vaše ime"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email adresa *
                        </label>
                        <input
                          type="email"
                          value={form.email}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                          placeholder="vas@email.com"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tema
                      </label>
                      <select
                        value={form.subject}
                        onChange={(e) => setForm({ ...form, subject: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      >
                        <option value="">Izaberite temu</option>
                        <option value="general">Opšto pitanje</option>
                        <option value="salon">Registracija salona</option>
                        <option value="booking">Pitanje o rezervaciji</option>
                        <option value="technical">Tehnička podrška</option>
                        <option value="partnership">Saradnja</option>
                        <option value="other">Ostalo</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Poruka *
                      </label>
                      <textarea
                        value={form.message}
                        onChange={(e) => setForm({ ...form, message: e.target.value })}
                        rows={6}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
                        placeholder="Napišite vašu poruku..."
                      />
                    </div>

                    {error && (
                      <div className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-3 rounded-lg">
                        <ExclamationCircleIcon className="w-5 h-5" />
                        <span>{error}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full md:w-auto bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white px-8 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                    >
                      {loading && (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      )}
                      {loading ? 'Slanje...' : 'Pošalji poruku'}
                    </button>

                    {/* Privacy Notice */}
                    <p className="text-sm text-gray-500 mt-4">
                      Odgovaramo u roku od 24 sata radnim danima. Vaši podaci se koriste isključivo za odgovor na upit.
                    </p>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <PublicFooter />
    </>
  );
};

export default ContactPage;
