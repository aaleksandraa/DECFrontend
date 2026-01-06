import { CheckCircleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface AutoSaveIndicatorProps {
  status: 'idle' | 'saving' | 'saved';
  lastSaved?: Date | null;
}

export function AutoSaveIndicator({ status, lastSaved }: AutoSaveIndicatorProps) {
  if (status === 'idle') return null;

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('hr-HR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="flex items-center gap-2 text-sm">
      {status === 'saving' && (
        <>
          <ArrowPathIcon className="h-4 w-4 text-blue-500 animate-spin" />
          <span className="text-blue-600">Čuvanje...</span>
        </>
      )}
      {status === 'saved' && lastSaved && (
        <>
          <CheckCircleIcon className="h-4 w-4 text-green-500" />
          <span className="text-green-600">
            Sačuvano u {formatTime(lastSaved)}
          </span>
        </>
      )}
    </div>
  );
}
