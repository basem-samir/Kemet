import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { governoratesAPI, adminAPI } from '../../api/endpoints';
import { Plus, Trash2, Edit2, Loader2, Search, AlertCircle, CheckCircle } from 'lucide-react';

export default function AdminGovernorates() {
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [confirmDeleteGov, setConfirmDeleteGov] = useState(null); // { id: string, name: string }
  const [imageUploading, setImageUploading] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [capital, setCapital] = useState('');
  const [bestTimeToVisit, setBestTimeToVisit] = useState('');
  const [population, setPopulation] = useState('');
  const [famousFor, setFamousFor] = useState('');

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageUploading(true);
    setErrorMsg('');

    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await adminAPI.uploadImage(formData);
      const url = res.data?.data?.imageUrl || res.data?.imageUrl;
      if (url) {
        setCoverImage(url);
      } else {
        throw new Error('Image URL was not returned.');
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to upload image.');
    } finally {
      setImageUploading(false);
    }
  };

  const { data: govData, isLoading } = useQuery({
    queryKey: ['adminGovernorates'],
    queryFn: () => governoratesAPI.getAll({ limit: 1000 }),
  });

  const governorates = govData?.data?.data?.governorates || govData?.data?.governorates || [];

  // Filter list
  const filteredGovs = governorates.filter((g) => {
    const term = search.toLowerCase();
    return g.name.toLowerCase().includes(term) || 
      (g.capital || '').toLowerCase().includes(term) ||
      g.description.toLowerCase().includes(term);
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const totalPages = Math.ceil(filteredGovs.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentGovs = filteredGovs.slice(indexOfFirstItem, indexOfLastItem);

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: (data) => governoratesAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminGovernorates'] });
      setSuccessMsg('Governorate created successfully!');
      resetForm();
      setTimeout(() => setSuccessMsg(''), 3000);
    },
    onError: (err) => {
      setErrorMsg(err.response?.data?.message || 'Failed to create governorate.');
    },
  });

  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => governoratesAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminGovernorates'] });
      setSuccessMsg('Governorate updated successfully!');
      resetForm();
      setTimeout(() => setSuccessMsg(''), 3000);
    },
    onError: (err) => {
      setErrorMsg(err.response?.data?.message || 'Failed to update governorate.');
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => governoratesAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminGovernorates'] });
      setSuccessMsg('Governorate deleted successfully.');
      setConfirmDeleteGov(null);
      setTimeout(() => setSuccessMsg(''), 3000);
    },
  });

  const resetForm = () => {
    setName('');
    setSlug('');
    setDescription('');
    setCoverImage('');
    setCapital('');
    setBestTimeToVisit('');
    setPopulation('');
    setFamousFor('');
    setShowAddForm(false);
    setEditingId(null);
  };

  const handleEditClick = (gov) => {
    setEditingId(gov._id);
    setName(gov.name);
    setSlug(gov.slug);
    setDescription(gov.description);
    setCoverImage(gov.coverImage);
    setCapital(gov.capital || '');
    setBestTimeToVisit(gov.bestTimeToVisit || '');
    setPopulation(gov.population || '');
    setFamousFor(gov.famousFor || '');
    setShowAddForm(true);
    setErrorMsg('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!name || !slug || !description || !coverImage) {
      setErrorMsg('Please populate name, slug, description, and cover image.');
      return;
    }

    const payload = {
      name,
      slug,
      description,
      coverImage,
      capital,
      bestTimeToVisit,
      population,
      famousFor,
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
          <h2 className="text-2xl font-serif font-bold text-navy-500">Manage Governorates</h2>
          <p className="text-xs text-gray-500">Add, edit, search, and delete territories.</p>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          {/* Search */}
          <div className="relative w-full sm:w-60">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search governorates..."
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
            <span>{showAddForm ? 'Cancel' : 'Add Governorate'}</span>
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="text-xs text-green-700 bg-green-50 p-3 rounded-lg border border-green-200">
          {successMsg}
        </div>
      )}

      {showAddForm && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form 
            onSubmit={handleSubmit} 
            className="bg-[#fdfbf7] rounded overflow-hidden shadow-2xl w-full max-w-2xl border-[3px] border-[#b89047] text-left flex flex-col p-8"
          >
            <div className="relative text-center mb-6">
              <button 
                type="button" 
                onClick={resetForm}
                className="absolute -top-4 -right-4 text-gray-400 hover:text-gray-600 text-2xl font-light leading-none"
              >
                &times;
              </button>
              <h3 className="font-serif text-2xl text-gray-800">
                {editingId ? 'Edit Governorate' : 'Register New Governorate'}
              </h3>
              <div className="h-[1px] bg-[#b89047] w-48 mx-auto mt-3"></div>
            </div>

            {errorMsg && (
              <div className="mb-4 text-xs text-red-700 bg-red-50 p-2.5 rounded border border-red-200 text-center">
                {errorMsg}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
              <div>
                <label className="block text-[11px] font-serif text-gray-800 mb-1">Governorate Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!editingId) {
                      setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'));
                    }
                  }}
                  className="w-full p-2 border border-[#d9cbb2] rounded text-xs bg-[#fdfbf7] focus:ring-1 focus:ring-[#b89047] focus:outline-none"
                  placeholder="e.g. Aswan"
                />
              </div>

              <div>
                <label className="block text-[11px] font-serif text-gray-800 mb-1">Slug Identifier</label>
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full p-2 border border-[#d9cbb2] rounded text-xs bg-[#fdfbf7] focus:ring-1 focus:ring-[#b89047] focus:outline-none"
                  placeholder="e.g. aswan"
                />
              </div>

              <div>
                <label className="block text-[11px] font-serif text-gray-800 mb-1">Capital City</label>
                <input
                  type="text"
                  value={capital}
                  onChange={(e) => setCapital(e.target.value)}
                  className="w-full p-2 border border-[#d9cbb2] rounded text-xs bg-[#fdfbf7] focus:ring-1 focus:ring-[#b89047] focus:outline-none"
                  placeholder="e.g. Aswan"
                />
              </div>

              <div>
                <label className="block text-[11px] font-serif text-gray-800 mb-1">Best Time to Visit</label>
                <input
                  type="text"
                  value={bestTimeToVisit}
                  onChange={(e) => setBestTimeToVisit(e.target.value)}
                  className="w-full p-2 border border-[#d9cbb2] rounded text-xs bg-[#fdfbf7] focus:ring-1 focus:ring-[#b89047] focus:outline-none"
                  placeholder="e.g. Oct - Apr"
                />
              </div>

              <div>
                <label className="block text-[11px] font-serif text-gray-800 mb-1">Population</label>
                <input
                  type="text"
                  value={population}
                  onChange={(e) => setPopulation(e.target.value)}
                  className="w-full p-2 border border-[#d9cbb2] rounded text-xs bg-[#fdfbf7] focus:ring-1 focus:ring-[#b89047] focus:outline-none"
                  placeholder="e.g. 1.5 Million"
                />
              </div>

              <div>
                <label className="block text-[11px] font-serif text-gray-800 mb-1">Famous For</label>
                <input
                  type="text"
                  value={famousFor}
                  onChange={(e) => setFamousFor(e.target.value)}
                  className="w-full p-2 border border-[#d9cbb2] rounded text-xs bg-[#fdfbf7] focus:ring-1 focus:ring-[#b89047] focus:outline-none"
                  placeholder="e.g. Ancient Temples"
                />
              </div>

              <div className="flex flex-col">
                <label className="block text-[11px] font-serif text-gray-800 mb-1 uppercase tracking-widest">Cover Image</label>
                <div className="flex-1 flex flex-col gap-2 border border-[#d9cbb2] rounded p-3 bg-white">
                  <div className="flex items-center gap-4">
                    <label className="bg-[#b89047] text-white px-4 py-2 rounded text-xs cursor-pointer hover:bg-[#a07c3c] transition-colors shadow">
                      Choose File
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                    <span className="text-xs text-gray-800 truncate max-w-[120px]">{imageUploading ? 'Uploading...' : coverImage ? 'File chosen' : 'No file chosen'}</span>
                    {imageUploading && <Loader2 className="animate-spin text-[#b89047] h-4 w-4" />}
                  </div>
                  {coverImage && (
                    <div className="mt-2 relative w-full rounded overflow-hidden border border-[#d9cbb2] shadow-sm">
                      <img
                        src={coverImage}
                        alt="Preview"
                        className="w-full h-32 object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setCoverImage('')}
                        className="absolute top-2 right-2 bg-[#b89047] text-white rounded-full p-1.5 hover:bg-red-500 shadow transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col">
                <label className="block text-[11px] font-serif text-gray-800 mb-1">Description</label>
                <textarea
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="flex-1 w-full p-3 border border-[#d9cbb2] rounded text-xs bg-[#fdfbf7] focus:ring-1 focus:ring-[#b89047] focus:outline-none"
                  placeholder="Details about sights, location, etc..."
                ></textarea>
              </div>
            </div>

            <div className="flex gap-4 justify-end mt-6">
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-100 border border-gray-300 text-gray-800 font-bold py-2 px-6 rounded text-xs hover:bg-gray-200 transition-colors shadow-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="bg-[#b89047] hover:bg-[#a07c3c] text-white font-bold py-2 px-6 rounded text-xs shadow transition-colors"
              >
                {editingId ? 'Update Governorate' : 'Save Governorate'}
              </button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 text-gold-500 animate-spin" />
        </div>
      ) : filteredGovs.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-xl border border-dashed text-xs text-gray-400">
          No governorates matched your criteria.
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-navy-500 text-white font-serif uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Image</th>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Capital</th>
                <th className="px-6 py-4">Best Season</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-gray-700 font-medium">
              {currentGovs.map((gov) => (
                <tr key={gov._id} className="hover:bg-sand-50/50 transition">
                  <td className="px-6 py-4">
                    <img src={gov.coverImage} alt={gov.name} className="h-10 w-16 object-cover rounded shadow-sm bg-gray-100" />
                  </td>
                  <td className="px-6 py-4 font-semibold text-navy-500">{gov.name}</td>
                  <td className="px-6 py-4">{gov.capital || 'N/A'}</td>
                  <td className="px-6 py-4">{gov.bestTimeToVisit || 'N/A'}</td>
                  <td className="px-6 py-4 text-right space-x-1.5">
                    <button
                      type="button"
                      onClick={() => handleEditClick(gov)}
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
                      onClick={() => setConfirmDeleteGov({ id: gov._id, name: gov.name })}
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
                  {Math.min(indexOfLastItem, filteredGovs.length)}
                </span>{' '}
                of <span className="font-semibold text-navy-500">{filteredGovs.length}</span> entries
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-lg border bg-white disabled:opacity-50 text-xs font-bold text-navy-500 transition hover:bg-gold-500 hover:text-navy-955"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 rounded-lg border bg-white disabled:opacity-50 text-xs font-bold text-navy-500 transition hover:bg-gold-500 hover:text-navy-955"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDeleteGov && (
        <div className="fixed inset-0 bg-navy-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-gold-500/20 max-w-sm w-full p-6 shadow-xl space-y-4 animate-in fade-in zoom-in duration-200 text-left">
            <div className="flex items-center space-x-3 text-red-600">
              <AlertCircle className="h-6 w-6 shrink-0" />
              <h4 className="font-serif font-bold text-navy-500 text-base">Delete Governorate</h4>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              Are you sure you want to permanently delete governorate <strong>{confirmDeleteGov.name}</strong>? This action cannot be undone and will remove all corresponding references.
            </p>
            <div className="flex space-x-3 justify-end text-xs pt-2">
              <button
                onClick={() => setConfirmDeleteGov(null)}
                className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-600 font-bold rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate(confirmDeleteGov.id)}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow transition flex items-center space-x-1"
              >
                {deleteMutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <span>Yes, Delete</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
