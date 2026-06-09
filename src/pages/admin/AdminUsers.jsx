import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI } from '../../api/endpoints';
import { Search, Ban, ShieldAlert, CheckCircle, Loader2 } from 'lucide-react';

export default function AdminUsers() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [confirmUser, setConfirmUser] = useState(null); // { id: string, name: string, isBanned: boolean }
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'banned'
  const [currentPage, setCurrentPage] = useState(1);

  const { data: usersData, isLoading } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: () => adminAPI.getUsers(),
  });

  const users = usersData?.data?.data?.users || usersData?.data?.users || [];

  const banUserMutation = useMutation({
    mutationFn: ({ id, isBanned }) => adminAPI.banUser(id, { isBanned }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      setConfirmUser(null);
    },
  });

  // Calculate status counts
  const totalUsersCount = users.length;
  const activeUsersCount = users.filter((u) => !u.isBanned).length;
  const bannedUsersCount = users.filter((u) => u.isBanned).length;

  const filteredUsers = users.filter((u) => {
    const term = search.toLowerCase();
    const matchesSearch = 
      (u.full_name || u.name || '').toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term) ||
      (u.nationality || '').toLowerCase().includes(term);

    const matchesStatus = 
      statusFilter === 'all' ? true :
      statusFilter === 'active' ? !u.isBanned :
      u.isBanned;

    return matchesSearch && matchesStatus;
  });

  const itemsPerPage = 8;
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);

  const handleSearchChange = (val) => {
    setSearch(val);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (status) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-serif font-bold text-navy-500">Manage Platform Users</h2>
          <p className="text-xs text-gray-500 font-medium">Banning a user immediately revokes access and logs them out.</p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search by name, email..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9 w-full p-2.5 border border-gray-300 bg-gray-50 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-gold-500"
          />
        </div>
      </div>

      {/* Filters (All, Active, Banned) */}
      <div className="flex border-b border-gray-200 space-x-6 text-xs pb-0.5 overflow-x-auto scrollbar-none">
        {[
          { id: 'all', label: 'All Users', count: totalUsersCount },
          { id: 'active', label: 'Active', count: activeUsersCount },
          { id: 'banned', label: 'Banned', count: bannedUsersCount },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => handleStatusFilterChange(tab.id)}
            className={`pb-3 font-bold relative transition whitespace-nowrap ${
              statusFilter === tab.id
                ? 'text-gold-600 border-b-2 border-gold-500'
                : 'text-gray-500 hover:text-navy-500'
            }`}
          >
            {tab.label} <span className="text-[10px] text-gray-400 font-normal">({tab.count})</span>
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 text-gold-500 animate-spin" />
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-xl border border-dashed text-xs text-gray-400">
          No users matched your query.
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-navy-500 text-white font-serif uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Nationality</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-gray-700 font-medium">
              {currentUsers.map((u) => {
                const name = u.full_name || u.name || 'N/A';
                return (
                  <tr key={u._id} className="hover:bg-sand-50/50 transition">
                    <td className="px-6 py-4 font-semibold text-navy-500">{name}</td>
                    <td className="px-6 py-4">{u.email}</td>
                    <td className="px-6 py-4 capitalize">{u.role}</td>
                    <td className="px-6 py-4">{u.nationality || 'N/A'}</td>
                    <td className="px-6 py-4 text-right">
                      {u.role !== 'admin' && (
                        <button
                          onClick={() => setConfirmUser({ id: u._id, name, isBanned: !u.isBanned })}
                          disabled={banUserMutation.isPending}
                          className={`px-3 py-1.5 rounded-lg font-bold text-[10px] shadow-sm transition ${
                            u.isBanned 
                              ? 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100' 
                              : 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
                          }`}
                        >
                          {u.isBanned ? 'Unban User' : 'Ban User'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="flex justify-between items-center bg-white border-t border-gray-200 px-6 py-4">
              <div className="text-xs text-gray-500 font-medium">
                Showing <span className="font-semibold text-navy-500">{indexOfFirstItem + 1}</span> to{' '}
                <span className="font-semibold text-navy-500">
                  {Math.min(indexOfLastItem, filteredUsers.length)}
                </span>{' '}
                of <span className="font-semibold text-navy-500">{filteredUsers.length}</span> entries
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

      {/* Confirmation Modal */}
      {confirmUser && (
        <div className="fixed inset-0 bg-navy-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-gold-500/20 max-w-sm w-full p-6 shadow-xl space-y-4 animate-in fade-in zoom-in duration-200 text-left">
            <div className={`flex items-center space-x-3 ${confirmUser.isBanned ? 'text-red-600' : 'text-green-600'}`}>
              <ShieldAlert className="h-6 w-6 shrink-0" />
              <h4 className="font-serif font-bold text-navy-500 text-base">
                {confirmUser.isBanned ? 'Ban Platform User' : 'Unban Platform User'}
              </h4>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              Are you sure you want to <strong>{confirmUser.isBanned ? 'ban' : 'unban'}</strong> user <strong>{confirmUser.name}</strong>? 
              {confirmUser.isBanned && " This will log the user out and prevent them from accessing their account."}
            </p>
            <div className="flex space-x-3 justify-end text-xs pt-2">
              <button
                onClick={() => setConfirmUser(null)}
                className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-600 font-bold rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={() => banUserMutation.mutate({ id: confirmUser.id, isBanned: confirmUser.isBanned })}
                disabled={banUserMutation.isPending}
                className={`px-4 py-2 text-white font-bold rounded-lg shadow transition flex items-center space-x-1 ${
                  confirmUser.isBanned 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {banUserMutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <span>Yes, Confirm</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
