import { useState } from 'react';
import { LayoutGrid, LayoutList } from 'lucide-react';
import SalonCalendarModernView from './SalonCalendarModernView';
import { SalonCalendarDayView } from './SalonCalendarDayView';
import { SalonCalendarWeekView } from './SalonCalendarWeekView';

type ViewMode = 'modern' | 'day' | 'week';

export default function SalonCalendarViewSelector() {
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    // Load from localStorage or default to modern
    const saved = localStorage.getItem('salon_calendar_view');
    return (saved as ViewMode) || 'modern';
  });

  const handleViewChange = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem('salon_calendar_view', mode);
  };

  return (
    <div className="space-y-4">
      {/* View Toggle */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Kalendar</h2>
          
          <div className="flex gap-2">
            <button
              onClick={() => handleViewChange('modern')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                viewMode === 'modern'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">Moderan</span>
            </button>
            
            <button
              onClick={() => handleViewChange('day')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                viewMode === 'day'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <LayoutList className="w-4 h-4" />
              <span className="hidden sm:inline">Dan</span>
            </button>
            
            <button
              onClick={() => handleViewChange('week')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                viewMode === 'week'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <LayoutList className="w-4 h-4" />
              <span className="hidden sm:inline">Sedmica</span>
            </button>
          </div>
        </div>
      </div>

      {/* Render Selected View */}
      {viewMode === 'modern' && <SalonCalendarModernView />}
      {viewMode === 'day' && <SalonCalendarDayView />}
      {viewMode === 'week' && <SalonCalendarWeekView />}
    </div>
  );
}
