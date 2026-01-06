import React from 'react';
import { 
  Search, 
  FileQuestion, 
  AlertCircle, 
  Inbox, 
  Calendar,
  Scissors,
  Star,
  Bell,
} from 'lucide-react';

type EmptyStateVariant = 
  | 'default' 
  | 'search' 
  | 'error' 
  | 'no-data'
  | 'appointments'
  | 'salons'
  | 'services'
  | 'reviews'
  | 'notifications';

export interface EmptyStateProps {
  variant?: EmptyStateVariant;
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

/**
 * Reusable Empty State Component
 * 
 * Features:
 * - Multiple variants for different contexts
 * - Custom icons
 * - Action button
 * - Accessible
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  variant = 'default',
  title,
  description,
  icon,
  action,
  className = '',
}) => {
  const variants: Record<EmptyStateVariant, { 
    icon: React.ReactNode; 
    title: string; 
    description: string;
  }> = {
    default: {
      icon: <Inbox className="w-12 h-12 text-gray-400" />,
      title: 'Nema podataka',
      description: 'Trenutno nema podataka za prikaz.',
    },
    search: {
      icon: <Search className="w-12 h-12 text-gray-400" />,
      title: 'Nema rezultata',
      description: 'Nije pronađen nijedan rezultat za vašu pretragu. Pokušajte sa drugim pojmom.',
    },
    error: {
      icon: <AlertCircle className="w-12 h-12 text-red-400" />,
      title: 'Došlo je do greške',
      description: 'Nešto je pošlo po zlu. Molimo pokušajte ponovo.',
    },
    'no-data': {
      icon: <FileQuestion className="w-12 h-12 text-gray-400" />,
      title: 'Nema podataka',
      description: 'Još uvijek nema podataka. Počnite dodavanjem novog unosa.',
    },
    appointments: {
      icon: <Calendar className="w-12 h-12 text-gray-400" />,
      title: 'Nema termina',
      description: 'Nemate zakazanih termina. Zakažite novi termin da biste ga vidjeli ovdje.',
    },
    salons: {
      icon: <Scissors className="w-12 h-12 text-gray-400" />,
      title: 'Nema salona',
      description: 'Nema pronađenih salona. Pokušajte promijeniti filtere pretrage.',
    },
    services: {
      icon: <Scissors className="w-12 h-12 text-gray-400" />,
      title: 'Nema usluga',
      description: 'Ovaj salon još nema dodanih usluga.',
    },
    reviews: {
      icon: <Star className="w-12 h-12 text-gray-400" />,
      title: 'Nema recenzija',
      description: 'Ovaj salon još nema recenzija. Budite prvi koji će ostaviti recenziju!',
    },
    notifications: {
      icon: <Bell className="w-12 h-12 text-gray-400" />,
      title: 'Nema notifikacija',
      description: 'Nemate novih notifikacija. Ovdje ćete vidjeti sve obavijesti o terminima.',
    },
  };

  const currentVariant = variants[variant];

  return (
    <div 
      className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}
      role="status"
      aria-label={title || currentVariant.title}
    >
      <div className="mb-4">
        {icon || currentVariant.icon}
      </div>
      
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {title || currentVariant.title}
      </h3>
      
      <p className="text-gray-500 max-w-sm mb-6">
        {description || currentVariant.description}
      </p>
      
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

// Specialized empty states
export const NoSearchResults: React.FC<{ onReset?: () => void }> = ({ onReset }) => (
  <EmptyState
    variant="search"
    action={onReset ? { label: 'Resetuj pretragu', onClick: onReset } : undefined}
  />
);

export const NoAppointments: React.FC<{ onBook?: () => void }> = ({ onBook }) => (
  <EmptyState
    variant="appointments"
    action={onBook ? { label: 'Zakaži termin', onClick: onBook } : undefined}
  />
);

export const NoSalons: React.FC<{ onReset?: () => void }> = ({ onReset }) => (
  <EmptyState
    variant="salons"
    action={onReset ? { label: 'Resetuj filtere', onClick: onReset } : undefined}
  />
);

export const NoNotifications: React.FC = () => (
  <EmptyState variant="notifications" />
);

export const ErrorState: React.FC<{ onRetry?: () => void; message?: string }> = ({ 
  onRetry,
  message,
}) => (
  <EmptyState
    variant="error"
    description={message}
    action={onRetry ? { label: 'Pokušaj ponovo', onClick: onRetry } : undefined}
  />
);

export default EmptyState;
