import React from 'react';
import { MainNavbar } from '../components/Layout/MainNavbar';
import { PublicFooter } from '../components/Public/PublicFooter';
import { ClientAppointments } from '../components/Client/ClientAppointments';

export const ClientAppointmentsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <MainNavbar />
      <div className="py-8">
        <ClientAppointments />
      </div>
      <PublicFooter />
    </div>
  );
};

export default ClientAppointmentsPage;
