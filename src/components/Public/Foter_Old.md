import React from 'react';
import { Link } from 'react-router-dom';
import { ScissorsIcon } from '@heroicons/react/24/outline';

export const PublicFooter: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-black text-gray-300">
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="bg-gradient-to-r from-orange-500 to-pink-500 p-2 rounded-lg">
                <ScissorsIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold text-white">Frizerino</span>
              </div>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed mb-4">
              Pronađite najbolje frizersko-kozmetičke salone u Bosni i Hercegovini. 
              Zakažite termin online, brzo i jednostavno.
            </p>
            <a 
              href="https://frizerino.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-orange-500 hover:text-orange-400 transition-colors text-sm font-medium"
            >
              www.frizerino.com
            </a>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Brzi linkovi</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-400 hover:text-orange-500 transition-colors text-sm">
                  Početna
                </Link>
              </li>
              <li>
                <Link to="/o-nama" className="text-gray-400 hover:text-orange-500 transition-colors text-sm">
                  O nama
                </Link>
              </li>
              <li>
                <Link to="/" className="text-gray-400 hover:text-orange-500 transition-colors text-sm">
                  Pretraga salona
                </Link>
              </li>
              <li>
                <Link to="/register?type=salon" className="text-gray-400 hover:text-orange-500 transition-colors text-sm">
                  Registruj salon
                </Link>
              </li>
              <li>
                <Link to="/cjenovnik" className="text-gray-400 hover:text-orange-500 transition-colors text-sm">
                  Cjenovnik
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-gray-400 hover:text-orange-500 transition-colors text-sm">
                  Prijava
                </Link>
              </li>
              <li>
                <Link to="/oglasi-za-posao" className="text-gray-400 hover:text-orange-500 transition-colors text-sm">
                  Oglasi za posao
                </Link>
              </li>
            </ul>
          </div>

          {/* Popular Cities */}
          <div>
            <h3 className="text-white font-semibold mb-4">Popularni gradovi</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/saloni/sarajevo" className="text-gray-400 hover:text-orange-500 transition-colors text-sm">
                  Saloni u Sarajevu
                </Link>
              </li>
              <li>
                <Link to="/saloni/banja-luka" className="text-gray-400 hover:text-orange-500 transition-colors text-sm">
                  Saloni u Banjoj Luci
                </Link>
              </li>
              <li>
                <Link to="/saloni/tuzla" className="text-gray-400 hover:text-orange-500 transition-colors text-sm">
                  Saloni u Tuzli
                </Link>
              </li>
              <li>
                <Link to="/saloni/mostar" className="text-gray-400 hover:text-orange-500 transition-colors text-sm">
                  Saloni u Mostaru
                </Link>
              </li>
              <li>
                <Link to="/saloni/zenica" className="text-gray-400 hover:text-orange-500 transition-colors text-sm">
                  Saloni u Zenici
                </Link>
              </li>
              <li>
                <Link to="/saloni/doboj" className="text-gray-400 hover:text-orange-500 transition-colors text-sm">
                  Saloni u Doboju
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4">Kontakt</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <a href="mailto:info@frizerino.com" className="hover:text-orange-500 transition-colors">
                  info@frizerino.com
                </a>
              </li>
              <li>
                <a href="https://frizerino.com" target="_blank" rel="noopener noreferrer" className="hover:text-orange-500 transition-colors">
                  www.frizerino.com
                </a>
              </li>
              <li className="pt-2">
                Bosna i Hercegovina
              </li>
            </ul>

            {/* Social Links */}
            <div className="flex gap-4 mt-4">
              <a 
                href="https://facebook.com/frizerino" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-orange-500 transition-colors"
                aria-label="Facebook"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.77,7.46H14.5v-1.9c0-.9.6-1.1,1-1.1h3V.5h-4.33C10.24.5,9.5,3.44,9.5,5.32v2.15h-3v4h3v12h5v-12h3.85l.42-4Z"/>
                </svg>
              </a>
              <a 
                href="https://instagram.com/frizerino" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-orange-500 transition-colors"
                aria-label="Instagram"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12,2.16c3.2,0,3.58,0,4.85.07,3.25.15,4.77,1.69,4.92,4.92.06,1.27.07,1.65.07,4.85s0,3.58-.07,4.85c-.15,3.23-1.66,4.77-4.92,4.92-1.27.06-1.65.07-4.85.07s-3.58,0-4.85-.07c-3.26-.15-4.77-1.7-4.92-4.92-.06-1.27-.07-1.65-.07-4.85s0-3.58.07-4.85C2.38,3.92,3.9,2.38,7.15,2.23,8.42,2.18,8.8,2.16,12,2.16ZM12,0C8.74,0,8.33,0,7.05.07c-4.35.2-6.78,2.62-7,7C0,8.33,0,8.74,0,12s0,3.67.07,4.95c.2,4.36,2.62,6.78,7,7C8.33,24,8.74,24,12,24s3.67,0,4.95-.07c4.35-.2,6.78-2.62,7-7C24,15.67,24,15.26,24,12s0-3.67-.07-4.95c-.2-4.35-2.62-6.78-7-7C15.67,0,15.26,0,12,0Zm0,5.84A6.16,6.16,0,1,0,18.16,12,6.16,6.16,0,0,0,12,5.84ZM12,16a4,4,0,1,1,4-4A4,4,0,0,1,12,16ZM18.41,4.15a1.44,1.44,0,1,0,1.44,1.44A1.44,1.44,0,0,0,18.41,4.15Z"/>
                </svg>
              </a>
              <a 
                href="https://tiktok.com/@frizerino" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-orange-500 transition-colors"
                aria-label="TikTok"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-500">
              © {currentYear} Frizerino. Sva prava zadržana.
            </p>
            <div className="flex flex-wrap gap-4 md:gap-6 text-sm">
              <Link to="/o-nama" className="text-gray-500 hover:text-orange-500 transition-colors">
                O nama
              </Link>
              <Link to="/kontakt" className="text-gray-500 hover:text-orange-500 transition-colors">
                Kontakt
              </Link>
              <Link to="/uslovi-koristenja" className="text-gray-500 hover:text-orange-500 transition-colors">
                Uslovi korištenja
              </Link>
              <Link to="/politika-privatnosti" className="text-gray-500 hover:text-orange-500 transition-colors">
                Politika privatnosti
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default PublicFooter;
