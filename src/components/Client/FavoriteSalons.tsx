import React, { useState, useEffect } from 'react';
import { Heart, Star, MapPin, Calendar, Trash2, Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { favoriteAPI } from '../../services/api';

export function FavoriteSalons() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadFavorites();
  }, [user]);

  const loadFavorites = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const response = await favoriteAPI.getFavorites();
      setFavorites(response);
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (salonId: string) => {
    if (!user) return;

    try {
      await favoriteAPI.removeFavorite(salonId);
      setFavorites(prev => prev.filter(fav => fav.id !== salonId));
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  };

  const filteredFavorites = favorites.filter(salon => 
    salon.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    salon.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Učitavanje...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto px-4 sm:px-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Omiljeni saloni</h1>
          <p className="text-gray-600">Vaši omiljeni saloni za brzu rezervaciju</p>
        </div>
        
        <button
          onClick={() => navigate('/pretraga')}
          className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-2 rounded-lg hover:from-orange-600 hover:to-red-600 transition-all"
        >
          Pronađi nove salone
        </button>
      </div>

      {/* Search */}
      {favorites.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Pretražite omiljene salone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
        </div>
      )}

      {/* Favorites Grid */}
      {filteredFavorites.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFavorites.map((salon) => (
            <div key={salon.id} className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-all duration-200 overflow-hidden">
              <div 
                className="relative h-48 cursor-pointer"
                onClick={() => navigate(`/salon/${salon.slug || salon.id}`)}
              >
                <img
                  src={salon.images && salon.images.length > 0 ? salon.images[0].url : 'https://images.pexels.com/photos/3065171/pexels-photo-3065171.jpeg'}
                  alt={salon.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.pexels.com/photos/3065171/pexels-photo-3065171.jpeg';
                  }}
                />
                <div className="absolute top-3 right-3 flex gap-2">
                  <div className="bg-white px-2 py-1 rounded-full flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="text-sm font-medium">{salon.rating}</span>
                  </div>
                  <button
                    onClick={() => removeFavorite(salon.id)}
                    className="bg-white p-2 rounded-full hover:bg-red-50 transition-colors group"
                  >
                    <Heart className="w-4 h-4 text-red-500 fill-current group-hover:text-red-600" />
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                <h3 
                  className="text-xl font-bold text-gray-900 mb-2 cursor-pointer hover:text-orange-600 transition-colors"
                  onClick={() => navigate(`/salon/${salon.slug || salon.id}`)}
                >
                  {salon.name}
                </h3>
                <div className="flex items-center gap-2 text-gray-600 mb-3">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">{salon.address}, {salon.city}</span>
                </div>
                
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{salon.description}</p>
                
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <span>{salon.review_count} recenzija</span>
                  <span>Dodano u omiljene</span>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/salon/${salon.slug || salon.id}`)}
                    className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white py-2 px-4 rounded-lg hover:from-orange-600 hover:to-red-600 transition-all font-medium"
                  >
                    Rezerviši termin
                  </button>
                  <button
                    onClick={() => navigate(`/salon/${salon.slug || salon.id}`)}
                    className="bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Detalji
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart className="w-8 h-8 text-pink-500" />
          </div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">
            {searchTerm ? 'Nema rezultata pretrage' : 'Nema omiljenih salona'}
          </h3>
          <p className="text-gray-600 mb-6">
            {searchTerm 
              ? 'Pokušajte sa drugačijim pojmom pretrage'
              : 'Dodajte salone u omiljene za brži pristup i rezervaciju'
            }
          </p>
          <button
            onClick={() => navigate('/pretraga')}
            className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-2 rounded-lg hover:from-orange-600 hover:to-red-600 transition-all"
          >
            Pronađi salone
          </button>
        </div>
      )}
    </div>
  );
}