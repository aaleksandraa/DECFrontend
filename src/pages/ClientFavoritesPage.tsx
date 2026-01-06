import React from 'react';
import { MainNavbar } from '../components/Layout/MainNavbar';
import { PublicFooter } from '../components/Public/PublicFooter';
import { FavoriteSalons } from '../components/Client/FavoriteSalons';

export const ClientFavoritesPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <MainNavbar />
      <div className="py-8">
        <FavoriteSalons />
      </div>
      <PublicFooter />
    </div>
  );
};

export default ClientFavoritesPage;
