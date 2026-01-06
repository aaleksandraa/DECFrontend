import React from 'react';
import { MainNavbar } from '../components/Layout/MainNavbar';
import { PublicFooter } from '../components/Public/PublicFooter';
import { ClientDashboard } from '../components/Dashboard/ClientDashboard';

export const ClientHomePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <MainNavbar />
      <div className="py-8">
        <ClientDashboard />
      </div>
      <PublicFooter />
    </div>
  );
};

export default ClientHomePage;
