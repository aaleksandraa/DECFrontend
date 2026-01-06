import React from 'react';
import { GuestBookingModal } from '../Public/GuestBookingModal';
import { Salon, Service, Staff } from '../../types';

interface ModernBookingFlowProps {
  salon: Salon;
  services: Service[];
  staff: Staff[];
  theme?: any;
  onClose?: () => void;
}

/**
 * ModernBookingFlow - Placeholder component
 * TODO: Implement modern booking flow for widget
 * Currently uses GuestBookingModal as fallback
 */
const ModernBookingFlow: React.FC<ModernBookingFlowProps> = ({
  salon,
  services,
  staff,
  onClose
}) => {
  const [isOpen, setIsOpen] = React.useState(true);

  const handleClose = () => {
    setIsOpen(false);
    if (onClose) {
      onClose();
    }
  };

  // Convert salon to match GuestBookingModal expected type
  const salonForModal = {
    id: Number(salon.id),
    name: salon.name,
    slug: salon.slug,
    working_hours: salon.working_hours,
    salon_breaks: salon.salon_breaks,
    salon_vacations: salon.salon_vacations,
  };

  return (
    <GuestBookingModal
      isOpen={isOpen}
      onClose={handleClose}
      salon={salonForModal}
      services={services}
      staff={staff}
      user={null}
    />
  );
};

export default ModernBookingFlow;
