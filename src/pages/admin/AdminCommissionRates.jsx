import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI } from '../../api/endpoints';

const RATE_LABELS = {
  commission_rate_flight: 'Flights',
  commission_rate_hotel: 'Hotels',
  commission_rate_itinerary: 'Tours & Itineraries',
  commission_rate_landmark: 'Landmark Tickets',
  commission_rate_default: 'Default (fallback)',
};

export default function AdminCommissionRates() {
  const queryClient = useQueryClient();
  const [editValues, setEditValues] = useState({});
  const [savedKeys, setSavedKeys] = useState([]);

  const { data, isLoading } = useQuery({
    queryKey: ['commissionRates'],
    queryFn: () => adminAPI.getCommissionRates(),
  });

  const rates = data?.data?.data?.rates || data?.data?.rates || [];

  const mutation = useMutation({
    mutationFn: ({ key, value }) => adminAPI.updateCommissionRate(key, value),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(['commissionRates']);
      queryClient.invalidateQueries(['adminStats']);
      setSavedKeys((prev) => [...prev, variables.key]);
      setTimeout(() => setSavedKeys((prev) => prev.filter((k) => k !== variables.key)), 2000);
    },
  });

  const handleSave = (key) => {
    const raw = editValues[key];
    if (raw === undefined || raw === '') return;
    const value = parseFloat(raw);
    if (isNaN(value) || value < 0 || value > 100) {
      alert('Please enter a valid number between 0 and 100');
      return;
    }
    mutation.mutate({ key, value });
  };

  if (isLoading) {
    return <div className="p-8 text-center text-gray-400">Loading commission rates...</div>;
  }

  return (
    <div className="p-6 max-w-2xl">
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Commission Rates</h2>
      <p className="text-sm text-gray-500 mb-6">
        Set the platform commission percentage for each booking type. Changes apply to new bookings only — existing bookings keep their original rate.
      </p>

      <div className="space-y-4">
        {rates.map((rate) => {
          const label = RATE_LABELS[rate.key] || rate.key;
          const currentValue = editValues[rate.key] !== undefined ? editValues[rate.key] : rate.value;
          const isSaved = savedKeys.includes(rate.key);

          return (
            <div key={rate.key} className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-4 shadow-sm">
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-700">{label}</p>
                <p className="text-xs text-gray-400">{rate.description}</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={currentValue}
                  onChange={(e) => setEditValues((prev) => ({ ...prev, [rate.key]: e.target.value }))}
                  className="w-20 border border-gray-200 rounded-lg px-2 py-1 text-sm text-center focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                <span className="text-sm text-gray-400">%</span>
                <button
                  onClick={() => handleSave(rate.key)}
                  disabled={mutation.isPending}
                  className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                >
                  {isSaved ? '✓ Saved' : 'Save'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
