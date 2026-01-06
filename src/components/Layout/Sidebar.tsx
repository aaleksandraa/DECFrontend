import { 
  Home, 
  Calendar, 
  Users, 
  Settings, 
  BarChart3, 
  MapPin, 
  Star,
  Clock,
  UserCog,
  Building,
  Search,
  Heart,
  ShieldCheck,
  Briefcase,
  Code,
  AlertCircle,
  Upload,
  FileText,
  Grid,
  MessageCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  isPendingSalon?: boolean;
}

export function Sidebar({ activeSection, onSectionChange, isPendingSalon = false }: SidebarProps) {
  const { user } = useAuth();

  const getMenuItems = () => {
    switch (user?.role) {
      case 'admin':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: Home },
          { id: 'salons', label: 'Svi saloni', icon: MapPin },
          { id: 'users', label: 'Korisnici', icon: Users },
          { id: 'import', label: 'Import Termina', icon: Upload },
          { id: 'widgets', label: 'Widget Sistem', icon: Code },
          { id: 'consents', label: 'GDPR Pristanci', icon: ShieldCheck },
          { id: 'job-ads', label: 'Oglasi za posao', icon: Briefcase },
          { id: 'homepage-categories', label: 'Kategorije', icon: Grid },
          { id: 'analytics', label: 'Analitika', icon: BarChart3 },
          { id: 'settings', label: 'Podešavanja', icon: Settings }
        ];
      
      case 'salon':
        // For pending salons, show limited menu
        if (isPendingSalon) {
          return [
            { id: 'dashboard', label: 'Dashboard', icon: Home },
            { id: 'profile', label: 'Profil salona', icon: Building }
          ];
        }
        
        // Full menu for approved salons
        return [
          { id: 'dashboard', label: 'Dashboard', icon: Home },
          { id: 'profile', label: 'Profil salona', icon: Building },
          { id: 'staff', label: 'Zaposleni', icon: Users },
          { id: 'services', label: 'Usluge', icon: Settings },
          { id: 'schedule', label: 'Raspored', icon: Clock },
          { id: 'clients', label: 'Klijenti', icon: UserCog },
          { id: 'calendar', label: 'Kalendar', icon: Calendar },
          { id: 'analytics', label: 'Analitika', icon: BarChart3 },
          { id: 'reviews', label: 'Recenzije', icon: Star },
          { id: 'reports', label: 'Dnevni izvještaji', icon: FileText },
          { id: 'social-integrations', label: 'Instagram/Facebook', icon: MessageCircle },
          { id: 'job-ads', label: 'Oglasi za posao', icon: Briefcase }
        ];
      
      case 'frizer':
        return [
          { id: 'dashboard', label: 'Moji termini', icon: Home },
          { id: 'calendar', label: 'Kalendar', icon: Calendar },
          { id: 'schedule', label: 'Raspored', icon: Clock },
          { id: 'clients', label: 'Klijenti', icon: UserCog },
          { id: 'reviews', label: 'Recenzije', icon: Star },
          { id: 'analytics', label: 'Analitika', icon: BarChart3 },
          { id: 'settings', label: 'Podešavanja', icon: Settings }
        ];
      
      case 'klijent':
        return [
          { id: 'dashboard', label: 'Početna', icon: Home },
          { id: 'search', label: 'Pretraži salone', icon: Search },
          { id: 'appointments', label: 'Moji termini', icon: Calendar },
          { id: 'history', label: 'Istorija', icon: Clock },
          { id: 'favorites', label: 'Omiljeni saloni', icon: Heart },
          { id: 'profile', label: 'Profil', icon: UserCog }
        ];
      
      default:
        return [];
    }
  };

  const menuItems = getMenuItems();

  // Render sidebar on tablets and desktop (md and above)
  // Mobile navigation is handled by MainNavbar
  return (
    <>
      {/* Sidebar - Tablet and Desktop */}
      <aside className="hidden md:block md:static w-48 lg:w-64 bg-white border-r border-gray-200">
        <div className="flex flex-col h-full">
          {/* Pending Salon Notice */}
          {isPendingSalon && (
            <div className="p-4 bg-yellow-50 border-b border-yellow-200">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">Čeka odobrenje</p>
                  <p className="text-xs text-yellow-700 mt-1">
                    Ostale opcije će biti dostupne nakon odobrenja.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 p-4 pt-6 space-y-2 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => onSectionChange(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    activeSection === item.id
                      ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* User Info */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden">
                {user?.staff_profile?.avatar_url || user?.avatar ? (
                  <img 
                    src={user?.staff_profile?.avatar_url || user?.avatar} 
                    alt={user?.name} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {user?.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
