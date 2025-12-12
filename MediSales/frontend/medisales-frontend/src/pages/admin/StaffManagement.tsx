import { useEffect, useState, useMemo } from 'react';
import { 
  Plus, Edit, Trash2, Search, UserCheck, UserX, Shield, User as UserIcon, 
  FileText, X, Filter, Calendar, Clock, LogIn, LogOut, ShoppingCart, 
  Package, AlertCircle 
} from 'lucide-react';
import { staffService, type AuditLog } from '../../services/staffService';
import type { Staff, StaffInput, StaffUpdateInput } from '../../types/Staff';
import type { UserRole } from '../../types/User';
import { errorToast, successToast } from '../../utils/toast';
import ProfilePictureUpload from '../../components/admin/ProfilePictureUpload';
import { format, isToday, isYesterday } from 'date-fns';

interface StaffFormData {
  username: string;
  password: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  role: UserRole;
}

const StaffManagement = () => {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [formData, setFormData] = useState<StaffFormData>({
    username: '',
    password: '',
    fullName: '',
    email: '',
    phoneNumber: '',
    role: 'Staff' as UserRole,
  });

  // Audit Log State
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logFilter, setLogFilter] = useState('All');
  const [logSearch, setLogSearch] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
      setCurrentPage(1);
    }, 300);

    return () => window.clearTimeout(handle);
  }, [searchTerm]);

  useEffect(() => {
    fetchStaff();
  }, [currentPage, pageSize, debouncedSearch, roleFilter, statusFilter]);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const response = await staffService.getAllStaff(currentPage, pageSize, debouncedSearch, roleFilter, statusFilter);
      setStaff(response.data);
      setTotalPages(response.totalPages);
      setTotalCount(response.totalCount);
    } catch (error) {
      errorToast('Failed to load staff members');
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    setLoadingLogs(true);
    setShowAuditModal(true);
    try {
      const logs = await staffService.getAuditLogs();
      setAuditLogs(logs);
    } catch (error) {
      errorToast('Failed to load audit logs');
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleOpenModal = (staffMember?: Staff) => {
    if (staffMember) {
      setEditingStaff(staffMember);
      setFormData({
        username: staffMember.username,
        password: '',
        fullName: staffMember.fullName || '',
        email: staffMember.email || '',
        phoneNumber: staffMember.phoneNumber || '',
        role: staffMember.role,
      });
    } else {
      setEditingStaff(null);
      setFormData({
        username: '',
        password: '',
        fullName: '',
        email: '',
        phoneNumber: '',
        role: 'Staff' as UserRole,
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingStaff(null);
    setFormData({
      username: '',
      password: '',
      fullName: '',
      email: '',
      phoneNumber: '',
      role: 'Staff' as UserRole,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingStaff) {
        const updatePayload: StaffUpdateInput = {
          fullName: formData.fullName,
          email: formData.email,
          phoneNumber: formData.phoneNumber,
          role: formData.role,
        };
        await staffService.updateStaff(editingStaff.userId, updatePayload);
        successToast('Staff member updated successfully!');
      } else {
        const createPayload: StaffInput = {
          username: formData.username,
          password: formData.password,
          fullName: formData.fullName,
          email: formData.email,
          phoneNumber: formData.phoneNumber,
          role: 'Staff',
        };
        if (formData.role === 'Administrator') {
             (createPayload as any).role = 'Administrator';
        }
        
        await staffService.addStaff(createPayload);
        successToast('Staff member added successfully!');
      }
      handleCloseModal();
      fetchStaff();
    } catch (error) {
      errorToast(editingStaff ? 'Failed to update staff member' : 'Failed to add staff member');
    }
  };

  const handleDelete = async (userId: number) => {
    if (!window.confirm('Are you sure you want to delete this staff member?')) {
      return;
    }

    try {
      await staffService.deleteStaff(userId);
      successToast('Staff member deleted successfully!');
      fetchStaff();
    } catch (error) {
      errorToast('Failed to delete staff member');
    }
  };

  const handleToggleStatus = async (user: Staff) => {
    try {
      const newStatus = user.status === 'Online' ? 'Offline' : 'Online';
      await staffService.updateStaffStatus(user.userId, newStatus);
      successToast(`Staff member ${newStatus === 'Offline' ? 'deactivated' : 'activated'} successfully!`);
      fetchStaff();
    } catch (error) {
      errorToast('Failed to update staff status');
    }
  };

  const getRoleBadge = (role: UserRole) => {
    return role === 'Administrator' ? (
      <span className="inline-flex items-center gap-1 bg-purple-100 px-2.5 py-0.5 text-xs font-semibold text-purple-700 border border-purple-200">
        <Shield className="h-3 w-3" />
        Administrator
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700 border border-blue-200">
        <UserIcon className="h-3 w-3" />
        Staff
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    return status === 'Online' ? (
      <span className="inline-flex items-center gap-1 bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700 border border-green-200">
        <UserCheck className="h-3 w-3" />
        Active
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700 border border-slate-200">
        <UserX className="h-3 w-3" />
        Inactive
      </span>
    );
  };

  const filteredLogs = useMemo(() => {
    return auditLogs.filter(log => {
      const matchesFilter = logFilter === 'All' || 
        (logFilter === 'Login/Logout' && (log.action === 'Login' || log.action === 'Logout')) ||
        (logFilter === 'Void Transaction' && (log.entityName === 'Transaction' && log.action === 'Void')) ||
        (logFilter === 'Staff' && (log.entityName === 'Staff'));
      
      const matchesSearch = log.userName.toLowerCase().includes(logSearch.toLowerCase()) ||
        log.details.toLowerCase().includes(logSearch.toLowerCase()) ||
        log.action.toLowerCase().includes(logSearch.toLowerCase());

      return matchesFilter && matchesSearch;
    });
  }, [auditLogs, logFilter, logSearch]);

  const getActionIcon = (action: string, entityName: string) => {
    if (action === 'Login') return <LogIn className="h-4 w-4 text-green-600" />;
    if (action === 'Logout') return <LogOut className="h-4 w-4 text-slate-500" />;
    if (entityName === 'Transaction' && action === 'Void') return <X className="h-4 w-4 text-red-600" />;
    if (entityName === 'Transaction') return <ShoppingCart className="h-4 w-4 text-blue-600" />;
    if (entityName === 'InventoryMovement') return <Package className="h-4 w-4 text-orange-600" />;
    if (entityName === 'Staff') return <UserIcon className="h-4 w-4 text-purple-600" />;
    return <AlertCircle className="h-4 w-4 text-slate-400" />;
  };

  const formatLogDate = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) {
      return `Today at ${format(date, 'h:mm a')}`;
    }
    if (isYesterday(date)) {
      return `Yesterday at ${format(date, 'h:mm a')}`;
    }
    return format(date, 'MMM d, yyyy h:mm a');
  };

  return (
    <div className="space-y-8 p-8 font-sans bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">STAFF MANAGEMENT</h1>
          <p className="mt-2 text-sm font-bold text-slate-500 uppercase tracking-wide">Manage staff accounts and permissions</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchAuditLogs}
            className="flex items-center gap-2 rounded-xl border-2 border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 transition-all hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 uppercase tracking-wide"
          >
            <FileText className="h-4 w-4" />
            Audit Trail
          </button>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 px-5 py-2.5 text-sm font-bold text-white transition-all hover:to-blue-800 hover:shadow-lg hover:shadow-blue-900/20 active:scale-95 shadow-md border-2 border-transparent uppercase tracking-wide"
          >
            <Plus className="h-5 w-5" />
            Add Staff Member
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-6 rounded-2xl shadow-lg border-2 border-slate-200">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search staff by name, username, or email..."
              className="w-full rounded-xl border-2 border-slate-200 py-3 pl-12 pr-4 text-sm font-bold text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-0 transition-colors placeholder-slate-400"
            />
          </div>
          
          <div className="flex items-center gap-2 rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3">
            <Filter className="h-4 w-4 text-slate-500" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-transparent text-sm font-bold text-slate-700 focus:outline-none min-w-[120px]"
            >
              <option value="">All Roles</option>
              <option value="Administrator">Administrator</option>
              <option value="Staff">Staff</option>
            </select>
          </div>

          <div className="flex items-center gap-2 rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3">
            <Filter className="h-4 w-4 text-slate-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-sm font-bold text-slate-700 focus:outline-none min-w-[120px]"
            >
              <option value="">All Status</option>
              <option value="Online">Active</option>
              <option value="Offline">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-white rounded-2xl shadow-lg border-2 border-slate-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          </div>
        ) : staff.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 text-center">
            <div className="bg-slate-100 p-4 rounded-full mb-4">
              <UserIcon className="h-10 w-10 text-slate-400" />
            </div>
            <p className="text-lg font-bold text-slate-900">No staff members found</p>
            <p className="text-sm font-medium text-slate-500 mt-1">Add your first staff member to get started</p>
          </div>
        ) : (
          <>
          <div className="max-h-[600px] overflow-x-auto overflow-y-auto">
            <table className="w-full">
              <thead className="sticky top-0 z-10 bg-slate-50 border-b-2 border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-extrabold uppercase tracking-wider text-slate-500">
                    Staff Member
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-extrabold uppercase tracking-wider text-slate-500">
                    Contact
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-extrabold uppercase tracking-wider text-slate-500">
                    Role
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-extrabold uppercase tracking-wider text-slate-500">
                    Status
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-extrabold uppercase tracking-wider text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-slate-100">
                {staff.map((member) => (
                  <tr key={member.userId} className="transition hover:bg-slate-50/80">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <ProfilePictureUpload
                          userId={member.userId}
                          currentPictureUrl={member.profilePictureUrl || null}
                          fullName={member.fullName || member.username}
                          size="small"
                          editable={true}
                          onUploadSuccess={() => fetchStaff()}
                          onUploadError={(error) => errorToast(error)}
                        />
                        <div>
                          <p className="text-sm font-bold text-slate-900">{member.fullName || 'N/A'}</p>
                          <p className="text-xs font-medium text-slate-500">@{member.username}</p>
                          {member.isOnlineNow && (
                            <span className="inline-flex items-center gap-1.5 mt-1 px-2 py-0.5 rounded-full bg-green-50 border border-green-100">
                              <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></span>
                              <span className="text-[10px] font-bold text-green-700 uppercase tracking-wide">Online</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-slate-700">{member.email || 'No email'}</p>
                        <p className="text-xs font-medium text-slate-500 mt-0.5">{member.phoneNumber || 'No phone'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">{getRoleBadge(member.role)}</td>
                    <td className="px-6 py-4">{getStatusBadge(member.status)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggleStatus(member)}
                          className="p-2 rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-900"
                          title={member.status === 'Online' ? 'Deactivate' : 'Activate'}
                        >
                          {member.status === 'Online' ? (
                            <UserX className="h-4 w-4" />
                          ) : (
                            <UserCheck className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleOpenModal(member)}
                          className="p-2 rounded-lg text-blue-600 transition hover:bg-blue-50 hover:text-blue-700"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(member.userId)}
                          className="p-2 rounded-lg text-rose-400 transition hover:bg-rose-50 hover:text-rose-600"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Controls */}
          <div className="flex items-center justify-between border-t-2 border-slate-200 bg-slate-50 px-6 py-4">
            <div className="flex flex-1 justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">
                  Showing <span className="font-bold text-slate-900">{(currentPage - 1) * pageSize + 1}</span> to{' '}
                  <span className="font-bold text-slate-900">{Math.min(currentPage * pageSize, totalCount)}</span> of{' '}
                  <span className="font-bold text-slate-900">{totalCount}</span> results
                </p>
              </div>
              <div>
                <nav className="isolate inline-flex rounded-md shadow-sm gap-2" aria-label="Pagination">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <div className="flex gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                      .map((page, index, array) => {
                        const isGap = index > 0 && page - array[index - 1] > 1;
                        return (
                          <div key={page} className="flex items-center">
                            {isGap && <span className="px-2 text-sm font-medium text-slate-500">...</span>}
                            <button
                              onClick={() => setCurrentPage(page)}
                              aria-current={currentPage === page ? 'page' : undefined}
                              className={`rounded-lg px-4 py-2 text-sm font-medium ${
                                currentPage === page
                                  ? 'bg-blue-600 text-white'
                                  : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              {page}
                            </button>
                          </div>
                        );
                      })}
                  </div>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
          </>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
          onClick={handleCloseModal}
        >
          <div
            className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border-2 border-slate-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b-2 border-slate-100 p-6 bg-slate-50/50">
              <h2 className="text-xl font-extrabold text-slate-900 uppercase tracking-tight">
                {editingStaff ? 'Edit Staff Member' : 'Add Staff Member'}
              </h2>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="max-h-[70vh] overflow-y-auto px-6 py-6">
                <div className="space-y-6">
                  <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">Username *</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full rounded-xl border-2 border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-0 transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">
                    Password {editingStaff && '(leave blank to keep current)'}
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full rounded-xl border-2 border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-0 transition-colors"
                    required={!editingStaff}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">Full Name *</label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full rounded-xl border-2 border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-0 transition-colors"
                  required
                />
              </div>
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full rounded-xl border-2 border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-0 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">Contact Number</label>
                  <input
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    className="w-full rounded-xl border-2 border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-0 transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">Role *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                  className="w-full rounded-xl border-2 border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-0 transition-colors"
                  required
                >
                  <option value="Staff">Staff</option>
                  <option value="Administrator">Administrator</option>
                </select>
              </div>
              </div>
              </div>
              <div className="flex justify-end gap-3 border-t-2 border-slate-100 px-6 py-4 bg-slate-50/50">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-6 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-100 hover:text-slate-800 rounded-xl border-2 border-transparent"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-gradient-to-br from-blue-600 to-blue-700 px-6 py-2.5 text-sm font-bold text-white transition-all hover:to-blue-800 hover:shadow-lg hover:shadow-blue-900/20 active:scale-95 rounded-xl shadow-md border-2 border-transparent"
                >
                  {editingStaff ? 'Update' : 'Add'} Staff Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Audit Logs Modal */}
      {showAuditModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
          onClick={() => setShowAuditModal(false)}
        >
          <div
            className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl border-2 border-slate-200 flex flex-col max-h-[85vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b-2 border-slate-100 p-6 bg-slate-50/50">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                  <Shield className="h-6 w-6 text-blue-700" />
                  SYSTEM AUDIT TRAIL
                </h2>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mt-1">Track all system activities, logins, and transactions</p>
              </div>
              <button 
                onClick={() => setShowAuditModal(false)} 
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Filters & Search */}
            <div className="p-4 border-b-2 border-slate-100 bg-white space-y-4">
              <div className="flex flex-col sm:flex-row gap-4 justify-between">
                <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 no-scrollbar">
                  {['All', 'Login/Logout', 'Void Transaction', 'Staff'].map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setLogFilter(filter)}
                      className={`px-4 py-2 text-xs font-bold rounded-xl border-2 transition-all whitespace-nowrap uppercase tracking-wide ${
                        logFilter === filter
                          ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={logSearch}
                    onChange={(e) => setLogSearch(e.target.value)}
                    placeholder="Search logs..."
                    className="w-full pl-9 pr-4 py-2 text-sm font-bold border-2 border-slate-200 rounded-xl focus:border-blue-600 focus:ring-0 transition-colors placeholder-slate-400 text-slate-900"
                  />
                </div>
              </div>
            </div>
            
            {/* Logs List */}
            <div className="flex-1 overflow-y-auto bg-slate-50/30">
              {loadingLogs ? (
                <div className="flex flex-col items-center justify-center h-64 gap-3">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-wide">Loading audit history...</p>
                </div>
              ) : filteredLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                  <div className="bg-slate-100 p-4 rounded-full mb-3">
                    <Filter className="h-8 w-8 text-slate-400" />
                  </div>
                  <p className="font-bold text-slate-900">No logs found</p>
                  <p className="text-xs font-medium mt-1">Try adjusting your filters or search terms</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {filteredLogs.map((log) => (
                    <div key={log.id} className="p-4 hover:bg-white transition-colors group border-l-4 border-transparent hover:border-blue-500">
                      <div className="flex items-start gap-4">
                        {/* Icon Column */}
                        <div className="mt-1">
                          <div className="h-10 w-10 rounded-xl bg-white border-2 border-slate-200 shadow-sm flex items-center justify-center group-hover:border-blue-200 transition-colors">
                            {getActionIcon(log.action, log.entityName)}
                          </div>
                        </div>

                        {/* Content Column */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 text-sm">
                                {log.userName || 'System'}
                              </span>
                              <span className={`text-[10px] px-2 py-0.5 rounded-md border font-extrabold uppercase tracking-wider ${
                                log.userRole === 'Administrator' 
                                  ? 'bg-purple-50 text-purple-700 border-purple-200' 
                                  : 'bg-blue-50 text-blue-700 border-blue-200'
                              }`}>
                                {log.userRole || 'System'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 whitespace-nowrap bg-slate-100 px-2 py-0.5 rounded-lg">
                              <Clock className="h-3 w-3" />
                              {formatLogDate(log.timestamp)}
                            </div>
                          </div>
                          
                          <p className="text-sm text-slate-600 leading-relaxed font-medium">
                            <span className="font-bold text-slate-800">{log.action}</span>
                            {' - '}
                            {log.details}
                          </p>
                          
                          <div className="mt-2 flex items-center gap-3 text-xs text-slate-400 font-medium">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(log.timestamp), 'MMM d, yyyy')}
                            </span>
                            <span className="w-1 h-1 rounded-full bg-slate-300" />
                            <span className="font-mono text-slate-500">
                              ID: {log.entityId || 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Footer */}
            <div className="border-t-2 border-slate-100 p-4 bg-slate-50/50 flex justify-between items-center">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                Showing {filteredLogs.length} records
              </p>
              <button
                onClick={() => setShowAuditModal(false)}
                className="px-6 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-200 border-2 border-slate-200 bg-white rounded-xl uppercase tracking-wide"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffManagement;
