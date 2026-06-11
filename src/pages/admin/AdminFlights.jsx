import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { flightsAPI } from '../../api/endpoints';
import { Plus, Trash2, Edit2, Loader2, Search, Plane, AlertCircle } from 'lucide-react';

export default function AdminFlights() {
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [confirmDeleteFlight, setConfirmDeleteFlight] = useState(null); // { id: string, name: string }

  // Form states
  const [airline, setAirline] = useState('EgyptAir');
  const [flightNumber, setFlightNumber] = useState('MS 779');
  const [origin, setOrigin] = useState('CAI');
  const [destination, setDestination] = useState('LXR');
  const [departureTime, setDepartureTime] = useState('');
  const [arrivalTime, setArrivalTime] = useState('');
  const [price, setPrice] = useState(120);
  const [seatsAvailable, setSeatsAvailable] = useState(150);
  const [flightClass, setFlightClass] = useState('economy');

  // Queries (we search using a mock param first to populate listing)
  const { data: flightsData, isLoading } = useQuery({
    queryKey: ['adminFlights'],
    queryFn: () => flightsAPI.search({ origin: '', destination: '' }),
  });

  const flights = flightsData?.data?.data?.flights || flightsData?.data?.flights || [];

  // Filter list
  const filteredFlights = flights.filter((f) => {
    const term = search.toLowerCase();
    return f.airline.toLowerCase().includes(term) ||
      f.flightNumber.toLowerCase().includes(term) ||
      f.origin.toLowerCase().includes(term) ||
      f.destination.toLowerCase().includes(term);
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const totalPages = Math.ceil(filteredFlights.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentFlights = filteredFlights.slice(indexOfFirstItem, indexOfLastItem);

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: (data) => flightsAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminFlights'] });
      setSuccessMsg('Flight registered successfully!');
      resetForm();
      setTimeout(() => setSuccessMsg(''), 3000);
    },
    onError: (err) => {
      setErrorMsg(err.response?.data?.message || 'Failed to register flight.');
    },
  });

  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => flightsAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminFlights'] });
      setSuccessMsg('Flight updated successfully!');
      resetForm();
      setTimeout(() => setSuccessMsg(''), 3000);
    },
    onError: (err) => {
      setErrorMsg(err.response?.data?.message || 'Failed to update flight.');
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => flightsAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminFlights'] });
      setSuccessMsg('Flight deleted successfully.');
      setConfirmDeleteFlight(null);
      setTimeout(() => setSuccessMsg(''), 3000);
    },
  });

  const resetForm = () => {
    setAirline('EgyptAir');
    setFlightNumber('MS 779');
    setOrigin('CAI');
    setDestination('LXR');
    setDepartureTime('');
    setArrivalTime('');
    setPrice(120);
    setSeatsAvailable(150);
    setFlightClass('economy');
    setShowAddForm(false);
    setEditingId(null);
  };

  const handleEditClick = (f) => {
    setEditingId(f._id);
    setAirline(f.airline);
    setFlightNumber(f.flightNumber);
    setOrigin(f.origin);
    setDestination(f.destination);
    
    // Handle either old ISO dates or new "HH:mm" strings
    let depTime = f.departureTime || '';
    if (depTime.includes('T')) {
      const dt = new Date(depTime);
      if (!isNaN(dt)) depTime = dt.toISOString().slice(11, 16);
    }
    setDepartureTime(depTime);

    let arrTime = f.arrivalTime || '';
    if (arrTime.includes('T')) {
      const dt = new Date(arrTime);
      if (!isNaN(dt)) arrTime = dt.toISOString().slice(11, 16);
    }
    setArrivalTime(arrTime);
    setPrice(f.price);
    setSeatsAvailable(f.seatsAvailable);
    setFlightClass(f.class || 'economy');
    setShowAddForm(true);
    setErrorMsg('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!airline || !flightNumber || !origin || !destination || !departureTime || !arrivalTime) {
      setErrorMsg('Please populate all fields.');
      return;
    }

    const payload = {
      airline,
      flightNumber,
      origin,
      destination,
      departureTime,
      arrivalTime,
      price: parseFloat(price),
      seatsAvailable: parseInt(seatsAvailable),
      class: flightClass,
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-serif font-bold text-navy-500">Manage Flights</h2>
          <p className="text-xs text-gray-500">Add, edit, search, and delete flight listings.</p>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          {/* Search */}
          <div className="relative w-full sm:w-60">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search flights..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9 w-full p-2.5 border border-gray-300 bg-gray-50 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-gold-500"
            />
          </div>

          <button
            onClick={() => {
              if (showAddForm) {
                resetForm();
              } else {
                setShowAddForm(true);
              }
            }}
            className="bg-gold-500 hover:bg-gold-600 text-navy-900 font-bold px-4 py-2 rounded-lg text-xs flex items-center space-x-1 shadow shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>{showAddForm ? 'Cancel' : 'Add Flight'}</span>
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="text-xs text-green-700 bg-green-50 p-3 rounded-lg border border-green-200">
          {successMsg}
        </div>
      )}

      {showAddForm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form 
            onSubmit={handleSubmit} 
            className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden border border-gold-500/20 shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto text-left"
          >
            <div className="flex justify-between items-center border-b border-gray-150 pb-3">
              <h3 className="font-serif font-bold text-navy-500 text-sm">
                {editingId ? 'Edit Flight Schedule' : 'Register New Flight'}
              </h3>
              <button 
                type="button" 
                onClick={resetForm}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            {errorMsg && (
              <div className="text-xs text-red-700 bg-red-50 p-2.5 rounded border border-red-200">
                {errorMsg}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase">Airline</label>
                <input
                  type="text"
                  required
                  value={airline}
                  onChange={(e) => setAirline(e.target.value)}
                  className="mt-1 w-full p-2 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-gold-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase">Flight Number</label>
                <input
                  type="text"
                  required
                  value={flightNumber}
                  onChange={(e) => setFlightNumber(e.target.value)}
                  className="mt-1 w-full p-2 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-gold-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase">Class Tier</label>
                <select
                  value={flightClass}
                  onChange={(e) => setFlightClass(e.target.value)}
                  className="mt-1 w-full p-2 bg-white border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-gold-500 focus:outline-none"
                >
                  <option value="economy">Economy Class</option>
                  <option value="business">Business Class</option>
                  <option value="first">First Class</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase">Origin Airport</label>
                <input
                  type="text"
                  required
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  className="mt-1 w-full p-2 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-gold-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase">Destination Airport</label>
                <input
                  type="text"
                  required
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="mt-1 w-full p-2 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-gold-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase">Seats Available</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={seatsAvailable}
                  onChange={(e) => setSeatsAvailable(e.target.value)}
                  className="mt-1 w-full p-2 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-gold-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase">Departure Time</label>
                <input
                  type="time"
                  required
                  value={departureTime}
                  onChange={(e) => setDepartureTime(e.target.value)}
                  className="mt-1 w-full p-2 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-gold-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase">Arrival Time</label>
                <input
                  type="time"
                  required
                  value={arrivalTime}
                  onChange={(e) => setArrivalTime(e.target.value)}
                  className="mt-1 w-full p-2 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-gold-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase">Ticket Price ($)</label>
                <input
                  type="number"
                  required
                  min={0}
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="mt-1 w-full p-2 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-gold-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end border-t border-gray-100 pt-3">
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-100 hover:bg-gray-200 text-navy-500 font-bold py-2.5 px-6 rounded-lg text-[10px]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="bg-navy-500 hover:bg-navy-600 text-white font-bold py-2.5 px-6 rounded-lg text-[10px] shadow"
              >
                {editingId ? 'Update Flight' : 'Save Flight'}
              </button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 text-gold-500 animate-spin" />
        </div>
      ) : filteredFlights.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-xl border border-dashed text-xs text-gray-400">
          No flights matched your criteria.
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-navy-500 text-white font-serif uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Carrier</th>
                <th className="px-6 py-4">Route</th>
                <th className="px-6 py-4">Class</th>
                <th className="px-6 py-4">Fare</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-gray-700 font-medium">
              {currentFlights.map((f) => (
                <tr key={f._id} className="hover:bg-sand-50/50 transition">
                  <td className="px-6 py-4 font-semibold text-navy-500">
                    <div className="flex items-center space-x-1.5">
                       <Plane className="h-4 w-4 text-gold-500" />
                      <span>{f.airline} ({f.flightNumber})</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">{f.origin} &rarr; {f.destination}</td>
                  <td className="px-6 py-4 capitalize">{f.class}</td>
                  <td className="px-6 py-4 font-bold text-gold-600">${f.price}</td>
                  <td className="px-6 py-4 text-right space-x-1.5">
                    <button
                      type="button"
                      onClick={() => handleEditClick(f)}
                      className="bg-gold-50 hover:bg-gold-100 text-gold-600 border border-gold-300/40 p-1.5 rounded-lg transition-all duration-200 shadow-sm hover:shadow hover:shadow-gold-500/10"
                      title="Edit (Ankh of Transformation)"
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 10C14.2 10 16 8.2 16 6C16 3.8 14.2 2 12 2C9.8 2 8 3.8 8 6C8 8.2 9.8 10 12 10Z" />
                        <path d="M6 12H18" />
                        <path d="M12 12V22" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteFlight({ id: f._id, name: `${f.airline} ${f.flightNumber}` })}
                      disabled={deleteMutation.isPending}
                      className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 p-1.5 rounded-lg transition-all duration-200 shadow-sm hover:shadow hover:shadow-red-500/10"
                      title="Delete (Anubis Jackal Profile)"
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 2L10 9H14L15 2" />
                        <path d="M7 10L5 14H19L17 10H7Z" />
                        <path d="M9 14V19L12 21L15 19V14" />
                        <path d="M7 16H17" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="flex justify-between items-center bg-white border-t border-gray-200 px-6 py-4">
              <div className="text-xs text-gray-500 font-medium">
                Showing <span className="font-semibold text-navy-500">{indexOfFirstItem + 1}</span> to{' '}
                <span className="font-semibold text-navy-500">
                  {Math.min(indexOfLastItem, filteredFlights.length)}
                </span>{' '}
                of <span className="font-semibold text-navy-500">{filteredFlights.length}</span> entries
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => { setCurrentPage((p) => Math.max(1, p - 1)); window.scrollTo({ top: 0, left: 0, behavior: 'instant' }); }}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-lg border bg-white disabled:opacity-50 text-xs font-bold text-navy-500 transition hover:bg-gold-500 hover:text-navy-950"
                >
                  Previous
                </button>
                <button
                  onClick={() => { setCurrentPage((p) => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, left: 0, behavior: 'instant' }); }}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 rounded-lg border bg-white disabled:opacity-50 text-xs font-bold text-navy-500 transition hover:bg-gold-500 hover:text-navy-950"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      {/* Delete Confirmation Modal */}
      {confirmDeleteFlight && (
        <div className="fixed inset-0 bg-navy-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-gold-500/20 max-w-sm w-full p-6 shadow-xl space-y-4 animate-in fade-in zoom-in duration-200 text-left">
            <div className="flex items-center space-x-3 text-red-600">
              <AlertCircle className="h-6 w-6 shrink-0" />
              <h4 className="font-serif font-bold text-navy-500 text-base">Delete Flight</h4>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              Are you sure you want to permanently delete flight <strong>{confirmDeleteFlight.name}</strong>? This action cannot be undone and will remove all corresponding references.
            </p>
            <div className="flex space-x-3 justify-end text-xs pt-2">
              <button
                onClick={() => setConfirmDeleteFlight(null)}
                className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-600 font-bold rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate(confirmDeleteFlight.id)}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition flex items-center space-x-1"
              >
                {deleteMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
