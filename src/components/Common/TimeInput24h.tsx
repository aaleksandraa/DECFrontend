import React from 'react';

interface TimeInput24hProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  id?: string;
}

export function TimeInput24h({ value, onChange, className = '', id }: TimeInput24hProps) {
  const [hours, minutes] = value ? value.split(':') : ['09', '00'];

  const handleHourChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newHours = e.target.value;
    onChange(`${newHours}:${minutes}`);
  };

  const handleMinuteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMinutes = e.target.value;
    onChange(`${hours}:${newMinutes}`);
  };

  // Generate hours 00-23
  const hoursOptions = Array.from({ length: 24 }, (_, i) => {
    const hour = i.toString().padStart(2, '0');
    return (
      <option key={hour} value={hour}>
        {hour}
      </option>
    );
  });

  // Generate minutes 00, 15, 30, 45 (or 00-59 for full range)
  const minutesOptions = ['00', '15', '30', '45'].map(minute => (
    <option key={minute} value={minute}>
      {minute}
    </option>
  ));

  return (
    <div className={`flex items-center gap-1 ${className}`} id={id}>
      <select
        value={hours}
        onChange={handleHourChange}
        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
      >
        {hoursOptions}
      </select>
      <span className="text-gray-500 font-medium">:</span>
      <select
        value={minutes}
        onChange={handleMinuteChange}
        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
      >
        {minutesOptions}
      </select>
    </div>
  );
}
