import React, { useState, useMemo } from 'react';
import { Search, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Service } from '../../types';

interface ServiceSelectorProps {
  services: Service[];
  selectedServiceId: string;
  onSelect: (serviceId: string) => void;
  label?: string;
  excludeZeroDuration?: boolean;
}

export const ServiceSelector: React.FC<ServiceSelectorProps> = ({
  services,
  selectedServiceId,
  onSelect,
  label = 'Izaberite uslugu',
  excludeZeroDuration = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Filter services
  const filteredServices = useMemo(() => {
    let filtered = services;

    // Exclude zero duration if needed
    if (excludeZeroDuration) {
      const before = filtered.length;
      filtered = filtered.filter(s => Number(s.duration) > 0);
      console.log('[ServiceSelector] excludeZeroDuration: filtered from', before, 'to', filtered.length, 'services');
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.category?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [services, searchTerm, excludeZeroDuration]);

  // Group services by category
  const servicesByCategory = useMemo(() => {
    const grouped = new Map<string, Service[]>();

    filteredServices.forEach(service => {
      const category = service.category || 'Ostalo';
      if (!grouped.has(category)) {
        grouped.set(category, []);
      }
      grouped.get(category)!.push(service);
    });

    // Sort categories alphabetically, but keep "Ostalo" at the end
    const sortedEntries = Array.from(grouped.entries()).sort((a, b) => {
      if (a[0] === 'Ostalo') return 1;
      if (b[0] === 'Ostalo') return -1;
      return a[0].localeCompare(b[0]);
    });

    return new Map(sortedEntries);
  }, [filteredServices]);

  // Get selected service
  const selectedService = services.find(s => String(s.id) === selectedServiceId);

  // Toggle category expansion
  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  // Expand all categories when searching
  React.useEffect(() => {
    if (searchTerm) {
      setExpandedCategories(new Set(Array.from(servicesByCategory.keys())));
    }
  }, [searchTerm, servicesByCategory]);

  const handleSelect = (serviceId: string) => {
    onSelect(serviceId);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className="relative">
      {/* Selected Service Display / Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white text-left flex items-center justify-between hover:border-orange-400 transition-colors"
      >
        <span className={selectedService ? 'text-gray-900' : 'text-gray-500'}>
          {selectedService ? (
            <>
              {selectedService.name} - {selectedService.discount_price || selectedService.price} KM ({selectedService.duration} min)
            </>
          ) : (
            label
          )}
        </span>
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown Content */}
          <div className="absolute z-20 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-hidden flex flex-col">
            {/* Search Bar */}
            <div className="p-3 border-b border-gray-200 sticky top-0 bg-white">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Pretražite usluge..."
                  className="w-full pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                  autoFocus
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Services List */}
            <div className="overflow-y-auto">
              {servicesByCategory.size === 0 ? (
                <div className="p-4 text-center text-gray-500 text-sm">
                  Nema pronađenih usluga
                </div>
              ) : (
                Array.from(servicesByCategory.entries()).map(([category, categoryServices]) => (
                  <div key={category} className="border-b border-gray-100 last:border-b-0">
                    {/* Category Header */}
                    <button
                      onClick={() => toggleCategory(category)}
                      className="w-full px-4 py-2 bg-gray-50 hover:bg-gray-100 flex items-center justify-between text-sm font-medium text-gray-700 transition-colors"
                    >
                      <span>{category} ({categoryServices.length})</span>
                      {expandedCategories.has(category) ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>

                    {/* Category Services */}
                    {expandedCategories.has(category) && (
                      <div className="divide-y divide-gray-100">
                        {categoryServices.map((service) => (
                          <button
                            key={service.id}
                            onClick={() => handleSelect(String(service.id))}
                            className={`w-full px-4 py-3 text-left hover:bg-orange-50 transition-colors ${
                              String(service.id) === selectedServiceId ? 'bg-orange-50 border-l-4 border-orange-500' : ''
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 truncate">{service.name}</p>
                                {service.description && (
                                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{service.description}</p>
                                )}
                              </div>
                              <div className="flex flex-col items-end flex-shrink-0">
                                <span className="text-sm font-semibold text-orange-600">
                                  {service.discount_price || service.price} KM
                                </span>
                                <span className="text-xs text-gray-500">{service.duration} min</span>
                                {Number(service.duration) === 0 && (
                                  <span className="text-xs text-gray-400 italic">(dodatak)</span>
                                )}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
