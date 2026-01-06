import React from 'react';
import { Link } from 'react-router-dom';
import { XMarkIcon, HeartIcon } from '@heroicons/react/24/outline';

interface LoginPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  returnTo?: string;
}

export const LoginPromptModal: React.FC<LoginPromptModalProps> = ({
  isOpen,
  onClose,
  returnTo = '/'
}) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div 
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative animate-scale-in"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Zatvori"
          >
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>

          {/* Icon */}
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
              <HeartIcon className="w-8 h-8 text-red-500" />
            </div>
          </div>

          {/* Content */}
          <div className="text-center">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Prijavite se da dodate salon u omiljene
            </h3>
            <p className="text-gray-600 mb-6">
              Morate biti prijavljeni da biste mogli dodati salon na listu omiljenih salona.
            </p>

            {/* Action buttons */}
            <div className="flex flex-col gap-3">
              <Link
                to="/login"
                state={{ returnTo }}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                onClick={onClose}
              >
                Prijavi se
              </Link>
              <button
                onClick={onClose}
                className="w-full text-gray-600 hover:text-gray-800 px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Otkaži
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }
      `}</style>
    </>
  );
};
