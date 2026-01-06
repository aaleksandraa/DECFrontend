import React from 'react';
import { Link } from 'react-router-dom';
import { ScissorsIcon } from '@heroicons/react/24/outline';

export const PublicFooter: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-black text-gray-300">
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">

          {/* BRAND */}
          <div className="text-center sm:text-left">
            <Link
              to="/"
              className="flex items-center justify-center sm:justify-start gap-2 mb-4"
            >
              <div className="bg-gradient-to-r from-orange-500 to-pink-500 p-2 rounded-lg">
                <ScissorsIcon className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">Frizerino</span>
            </Link>

            <p className="text-gray-400 text-sm leading-relaxed max-w-xs mx-auto sm:mx-0">
              Pronađite najbolje frizersko-kozmetičke salone u Bosni i Hercegovini.
              Zakažite termin online, brzo i jednostavno.
            </p>
          </div>

          {/* BRZI LINKOVI – MOBILE */}
          <div className="block sm:hidden">
            <h3 className="text-white font-semibold mb-3 text-center">
              Brzi linkovi
            </h3>

            <ul className="flex flex-wrap justify-center gap-3 text-sm text-gray-400">
              <li><Link to="/o-nama" className="hover:text-orange-500">O nama</Link></li>
              <li><Link to="/" className="hover:text-orange-500">Pretraga salona</Link></li>
              <li><Link to="/register?type=salon" className="hover:text-orange-500">Registruj salon</Link></li>
              <li><Link to="/cjenovnik" className="hover:text-orange-500">Cjenovnik</Link></li>
              <li><Link to="/oglasi-za-posao" className="hover:text-orange-500">Oglasi za posao</Link></li>
              <li><Link to="/login" className="hover:text-orange-500">Prijavi se</Link></li>
            </ul>
          </div>

          {/* BRZI LINKOVI – DESKTOP */}
          <div className="hidden sm:block">
            <h3 className="text-white font-semibold mb-4">Brzi linkovi</h3>

            <ul className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm text-gray-400">
              <li><Link to="/o-nama" className="hover:text-orange-500">O nama</Link></li>
              <li><Link to="/" className="hover:text-orange-500">Pretraga salona</Link></li>
              <li><Link to="/register?type=salon" className="hover:text-orange-500">Registruj salon</Link></li>
              <li><Link to="/cjenovnik" className="hover:text-orange-500">Cjenovnik</Link></li>
              <li><Link to="/oglasi-za-posao" className="hover:text-orange-500">Oglasi za posao</Link></li>
              <li><Link to="/login" className="hover:text-orange-500">Prijavi se</Link></li>
            </ul>
          </div>

          {/* POPULARNI GRADOVI */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-center sm:text-left">
              Popularni gradovi
            </h3>

            {/* Mobile – tagovi */}
            <div className="flex flex-wrap justify-center sm:hidden gap-2 text-sm">
              {[
                ['Sarajevo', 'sarajevo'],
                ['Banja Luka', 'banja-luka'],
                ['Tuzla', 'tuzla'],
                ['Mostar', 'mostar'],
                ['Zenica', 'zenica'],
                ['Doboj', 'doboj'],
              ].map(([name, slug]) => (
                <Link
                  key={slug}
                  to={`/saloni/${slug}`}
                  className="px-3 py-1 rounded-full bg-gray-800 text-gray-400 hover:text-orange-500"
                >
                  {name}
                </Link>
              ))}
            </div>

            {/* Desktop – lista */}
            <ul className="hidden sm:grid grid-cols-2 gap-2 text-sm text-gray-400">
              <li><Link to="/saloni/sarajevo" className="hover:text-orange-500">Sarajevo</Link></li>
              <li><Link to="/saloni/banja-luka" className="hover:text-orange-500">Banja Luka</Link></li>
              <li><Link to="/saloni/tuzla" className="hover:text-orange-500">Tuzla</Link></li>
              <li><Link to="/saloni/mostar" className="hover:text-orange-500">Mostar</Link></li>
              <li><Link to="/saloni/zenica" className="hover:text-orange-500">Zenica</Link></li>
              <li><Link to="/saloni/doboj" className="hover:text-orange-500">Doboj</Link></li>
            </ul>
          </div>

          {/* KONTAKT */}
          <div className="text-center sm:text-left text-sm">
            <h3 className="text-white font-semibold mb-4">Kontakt</h3>

            <a
              href="mailto:info@frizerino.com"
              className="block hover:text-orange-500"
            >
              info@frizerino.com
            </a>

            <span className="block text-gray-400 mt-1">
              Bosna i Hercegovina
            </span>

            {/* SOCIAL ICONS */}
            <div className="flex justify-center sm:justify-start gap-4 mt-4">
              {/* Facebook */}
              <a
                href="https://facebook.com/frizerino"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-orange-500"
                aria-label="Facebook"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M18.77 7.46H14.5v-1.9c0-.9.6-1.1 1-1.1h3V.5h-4.33C10.24.5 9.5 3.44 9.5 5.32v2.15h-3v4h3v12h5v-12h3.85l.42-4Z" />
                </svg>
              </a>

              {/* Instagram – ISPRAVNA IKONICA */}
              <a
                href="https://instagram.com/frizerino"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-orange-500"
                aria-label="Instagram"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  viewBox="0 0 24 24"
                >
                  <rect x="3" y="3" width="18" height="18" rx="4" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17" cy="7" r="1" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* BOTTOM BAR */}
        <div className="border-t border-gray-800 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
            <p className="text-sm text-gray-500">
              © {currentYear} Frizerino. Sva prava zadržana.
            </p>

            <div className="flex flex-wrap gap-4 text-sm">
              <Link to="/o-nama" className="hover:text-orange-500">O nama</Link>
              <Link to="/kontakt" className="hover:text-orange-500">Kontakt</Link>
              <Link to="/uslovi-koristenja" className="hover:text-orange-500">Uslovi korištenja</Link>
              <Link to="/politika-privatnosti" className="hover:text-orange-500">Politika privatnosti</Link>
            </div>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default PublicFooter;
