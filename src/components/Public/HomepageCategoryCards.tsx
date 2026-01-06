import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { homepageCategoriesAPI } from '../../services/api';
import toast from 'react-hot-toast';

interface Category {
  id: number;
  name: string;
  slug: string;
  title: string;
  description: string;
  image_url: string | null;
  search_url: string;
}

interface CategorySettings {
  enabled: boolean;
  mobile: boolean;
  desktop: boolean;
  layout: 'grid' | 'carousel';
  categories: Category[];
}

interface HomepageCategoryCardsProps {
  isMobile?: boolean;
}

const HomepageCategoryCards: React.FC<HomepageCategoryCardsProps> = ({ isMobile = false }) => {
  const [settings, setSettings] = useState<CategorySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await homepageCategoriesAPI.getPublic();
      setSettings(data);
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = (category: Category) => {
    navigate(category.search_url);
  };

  // Don't render if feature is disabled
  if (!settings?.enabled) {
    return null;
  }

  // Don't render on mobile if mobile is disabled
  if (isMobile && !settings.mobile) {
    return null;
  }

  // Don't render on desktop if desktop is disabled
  if (!isMobile && !settings.desktop) {
    return null;
  }

  // Don't render if no categories
  if (!settings.categories || settings.categories.length === 0) {
    return null;
  }

  if (loading) {
    return (
      <div className="py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-6"></div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-gray-200 rounded-lg h-32"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Kategorije</h2>
      
      <div className={`grid ${
        isMobile 
          ? 'grid-cols-2 gap-3' 
          : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4'
      }`}>
        {settings.categories.map((category) => (
          <button
            key={category.id}
            onClick={() => handleCategoryClick(category)}
            className="group relative overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-white"
          >
            {/* Image */}
            <div className="aspect-square relative overflow-hidden bg-gradient-to-br from-blue-50 to-purple-50">
              {category.image_url ? (
                <img
                  src={category.image_url}
                  alt={category.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-4xl">
                    {category.slug === 'frizeri' && '✂️'}
                    {category.slug === 'berber' && '💈'}
                    {category.slug === 'djeca' && '👶'}
                    {category.slug === 'masaze' && '💆'}
                    {category.slug === 'lice' && '✨'}
                    {category.slug === 'nokti' && '💅'}
                  </span>
                </div>
              )}
              
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
            
            {/* Title */}
            <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
              <h3 className="text-white font-semibold text-sm md:text-base text-center">
                {category.title}
              </h3>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default HomepageCategoryCards;
