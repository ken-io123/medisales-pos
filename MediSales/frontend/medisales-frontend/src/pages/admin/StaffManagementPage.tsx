import { useState, useEffect } from 'react';
import { userService } from '../../services/userService';
import type { User, RegisterPayload, UserRole } from '../../types/User';
import { successToast, errorToast } from '../../utils/toast';
import { formatDate, formatDateTime } from '../../utils/formatters';
import { 
  UserPlus, 
  Edit2, 
  UserX, 
  Users, 
  Search, 
  X, 
  Check,
  Mail,
  Shield,
  Calendar,
  Activity
} from 'lucide-react';

export default function StaffManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<RegisterPayload>({
    username: '',
    password: '',
    fullName: '',
    email: '',
    phoneNumber: '',
    role: 'Staff',
  });

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    const filtered = users.filter(
      (user) =>
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [searchTerm, users]);

  const loadUsers = async () => {
    try {
      const data = await userService.getAllUsers();
      setUsers(data);
      setFilteredUsers(data);
    } catch (error) {
      errorToast('Failed to load users');
    }
  };

  const handleOpenModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        username: user.username,
        password: '',
        fullName: user.fullName,
        email: user.email,
        phoneNumber: user.phoneNumber || '',
        role: user.role,
      });
    } else {
      setEditingUser(null);
      setFormData({
        username: '',
        password: '',
        fullName: '',
        email: '',
        phoneNumber: '',
        role: 'Staff',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingUser(null);
    setFormData({
      username: '',
      password: '',
      fullName: '',
      email: '',
      phoneNumber: '',
      role: 'Staff',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingUser) {
        const updateData: Partial<User> & { password?: string } = {
          fullName: formData.fullName,
          email: formData.email,
          phoneNumber: formData.phoneNumber,
          role: formData.role,
        };
        if (formData.password) {
          updateData.password = formData.password;
        }
        await userService.updateUser(editingUser.userId, updateData);
        successToast('User updated successfully');
      } else {
        await userService.createUser(formData);
        successToast('User created successfully');
      }
      handleCloseModal();
      loadUsers();
    } catch (error: any) {
      errorToast(error.response?.data?.message || 'Failed to save user');
    }
  };

  const handleDeactivate = async (user: User) => {
    if (!confirm(`Are you sure you want to ${user.status === 'Online' ? 'deactivate' : 'activate'} ${user.fullName}?`)) return;

    try {
      await userService.updateUser(user.userId, { status: user.status === 'Online' ? 'Offline' : 'Online' });
      successToast(`User ${user.status === 'Online' ? 'deactivated' : 'activated'} successfully`);
      loadUsers();
    } catch (error) {
      errorToast('Failed to update user status');
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'Administrator':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'Staff':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getRoleGradient = (role: string) => {
    switch (role) {
      case 'Administrator':
        return 'from-purple-500 to-purple-600';
      case 'Staff':
        return 'from-blue-500 to-blue-600';
      default:
        return 'from-slate-500 to-slate-600';
    }
  };

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">STAFF MANAGEMENT</h1>
          <p className="mt-2 text-sm font-bold text-slate-500 uppercase tracking-wide">Manage users and permissions</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 rounded-xl border-2 border-blue-600 bg-gradient-to-br from-blue-600 to-blue-700 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/30 hover:shadow-xl hover:scale-105 transition-all uppercase tracking-wide"
        >
          <UserPlus className="h-5 w-5" />
          Add Staff
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
        <input
          type="text"
          placeholder="Search by username, name, or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
        />
      </div>

      {/* User Cards Grid */}
      {filteredUsers.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border-2 border-slate-200 border-dashed">
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="p-4 bg-slate-50 rounded-full">
              <Users className="h-12 w-12 text-slate-300" />
            </div>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wide">No users found</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map((user) => (
            <div
              key={user.userId}
              className="group bg-white rounded-2xl shadow-lg border-2 border-slate-200 p-6 hover:border-blue-500/50 hover:shadow-xl transition-all duration-300"
            >
              {/* Avatar and Status */}
              <div className="flex items-start justify-between mb-6">
                <div className="relative">
                  <div
                    className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${getRoleGradient(
                      user.role
                    )} flex items-center justify-center text-white text-2xl font-extrabold shadow-lg transform group-hover:scale-110 transition-transform duration-300`}
                  >
                    {user.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div
                    className={`absolute -bottom-1 -right-1 w-5 h-5 ${
                      user.status === 'Online' ? 'bg-emerald-500' : 'bg-rose-500'
                    } rounded-full border-4 border-white shadow-sm`}
                  ></div>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <button
                    onClick={() => handleOpenModal(user)}
                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeactivate(user)}
                    className={`p-2 rounded-xl transition-all ${
                      user.status === 'Online'
                        ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                        : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                    }`}
                    title={user.status === 'Online' ? 'Deactivate' : 'Activate'}
                  >
                    {user.status === 'Online' ? <UserX className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* User Info */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">{user.fullName}</h3>
                  <p className="text-sm font-bold text-slate-500">@{user.username}</p>
                </div>

                <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span className="truncate">{user.email}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-slate-400" />
                  <span
                    className={`px-2.5 py-0.5 rounded-lg text-xs font-bold border ${getRoleBadgeColor(
                      user.role
                    )}`}
                  >
                    {user.role.toUpperCase()}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                  <Activity className="w-4 h-4 text-slate-400" />
                  <span className={`font-bold ${user.status === 'Online' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {user.status}
                  </span>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wide">
                  <Calendar className="w-3 h-3" />
                  <span>Joined {formatDate(user.createdAt)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Staff Activity Monitoring */}
      <div className="rounded-2xl border-2 border-slate-200 bg-white shadow-lg overflow-hidden">
        <div className="p-6 border-b-2 border-slate-100 bg-slate-50/50 flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Activity className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 uppercase tracking-wide">Activity Monitor</h2>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mt-0.5">Real-time staff status</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b-2 border-slate-200">
              <tr>
                <th className="py-4 px-6 text-xs font-extrabold uppercase tracking-wider text-slate-600">Staff Name</th>
                <th className="py-4 px-6 text-xs font-extrabold uppercase tracking-wider text-slate-600">Username</th>
                <th className="py-4 px-6 text-xs font-extrabold uppercase tracking-wider text-slate-600">Role</th>
                <th className="py-4 px-6 text-xs font-extrabold uppercase tracking-wider text-slate-600">Status</th>
                <th className="py-4 px-6 text-xs font-extrabold uppercase tracking-wider text-slate-600">Last Login</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((user) => (
                  <tr key={user.userId} className="hover:bg-slate-50 transition-colors duration-150">
                    <td className="py-4 px-6 text-sm font-bold text-slate-900">{user.fullName}</td>
                    <td className="py-4 px-6 text-sm font-medium text-slate-600">{user.username}</td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-bold border ${getRoleBadgeColor(
                          user.role
                        )}`}
                      >
                        {user.role.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-bold border ${
                          user.status === 'Online'
                            ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                            : 'bg-rose-100 text-rose-700 border-rose-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            user.status === 'Online' ? 'bg-emerald-500' : 'bg-rose-500'
                          }`}
                        />
                        {user.status === 'Online' ? 'ONLINE' : 'OFFLINE'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm font-medium text-slate-600">
                      {user.lastLoginDate
                        ? formatDateTime(user.lastLoginDate)
                        : 'Never'}
                    </td>
                  </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border-2 border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b-2 border-slate-100 bg-slate-50/50">
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                {editingUser ? 'Edit User' : 'Add New User'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  disabled={!!editingUser}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all disabled:bg-slate-100 disabled:text-slate-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">
                  Password {editingUser && <span className="text-slate-400 normal-case font-normal">(leave blank to keep current)</span>}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                  required={!editingUser}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">
                  Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                  required
                >
                  <option value="Administrator">Administrator</option>
                  <option value="Staff">Staff</option>
                </select>
              </div>

              {/* Modal Footer */}
              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-3 border-2 border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:scale-[1.02] transition-all"
                >
                  {editingUser ? 'Update User' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
