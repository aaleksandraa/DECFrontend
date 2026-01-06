import React, { useState } from 'react';
import { Search, MapPin, Star, Clock, Filter } from 'lucide-react';
import { mockSalons, mockServices, mockStaff } from '../../data/mockData';

export function SalonSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const cities = ['Beograd', 'Novi Sad', 'Niš', 'Kragujevac'];
  const serviceCategories = ['Šišanje', 'Farbanje', 'Nega', 'Styling'];

  const filteredSalons = mockSalons.filter(salon => {
    const matchesSearch = salon.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         salon.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCity = !selectedCity || salon.city === selectedCity;
    // For demo purposes, we'll show all salons
    return matchesSearch && matchesCity;
  });

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-4">Pronađite savršen salon</h1>
        <p className="text-blue-100 mb-6">Rezervišite termin u najboljem salonu u vašem gradu</p>
        
        {/* Search Bar */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Pretražite salone ili usluge..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-lg text-gray-900 focus:ring-2 focus:ring-white focus:outline-none"
            />
          </div>
          
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="pl-10 pr-8 py-3 rounded-lg text-gray-900 focus:ring-2 focus:ring-white focus:outline-none appearance-none bg-white"
            >
              <option value="">Svi gradovi</option>
              {cities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-6 py-3 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-colors"
          >
            <Filter className="w-5 h-5" />
            Filteri
          </button>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mt-4 p-4 bg-white bg-opacity-10 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Tip usluge</label>
                <select
                  value={selectedService}
                  onChange={(e) => setSelectedService(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-gray-900"
                >
                  <option value="">Sve usluge</option>
                  {serviceCategories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Ocena</label>
                <select className="w-full px-3 py-2 rounded-lg text-gray-900">
                  <option value="">Sve ocene</option>
                  <option value="4.5">4.5+ ⭐</option>
                  <option value="4.0">4.0+ ⭐</option>
                  <option value="3.5">3.5+ ⭐</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Cena</label>
                <select className="w-full px-3 py-2 rounded-lg text-gray-900">
                  <option value="">Sve cene</option>
                  <option value="low">Do 3000 RSD</option>
                  <option value="mid">3000-5000 RSD</option>
                  <option value="high">Preko 5000 RSD</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSalons.map(salon => (
          <div key={salon.id} className="bg-white rounded-xl shadow-sm border hover:shadow-lg transition-all duration-300 overflow-hidden">
            <div className="relative h-48">
              <img
                src={salon.images[0]}
                alt={salon.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 right-3 bg-white px-2 py-1 rounded-full flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <span className="text-sm font-medium">{salon.rating}</span>
              </div>
            </div>
            
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">{salon.name}</h3>
              <div className="flex items-center gap-2 text-gray-600 mb-3">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">{salon.address}, {salon.city}</span>
              </div>
              
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">{salon.description}</p>
              
              <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>Radno vreme: 9:00-19:00</span>
                </div>
                <span>{salon.reviewCount} recenzija</span>
              </div>
              
              <div className="flex gap-2 mb-4">
                {mockServices.slice(0, 2).map(service => (
                  <span
                    key={service.id}
                    className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full"
                  >
                    {service.name}
                  </span>
                ))}
                {mockServices.length > 2 && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                    +{mockServices.length - 2} više
                  </span>
                )}
              </div>
              
              <button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 px-4 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium">
                Rezerviši termin
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredSalons.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">Nema rezultata</h3>
          <p className="text-gray-600">Pokušajte sa drugačijim kriterijumima pretrage</p>
        </div>
      )}
    </div>
  );
}