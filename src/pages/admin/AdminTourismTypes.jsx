import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tourismTypesAPI, adminAPI } from '../../api/endpoints';
import { Plus, Trash2, Loader2, Search, AlertCircle, Edit3, X } from 'lucide-react';

export default function AdminTourismTypes() {
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [confirmDeleteType, setConfirmDeleteType] = useState(null); // { id: string, name: string }
  const [imageUploading, setImageUploading] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [order, setOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [subcategories, setSubcategories] = useState([]); // Array of { name, slug, description, image }

  // Subcategory temp form states
  const [subName, setSubName] = useState('');
  const [subSlug, setSubSlug] = useState('');
  const [subDesc, setSubDesc] = useState('');
  const [subImg, setSubImg] = useState('');
  const [subImgUploading, setSubImgUploading] = useState(false);

  const handleImageUpload = async (e, type = 'main') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === 'main') setImageUploading(true);
    else if (type === 'sub') setSubImgUploading(true);

    setErrorMsg('');

    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await adminAPI.uploadImage(formData);
      const url = res.data?.data?.imageUrl || res.data?.imageUrl;
      if (url) {
        if (type === 'main') setImage(url);
        else if (type === 'sub') setSubImg(url);
      } else {
        throw new Error('Image URL was not returned.');
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to upload image.');
    } finally {
      setImageUploading(false);
      setSubImgUploading(false);
    }
  };

  const { data: typesData, isLoading } = useQuery({
    queryKey: ['adminTourismTypes'],
    queryFn: () => tourismTypesAPI.getAll({ limit: 1000 }),
  });

  const tourismTypes = typesData?.data?.types || typesData?.data?.data?.types || [];

  // Filter list
  const filteredTypes = tourismTypes.filter((t) => {
    const term = search.toLowerCase();
    return t.name.toLowerCase().includes(term) || 
      t.description.toLowerCase().includes(term);
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const totalPages = Math.ceil(filteredTypes.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTypes = filteredTypes.slice(indexOfFirstItem, indexOfLastItem);

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: (data) => tourismTypesAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminTourismTypes'] });
      setSuccessMsg('Tourism type created successfully!');
      resetForm();
      setTimeout(() => setSuccessMsg(''), 3000);
    },
    onError: (err) => {
      setErrorMsg(err.response?.data?.message || 'Failed to create tourism type.');
    },
  });

  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => tourismTypesAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminTourismTypes'] });
      setSuccessMsg('Tourism type updated successfully!');
      resetForm();
      setTimeout(() => setSuccessMsg(''), 3000);
    },
    onError: (err) => {
      setErrorMsg(err.response?.data?.message || 'Failed to update tourism type.');
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => tourismTypesAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminTourismTypes'] });
      setSuccessMsg('Tourism type deleted successfully.');
      setConfirmDeleteType(null);
      setTimeout(() => setSuccessMsg(''), 3000);
    },
  });

  const resetForm = () => {
    setName('');
    setSlug('');
    setDescription('');
    setImage('');
    setOrder(0);
    setIsActive(true);
    setSubcategories([]);
    setSubName('');
    setSubSlug('');
    setSubDesc('');
    setSubImg('');
    setShowAddForm(false);
    setEditingId(null);
  };

  const handleEditClick = (type) => {
    setEditingId(type._id);
    setName(type.name);
    setSlug(type.slug);
    setDescription(type.description);
    setImage(type.image || '');
    setOrder(type.order || 0);
    setIsActive(type.isActive !== undefined ? type.isActive : true);
    setSubcategories(type.subcategories || []);
    setShowAddForm(true);
    setErrorMsg('');
  };

  const handleAddSubcategory = () => {
    if (!subName || !subSlug) {
      setErrorMsg('Subcategory name and slug are required.');
      return;
    }
    const newSub = {
      name: subName,
      slug: subSlug,
      description: subDesc,
      image: subImg,
    };
    setSubcategories([...subcategories, newSub]);
    setSubName('');
    setSubSlug('');
    setSubDesc('');
    setSubImg('');
  };

  const handleRemoveSubcategory = (index) => {
    setSubcategories(subcategories.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!name || !slug || !description) {
      setErrorMsg('Please populate name, slug, and description.');
      return;
    }

    const payload = {
      name,
      slug,
      description,
      image,
      order,
      isActive,
      subcategories,
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
          <h2 className="text-2xl font-serif font-bold text-navy-500">Manage Tourism Types</h2>
          <p className="text-xs text-gray-500">Add, edit, search, and delete tourism categories.</p>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          {/* Search */}
          <div className="relative w-full sm:w-60">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search tourism types..."
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
            className="bg-gold-500 hover:bg-gold-600 text-navy-900 font-bold px-4 py-2 rounded-lg text-xs flex items-center space-x-1 shadow shrink-0 animate-fade-in"
          >
            <Plus className="h-4 w-4" />
            <span>{showAddForm ? 'Cancel' : 'Add Tourism Type'}</span>
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
                {editingId ? 'Edit Tourism Type' : 'Register New Tourism Type'}
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase">Tourism Type Name</label>
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
                  className="mt-1 w-full p-2 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-gold-500 focus:outline-none"
                  placeholder="e.g. Cultural Tourism"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase">Slug Identifier</label>
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="mt-1 w-full p-2 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-gold-500 focus:outline-none"
                  placeholder="e.g. cultural-tourism"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase">Sort Order</label>
                <input
                  type="number"
                  value={order}
                  onChange={(e) => setOrder(Number(e.target.value))}
                  className="mt-1 w-full p-2 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-gold-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center space-x-2 mt-4.5">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4.5 w-4.5 rounded border-gray-300 text-gold-500 focus:ring-gold-500"
                />
                <label htmlFor="isActive" className="text-xs font-bold text-gray-700">Is Active</label>
              </div>

              {/* Image Input */}
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase">Banner/Cover Image</label>
                <div className="mt-1 flex items-center gap-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, 'main')}
                    className="block w-full text-xs text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-full file:border-0
                      file:text-xs file:font-semibold
                      file:bg-gold-5 file:text-gold-700
                      hover:file:bg-gold-100"
                  />
                  {imageUploading && <Loader2 className="animate-spin text-gold-500 h-5 w-5 shrink-0" />}
                </div>
                {image && (
                  <div className="mt-2 relative inline-block">
                    <img
                      src={image}
                      alt="Preview"
                      className="h-16 w-24 object-cover rounded-lg shadow-sm border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => setImage('')}
                      className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 shadow"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold text-gray-500 uppercase">Description</label>
                <textarea
                  required
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1 w-full p-2 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-gold-500 focus:outline-none"
                  placeholder="Describe this tourism type..."
                ></textarea>
              </div>

              {/* Dynamic Subcategories Form Section */}
              <div className="sm:col-span-2 border-t border-gray-200 pt-4">
                <h4 className="text-xs font-bold text-navy-500 uppercase tracking-wider mb-2">Subcategories</h4>
                
                {/* List of current subcategories */}
                {subcategories.length > 0 && (
                  <div className="space-y-2 mb-4">
                    {subcategories.map((sub, index) => (
                      <div key={index} className="flex justify-between items-center bg-gray-50 p-2 rounded-lg border border-gray-200 text-xs">
                        <div className="flex items-center space-x-3">
                          {sub.image && (
                            <img src={sub.image} alt={sub.name} className="h-8 w-12 object-cover rounded border" />
                          )}
                          <div>
                            <p className="font-semibold text-navy-500">{sub.name} <span className="text-[10px] text-gray-400">({sub.slug})</span></p>
                            {sub.description && <p className="text-[10px] text-gray-500 line-clamp-1">{sub.description}</p>}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveSubcategory(index)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Subcategory Fields to Add */}
                <div className="bg-sand-50/50 p-3 rounded-lg border border-dashed border-gray-300 space-y-3">
                  <p className="text-[10px] font-bold text-navy-500">ADD SUBCATEGORY</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <input
                        type="text"
                        placeholder="Subcategory Name"
                        value={subName}
                        onChange={(e) => {
                          setSubName(e.target.value);
                          setSubSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'));
                        }}
                        className="w-full p-2 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-gold-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="Subcategory Slug"
                        value={subSlug}
                        onChange={(e) => setSubSlug(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-gold-500 focus:outline-none"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <input
                        type="text"
                        placeholder="Subcategory Description"
                        value={subDesc}
                        onChange={(e) => setSubDesc(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-gold-500 focus:outline-none"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <div className="flex items-center gap-4">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageUpload(e, 'sub')}
                          className="block w-full text-xs text-gray-500
                            file:mr-4 file:py-1.5 file:px-3
                            file:rounded-full file:border-0
                            file:text-xs file:font-semibold
                            file:bg-gold-5 file:text-gold-700
                            hover:file:bg-gold-100"
                        />
                        {subImgUploading && <Loader2 className="animate-spin text-gold-500 h-4 w-4 shrink-0" />}
                      </div>
                      {subImg && (
                        <div className="mt-2 relative inline-block">
                          <img
                            src={subImg}
                            alt="Sub Preview"
                            className="h-12 w-20 object-cover rounded border"
                          />
                          <button
                            type="button"
                            onClick={() => setSubImg('')}
                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 shadow"
                          >
                            <Trash2 className="h-2.5 w-2.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddSubcategory}
                    className="bg-navy-500 hover:bg-navy-600 text-white text-[10px] font-bold px-3 py-1.5 rounded"
                  >
                    Add Subcategory to List
                  </button>
                </div>
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
                {editingId ? 'Update Tourism Type' : 'Save Tourism Type'}
              </button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 text-gold-500 animate-spin" />
        </div>
      ) : filteredTypes.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-xl border border-dashed text-xs text-gray-400">
          No tourism types matched your criteria.
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-navy-500 text-white font-serif uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Image</th>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Order</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-gray-700 font-medium">
              {currentTypes.map((type) => (
                <tr key={type._id} className="hover:bg-sand-50/50 transition">
                  <td className="px-6 py-4">
                    {type.image ? (
                      <img src={type.image} alt={type.name} className="h-10 w-16 object-cover rounded shadow-sm bg-gray-100" />
                    ) : (
                      <span className="text-gray-400">No Image</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-navy-500">{type.name}</div>
                    <div className="text-[10px] text-gray-400 italic">{type.slug}</div>
                  </td>
                  <td className="px-6 py-4">{type.order}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1.5 rounded-full text-[10px] font-bold ${type.isActive ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                      {type.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-1.5">
                    <button
                      type="button"
                      onClick={() => handleEditClick(type)}
                      className="bg-gold-50 hover:bg-gold-100 text-gold-600 border border-gold-300/40 p-1.5 rounded-lg transition-all duration-200 shadow-sm"
                      title="Edit Tourism Type"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteType({ id: type._id, name: type.name })}
                      disabled={deleteMutation.isPending}
                      className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 p-1.5 rounded-lg transition-all duration-200 shadow-sm"
                      title="Delete Tourism Type"
                    >
                      <Trash2 className="h-4 w-4" />
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
                  {Math.min(indexOfLastItem, filteredTypes.length)}
                </span>{' '}
                of <span className="font-semibold text-navy-500">{filteredTypes.length}</span> entries
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => { setCurrentPage((p) => Math.max(1, p - 1)); window.scrollTo({ top: 0, left: 0, behavior: 'instant' }); }}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-lg border bg-white disabled:opacity-50 text-xs font-bold text-navy-500 transition hover:bg-gold-500 hover:text-navy-955"
                >
                  Previous
                </button>
                <button
                  onClick={() => { setCurrentPage((p) => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, left: 0, behavior: 'instant' }); }}
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
      {confirmDeleteType && (
        <div className="fixed inset-0 bg-navy-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-gold-500/20 max-w-sm w-full p-6 shadow-xl space-y-4 animate-in fade-in zoom-in duration-200 text-left">
            <div className="flex items-center space-x-3 text-red-600">
              <AlertCircle className="h-6 w-6 shrink-0" />
              <h4 className="font-serif font-bold text-navy-500 text-base">Delete Tourism Type</h4>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              Are you sure you want to permanently delete tourism type <strong>{confirmDeleteType.name}</strong>? This action cannot be undone and will remove it from the system.
            </p>
            <div className="flex space-x-3 justify-end text-xs pt-2">
              <button
                onClick={() => setConfirmDeleteType(null)}
                className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-600 font-bold rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate(confirmDeleteType.id)}
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
