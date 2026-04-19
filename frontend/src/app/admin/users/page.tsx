'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocale } from '@/lib/locale';
import { adminApi } from '@/lib/api';
import styles from '../admin.module.css';
import { Search, CheckCircle2, XCircle, Shield, User as UserIcon, BookOpen, ChevronRight, ChevronLeft, UserX, UserCheck, Pencil, Trash2, Eye, Plus, AlertTriangle, Download, Activity, CalendarDays, LogIn } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import toast from 'react-hot-toast';

export default function AdminUsersPage() {
  const { locale } = useLocale();
  const isAr = locale === 'ar';
  
  // Advanced Filters
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);

  // Bulk Selection
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [viewTab, setViewTab] = useState<'profile' | 'activity'>('profile');
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', role: 'student', password: '' });
  
  // Custom Confirm Dialog State
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    isDanger: boolean;
  } | null>(null);

  const queryClient = useQueryClient();

  // Fetch Users List
  const { data: qData, isLoading } = useQuery({
    queryKey: ['admin-users', roleFilter, statusFilter, dateFrom, dateTo, search, page],
    queryFn: () => adminApi.getUsers({ 
      role: roleFilter, 
      status: statusFilter,
      date_from: dateFrom,
      date_to: dateTo,
      search: search || undefined, 
      page 
    }).then(r => r.data.data),
  });

  const users = qData?.data || [];
  const meta = qData || {};

  // Fetch Single User for View/Edit
  const { data: userDetails, isLoading: isUserLoading } = useQuery({
    queryKey: ['admin-user', selectedUserId],
    queryFn: () => adminApi.getUser(selectedUserId!).then(r => r.data.data),
    enabled: !!selectedUserId && (modalMode === 'view' || modalMode === 'edit'),
  });

  // Fetch User Activity Log
  const { data: userActivity, isLoading: isActivityLoading } = useQuery({
    queryKey: ['admin-user-activity', selectedUserId],
    queryFn: () => adminApi.getUserActivity(selectedUserId!).then(r => r.data.data),
    enabled: !!selectedUserId && modalMode === 'view' && viewTab === 'activity',
  });

  // Populate form on edit
  useEffect(() => {
    if (modalMode === 'edit' && userDetails) {
      setForm({
        name: userDetails.name || '',
        email: userDetails.email || '',
        phone: userDetails.phone || '',
        role: userDetails.role || 'student',
        password: '',
      });
    }
  }, [userDetails, modalMode]);

  // Mutations
  const toggleActiveMutation = useMutation({
    mutationFn: (id: number) => adminApi.toggleUserActive(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-user', selectedUserId] });
      toast.success(res.data?.message || (isAr ? 'تم تحديث الحالة' : 'Status updated'));
      setConfirmDialog(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || (isAr ? 'حدث خطأ' : 'Error updating user'));
      setConfirmDialog(null);
    }
  });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => adminApi.createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success(isAr ? 'تم إنشاء المستخدم بنجاح' : 'User created successfully');
      closeModal();
    },
    onError: (error: any) => toast.error(error.response?.data?.message || (isAr ? 'فشل الإنشاء' : 'Error creating user'))
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: Record<string, unknown> }) => adminApi.updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-user', selectedUserId] });
      toast.success(isAr ? 'تم تحديث البيانات بنجاح' : 'User updated successfully');
      closeModal();
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'Error updating user')
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminApi.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success(isAr ? 'تم حذف المستخدم نهائياً' : 'User correctly deleted');
      setConfirmDialog(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error deleting user');
      setConfirmDialog(null);
    }
  });

  const bulkMutation = useMutation({
    mutationFn: (action: 'activate' | 'suspend' | 'delete') => adminApi.bulkActionUsers(selectedIds, action),
    onSuccess: (res, action) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success(isAr ? 'تم تطبيق الإجراء الجماعي' : 'Bulk action completed');
      setSelectedIds([]);
      setConfirmDialog(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Bulk Error');
      setConfirmDialog(null);
    }
  });

  // Handlers
  const handleExport = async () => {
    try {
      const response = await adminApi.exportUsers({ role: roleFilter, status: statusFilter, date_from: dateFrom, date_to: dateTo, search });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `AlemnyPro_Users_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success(isAr ? 'تم تحميل البيانات' : 'Data exported');
    } catch (e) {
      toast.error(isAr ? 'خطأ في التصدير' : 'Export failed');
    }
  };

  const handleImpersonate = async (id: number) => {
    try {
      const res = await adminApi.impersonateUser(id);
      toast.success(isAr ? 'تم تسجيل الدخول بصلاحيات المستخدم' : 'Impersonation started');
      
      // Overwrite tokens to launch session
      localStorage.setItem('alemnypro_token', res.data.data.token);
      localStorage.setItem('alemnypro_user', JSON.stringify(res.data.data.user));
      
      // Redirect based on role
      if (res.data.data.user.role === 'tutor') {
        window.location.href = '/dashboard/tutor';
      } else {
        window.location.href = '/dashboard/student';
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Impersonation failed');
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const toggleAllSelections = () => {
    if (selectedIds.length === users.length && users.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(users.map((u: any) => u.id));
    }
  };

  const openModal = (mode: 'create' | 'edit' | 'view', id?: number) => {
    setModalMode(mode);
    setViewTab('profile');
    if (id) setSelectedUserId(id);
    else {
      setSelectedUserId(null);
      setForm({ name: '', email: '', phone: '', role: 'student', password: '' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedUserId(null);
    setForm({ name: '', email: '', phone: '', role: 'student', password: '' });
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (modalMode === 'create') {
      createMutation.mutate(form);
    } else if (modalMode === 'edit' && selectedUserId) {
      updateMutation.mutate({ id: selectedUserId, data: form });
    }
  };

  const roleOptions = [
    { val: '',        ar: 'الكل',   en: 'All'      },
    { val: 'student', ar: 'طلاب',   en: 'Students' },
    { val: 'tutor',   ar: 'معلمون', en: 'Tutors'   },
    { val: 'admin',   ar: 'مدراء',  en: 'Admins'   },
  ];

  const roleBadge: Record<string, { bg: string; color: string; ar: string; en: string; icon: React.ReactNode }> = {
    student: { bg: '#DBEAFE', color: '#1D4ED8', ar: 'طالب', en: 'Student', icon: <BookOpen size={14} /> },
    tutor:   { bg: '#D1FAE5', color: '#065F46', ar: 'معلم', en: 'Tutor', icon: <UserIcon size={14} /> },
    admin:   { bg: '#FEF3C7', color: '#92400E', ar: 'مدير', en: 'Admin', icon: <Shield size={14} /> },
  };

  return (
    <>
      <div className={styles.dashHeader} style={{ position: 'static', marginBottom: 24, flexDirection: 'column', alignItems: 'stretch', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 className={styles.dashTitle}>👥 {isAr ? 'إدارة المستخدمين' : 'User Management'}</h1>
            <p className={styles.dashSubtitle}>{isAr ? 'عرض وإدارة جميع مستخدمي المنصة' : 'View and manage all platform users'}</p>
          </div>
          <button 
            onClick={() => openModal('create')} 
            className="btn-primary" 
            style={{ 
              padding: '12px 24px', 
              borderRadius: '12px', 
              fontSize: 'var(--text-sm)', 
              fontWeight: 700,
              display: 'flex', 
              alignItems: 'center', 
              gap: 8,
              boxShadow: '0 4px 14px 0 rgba(27, 73, 101, 0.39)',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
            onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(27, 73, 101, 0.5)'; }}
            onMouseOut={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 14px 0 rgba(27, 73, 101, 0.39)'; }}
          >
            <Plus size={18} strokeWidth={3} />
            {isAr ? 'مستخدم جديد' : 'New User'}
          </button>
        </div>

        {/* Filters Top Bar */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', background: 'var(--bg-card)', padding: '6px', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
            {roleOptions.map(opt => (
              <button
                key={opt.val}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 600,
                  transition: 'all 0.2s',
                  background: roleFilter === opt.val ? 'var(--primary)' : 'transparent',
                  color: roleFilter === opt.val ? '#fff' : 'var(--text-secondary)',
                  border: 'none',
                  cursor: 'pointer'
                }}
                onClick={() => { setRoleFilter(opt.val); setPage(1); }}
              >
                {isAr ? opt.ar : opt.en}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button 
              onClick={handleExport}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', borderRadius: '12px', background: '#F8FAFC', border: '1px solid var(--border)', color: 'var(--text-secondary)', fontWeight: 600, fontSize: 'var(--text-sm)', cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseOver={(e) => { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.color = '#000'; }}
              onMouseOut={(e) => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
            >
              <Download size={16} />
              {isAr ? 'تصدير CSV' : 'Export CSV'}
            </button>
          </div>
        </div>

        {/* Enhanced Secondary Filters Row */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center', background: 'var(--bg-card)', padding: '12px', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontWeight: 600 }}>{isAr ? 'الحالة:' : 'Status:'}</span>
            <select className="input" style={{ width: 140, padding: '8px 12px', fontSize: 'var(--text-xs)' }} value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
              <option value="all">{isAr ? 'الجميع' : 'All'}</option>
              <option value="active">{isAr ? 'نشط' : 'Active'}</option>
              <option value="suspended">{isAr ? 'موقوف' : 'Suspended'}</option>
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontWeight: 600 }}>{isAr ? 'تاريخ التسجيل من:' : 'Joined From:'}</span>
            <input type="date" className="input" style={{ width: 140, padding: '8px 12px', fontSize: 'var(--text-xs)' }} value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} />
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontWeight: 600 }}>{isAr ? 'إلى:' : 'To:'}</span>
            <input type="date" className="input" style={{ width: 140, padding: '8px 12px', fontSize: 'var(--text-xs)' }} value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} />
          </div>

          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem', flex: '1', minWidth: '300px', marginLeft: 'auto' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <div style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', [isAr ? 'right' : 'left']: '14px', color: 'var(--text-muted)' }}>
                <Search size={16} />
              </div>
              <input 
                type="text" 
                placeholder={isAr ? 'بحث سريع بالاسم، البريد أو الهاتف...' : 'Quick search by name, email or phone...'}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                style={{ width: '100%', padding: `10px ${isAr ? '40px' : '16px'} 10px ${isAr ? '16px' : '40px'}`, borderRadius: '8px', border: '1px solid var(--border)', outline: 'none', fontSize: 'var(--text-sm)', background: 'var(--bg-muted)' }}
              />
            </div>
            <button type="submit" className="btn-secondary" style={{ padding: '0 20px', borderRadius: '8px', fontSize: 'var(--text-sm)' }}>
              {isAr ? 'بحث' : 'Search'}
            </button>
          </form>
        </div>
      </div>

      <div className={styles.dashCard} style={{ margin: 0, padding: 0, overflow: 'hidden', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)', position: 'relative' }}>
        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '1.5rem' }}>
            {[1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{ height: 64, borderRadius: 12 }} />)}
          </div>
        ) : users.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '5rem 1rem', color: 'var(--text-muted)' }}>
            <div style={{ width: 80, height: 80, background: 'var(--bg-alt)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
              <UserX size={40} style={{ opacity: 0.4 }} />
            </div>
            <h3 style={{ fontSize: '1.25rem', color: 'var(--text)', marginBottom: '0.5rem' }}>{isAr ? 'لا توجد نتائج' : 'No results found'}</h3>
            <p>{isAr ? 'قم بتغيير كلمات البحث أو الفلاتر وجرب مرة أخرى' : 'Adjust your search or filters and try again'}</p>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto', paddingBottom: selectedIds.length > 0 ? 80 : 0 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '1px solid var(--border)' }}>
                    <th style={{ width: '48px', padding: '1rem', textAlign: 'center' }}>
                      <input 
                        type="checkbox" 
                        checked={selectedIds.length === users.length && users.length > 0}
                        onChange={toggleAllSelections}
                        style={{ width: 16, height: 16, cursor: 'pointer' }}
                      />
                    </th>
                    <th style={{ textAlign: 'start', padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{isAr ? 'المستخدم' : 'User'}</th>
                    <th style={{ textAlign: 'start', padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{isAr ? 'الدور' : 'Role'}</th>
                    <th style={{ textAlign: 'start', padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{isAr ? 'الحالة' : 'Status'}</th>
                    <th style={{ textAlign: 'start', padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{isAr ? 'الإنضمام' : 'Joined'}</th>
                    <th style={{ textAlign: 'end', padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{isAr ? 'إجراءات' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u: any) => {
                    const rb = roleBadge[u.role] || roleBadge.student;
                    const isActive = u.is_active;
                    const isSelected = selectedIds.includes(u.id);
                    
                    return (
                      <tr key={u.id} style={{ borderBottom: '1px solid var(--border-light)', transition: 'background 0.2s', opacity: isActive ? 1 : 0.6, background: isSelected ? '#EFF6FF' : 'transparent' }} onMouseOver={(e) => { if (!isSelected) e.currentTarget.style.background = '#F9FAFB'; }} onMouseOut={(e) => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}>
                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                          <input 
                            type="checkbox" 
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedIds([...selectedIds, u.id]);
                              else setSelectedIds(selectedIds.filter(id => id !== u.id));
                            }}
                            style={{ width: 16, height: 16, cursor: 'pointer' }}
                          />
                        </td>
                        <td style={{ padding: '1rem 1.5rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ 
                              width: 44, height: 44, 
                              borderRadius: '50%', 
                              background: rb.bg, 
                              color: rb.color, 
                              display: 'flex', alignItems: 'center', justifyContent: 'center', 
                              fontWeight: 700, fontSize: 'var(--text-base)', flexShrink: 0,
                              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)'
                            }}>
                              {u.name?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: 'var(--text-sm)' }}>{u.name}</div>
                              <div style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)', marginTop: 2 }}>{u.email}</div>
                              {u.phone && <div style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>{u.phone}</div>}
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '1rem 1.5rem' }}>
                          <span style={{ 
                            display: 'inline-flex', alignItems: 'center', gap: 6, 
                            padding: '6px 12px', borderRadius: 999, 
                            background: rb.bg, color: rb.color, fontWeight: 600, fontSize: 'var(--text-xs)' 
                          }}>
                            {rb.icon}
                            {isAr ? rb.ar : rb.en}
                          </span>
                        </td>
                        <td style={{ padding: '1rem 1.5rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: isActive ? '#059669' : '#DC2626', fontWeight: 600, fontSize: 'var(--text-xs)', padding: '4px 0' }}>
                            {isActive ? <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', boxShadow: '0 0 0 3px #D1FAE5' }} /> : <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444', boxShadow: '0 0 0 3px #FEE2E2' }} />}
                            {isAr ? (isActive ? 'نشط' : 'موقوف') : (isActive ? 'Active' : 'Suspended')}
                          </div>
                        </td>
                        <td style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
                          {new Date(u.created_at).toLocaleDateString(isAr ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </td>
                        <td style={{ padding: '1rem 1.5rem', textAlign: 'end' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                            <button
                              onClick={() => handleImpersonate(u.id)}
                              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 10, color: '#6366F1', cursor: 'pointer', background: '#EEF2FF', transition: 'all 0.2s', border: '1px solid #C7D2FE', boxShadow: '0 1px 2px rgba(99,102,241,0.1)' }}
                              title={isAr ? 'تسجيل الدخول كالمستخدم (تتطلب إعادة دخول المدير لاحقاً)' : 'Login As User'}
                              onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 6px rgba(99,102,241,0.2)'; e.currentTarget.style.background = '#E0E7FF'; }}
                              onMouseOut={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 1px 2px rgba(99,102,241,0.1)'; e.currentTarget.style.background = '#EEF2FF'; }}
                            >
                              <LogIn size={18} />
                            </button>
                            <button
                              onClick={() => openModal('view', u.id)}
                              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 10, color: '#4B5563', cursor: 'pointer', background: '#F3F4F6', transition: 'all 0.2s', border: '1px solid #E5E7EB', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
                              title={isAr ? 'عرض التفاصيل' : 'View Details'}
                              onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.05)'; e.currentTarget.style.color = '#111827'; }}
                              onMouseOut={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)'; e.currentTarget.style.color = '#4B5563'; }}
                            >
                              <Eye size={18} />
                            </button>
                            <button
                              onClick={() => openModal('edit', u.id)}
                              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 10, color: '#2563EB', cursor: 'pointer', background: '#EFF6FF', transition: 'all 0.2s', border: '1px solid #BFDBFE', boxShadow: '0 1px 2px rgba(37,99,235,0.1)' }}
                              title={isAr ? 'تعديل' : 'Edit'}
                              onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 6px rgba(37,99,235,0.2)'; e.currentTarget.style.background = '#DBEAFE'; }}
                              onMouseOut={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 1px 2px rgba(37,99,235,0.1)'; e.currentTarget.style.background = '#EFF6FF'; }}
                            >
                              <Pencil size={18} />
                            </button>
                            <button
                              onClick={() => {
                                setConfirmDialog({
                                  isOpen: true,
                                  title: isAr ? 'حذف الحساب نهائياً' : 'Hard Delete Account',
                                  message: isAr ? 'تحذير: هذه العملية لا يمكن التراجع عنها، وسيتم حذف جميع البيانات المرتبطة بهذا المستخدم!' : 'Warning: This action cannot be reversed and all related user data will be wiped!',
                                  onConfirm: () => deleteMutation.mutate(u.id),
                                  isDanger: true
                                });
                              }}
                              disabled={deleteMutation.isPending && deleteMutation.variables === u.id}
                              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 10, color: '#DC2626', cursor: 'pointer', background: '#FEF2F2', transition: 'all 0.2s', border: '1px solid #FECACA', boxShadow: '0 1px 2px rgba(220,38,38,0.1)' }}
                              title={isAr ? 'حذف' : 'Delete'}
                              onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 6px rgba(220,38,38,0.2)'; e.currentTarget.style.background = '#FEE2E2'; }}
                              onMouseOut={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 1px 2px rgba(220,38,38,0.1)'; e.currentTarget.style.background = '#FEF2F2'; }}
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Pagination */}
              {meta && meta.last_page > 1 && (
                <div style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-light)' }}>
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
                    {isAr ? 'يتم عرض إجمالي' : 'Showing total'} <span style={{ fontWeight: 600, color: 'var(--text)' }}>{meta.total}</span> {isAr ? 'مستخدم' : 'users'}
                  </div>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <button 
                      disabled={page === 1}
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 10, border: '1px solid var(--border)', background: page === 1 ? 'var(--bg-muted)' : 'var(--bg-card)', cursor: page === 1 ? 'not-allowed' : 'pointer', color: 'var(--text)', transition: 'all 0.2s' }}
                      onMouseOver={(e) => { if(page !== 1) e.currentTarget.style.background = 'var(--bg-alt)'; }}
                      onMouseOut={(e) => { if(page !== 1) e.currentTarget.style.background = 'var(--bg-card)'; }}
                    >
                      {isAr ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                    </button>
                    <span style={{ minWidth: 60, textAlign: 'center', fontSize: 'var(--text-sm)', fontWeight: 600 }}>
                      {page} / {meta.last_page}
                    </span>
                    <button 
                      disabled={page === meta.last_page}
                      onClick={() => setPage(p => Math.min(meta.last_page, p + 1))}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 10, border: '1px solid var(--border)', background: page === meta.last_page ? 'var(--bg-muted)' : 'var(--bg-card)', cursor: page === meta.last_page ? 'not-allowed' : 'pointer', color: 'var(--text)', transition: 'all 0.2s' }}
                      onMouseOver={(e) => { if(page !== meta.last_page) e.currentTarget.style.background = 'var(--bg-alt)'; }}
                      onMouseOut={(e) => { if(page !== meta.last_page) e.currentTarget.style.background = 'var(--bg-card)'; }}
                    >
                      {isAr ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Bulk Actions Floating Bar */}
            {selectedIds.length > 0 && (
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: '#1E293B', color: '#fff', display: 'flex', padding: '16px 24px', alignItems: 'center', justifyContent: 'space-between', borderBottomLeftRadius: 16, borderBottomRightRadius: 16, boxShadow: '0 -4px 20px rgba(0,0,0,0.1)', animation: 'slideUp 0.3s ease-out forwards' }}>
                <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>
                  <span style={{ padding: '4px 10px', background: '#334155', borderRadius: 6, marginRight: 8, fontSize: 'var(--text-xs)' }}>{selectedIds.length}</span>
                  {isAr ? 'مستخدمين محددين' : 'Users Selected'}
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                   <button 
                      onClick={() => setConfirmDialog({
                        isOpen: true, title: isAr ? 'تفعيل المستخدمين المحددين؟' : 'Activate Selected Users?', message: isAr ? `هل أنت متأكد من تفعيل عدد ${selectedIds.length} مستخدم؟` : `Are you sure you want to activate ${selectedIds.length} users?`,
                        onConfirm: () => bulkMutation.mutate('activate'), isDanger: false
                      })}
                      className="btn-secondary" style={{ padding: '8px 16px', background: '#059669', color: '#fff', border: 'none' }}
                   >
                     {isAr ? 'تفعيل الكل' : 'Activate All'}
                   </button>
                   <button 
                      onClick={() => setConfirmDialog({
                        isOpen: true, title: isAr ? 'إيقاف المستخدمين المحددين؟' : 'Suspend Selected Users?', message: isAr ? `هل أنت متأكد من إيقاف عدد ${selectedIds.length} مستخدم؟` : `Are you sure you want to suspend ${selectedIds.length} users?`,
                        onConfirm: () => bulkMutation.mutate('suspend'), isDanger: true
                      })}
                      className="btn-secondary" style={{ padding: '8px 16px', background: '#D97706', color: '#fff', border: 'none' }}
                   >
                     {isAr ? 'إيقاف الكل' : 'Suspend All'}
                   </button>
                   <button 
                      onClick={() => setConfirmDialog({
                        isOpen: true, title: isAr ? 'حذف المستخدمين المحددين؟' : 'Delete Selected Users?', message: isAr ? `هل أنت متأكد من حذف عدد ${selectedIds.length} مستخدم بشكل نهائي؟` : `Are you sure you want to permanently delete ${selectedIds.length} users?`,
                        onConfirm: () => bulkMutation.mutate('delete'), isDanger: true
                      })}
                      className="btn-secondary" style={{ padding: '8px 16px', background: '#DC2626', color: '#fff', border: 'none' }}
                   >
                     {isAr ? 'حذف الكل' : 'Delete All'}
                   </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* CRUD / View Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={closeModal} 
        title={isAr ? 
          (modalMode === 'create' ? 'إضافة مستخدم جديد' : modalMode === 'edit' ? 'تعديل بيانات المستخدم' : 'سجل تفاصيل المستخدم') 
          : (modalMode === 'create' ? 'Add New User' : modalMode === 'edit' ? 'Edit User Details' : 'User Logs & Details')}
        maxWidth={700}
      >
        {isUserLoading && modalMode !== 'create' ? (
          <div style={{ padding: '3rem 2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div className="skeleton" style={{ width: 80, height: 80, borderRadius: '50%', marginBottom: 16 }} />
            <div className="skeleton" style={{ width: 150, height: 20, borderRadius: 4 }} />
          </div>
        ) : modalMode === 'view' && userDetails ? (
           <div style={{ display: 'flex', flexDirection: 'column' }}>
             
             {/* Tabs System for View Mode */}
             <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '1.5rem' }}>
                <button 
                  onClick={() => setViewTab('profile')}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '12px 24px', fontWeight: 600, borderBottom: `2px solid ${viewTab === 'profile' ? 'var(--primary)' : 'transparent'}`, color: viewTab === 'profile' ? 'var(--primary)' : 'var(--text-muted)', background: 'transparent', cursor: 'pointer', transition: 'all 0.2s', fontSize: 'var(--text-sm)' }}
                >
                  <UserIcon size={16} />
                  {isAr ? 'الملف الشخصي' : 'Profile Detail'}
                </button>
                <button 
                  onClick={() => setViewTab('activity')}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '12px 24px', fontWeight: 600, borderBottom: `2px solid ${viewTab === 'activity' ? 'var(--primary)' : 'transparent'}`, color: viewTab === 'activity' ? 'var(--primary)' : 'var(--text-muted)', background: 'transparent', cursor: 'pointer', transition: 'all 0.2s', fontSize: 'var(--text-sm)' }}
                >
                  <Activity size={16} />
                  {isAr ? 'سجل النشاطات' : 'Activity Logs'}
                </button>
             </div>

             {viewTab === 'profile' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', animation: 'fadeIn 0.3s ease' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', background: 'var(--bg-card)', padding: '1.5rem', borderRadius: 16, border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)' }}>
                      <div style={{ 
                        width: 80, height: 80, 
                        borderRadius: '50%', 
                        background: roleBadge[userDetails.role]?.bg || '#eee', 
                        color: roleBadge[userDetails.role]?.color || '#000', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', 
                        fontWeight: 700, fontSize: '2rem',
                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
                      }}>
                        {userDetails.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 style={{ fontSize: '1.25rem', marginBottom: 6, fontWeight: 700 }}>{userDetails.name}</h3>
                        <span style={{ 
                          display: 'inline-flex', alignItems: 'center', gap: 4, 
                          padding: '4px 10px', borderRadius: 999, 
                          background: roleBadge[userDetails.role]?.bg || '#eee', color: roleBadge[userDetails.role]?.color || '#000', fontWeight: 600, fontSize: 'var(--text-xs)' 
                        }}>
                          {roleBadge[userDetails.role]?.icon}
                          {isAr ? roleBadge[userDetails.role]?.ar : roleBadge[userDetails.role]?.en}
                        </span>
                      </div>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: '#F8FAFC', padding: '1.5rem', borderRadius: 16, border: '1px solid var(--border-light)' }}>
                      <div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: 4 }}>{isAr ? 'البريد الإلكتروني' : 'Email'}</div>
                        <div style={{ fontWeight: 600, color: 'var(--text)' }}>{userDetails.email}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: 4 }}>{isAr ? 'رقم الهاتف' : 'Phone'}</div>
                        <div style={{ fontWeight: 600, color: 'var(--text)' }}>{userDetails.phone || '-'}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: 4 }}>{isAr ? 'الحالة' : 'Status'}</div>
                        <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, color: userDetails.is_active ? '#059669' : '#DC2626' }}>
                          {userDetails.is_active ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                          {isAr ? (userDetails.is_active ? 'نشط على المنصة' : 'موقوف إدارياً') : (userDetails.is_active ? 'Platform Active' : 'Suspended')}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: 4 }}>{isAr ? 'تاريخ الانضمام' : 'Joined'}</div>
                        <div style={{ fontWeight: 600, color: 'var(--text)' }}>
                          {new Date(userDetails.created_at).toLocaleDateString(isAr ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </div>
                      </div>
                  </div>

                  {userDetails.role === 'tutor' && userDetails.tutor_profile && (
                    <div style={{ border: '1px solid var(--border)', padding: '1.5rem', borderRadius: 16, background: 'var(--bg-card)' }}>
                      <h4 style={{ marginBottom: '1rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                          <BookOpen size={18} color="var(--primary)" />
                          {isAr ? 'بيانات المعلم الإضافية' : 'Tutor Details'}
                      </h4>
                      <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid var(--border-light)', marginBottom: 8 }}>
                            <span>{isAr ? 'حالة الإعداد:' : 'Onboarding:'}</span>
                            <strong style={{ color: 'var(--text)' }}>{userDetails.tutor_profile.onboarding_status} (Step {userDetails.tutor_profile.onboarding_step})</strong>
                          </div>
                      </div>
                    </div>
                  )}
                </div>
             ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', animation: 'fadeIn 0.3s ease', maxHeight: 400, overflowY: 'auto', paddingRight: 8 }}>
                  {isActivityLoading ? (
                     <div style={{ textAlign: 'center', padding: '3rem' }}><div className="skeleton" style={{ height: 20, width: 200, margin: '0 auto' }} /></div>
                  ) : userActivity && userActivity.length > 0 ? (
                     <div style={{ position: 'relative', paddingLeft: 12, marginLeft: 12, borderLeft: '2px solid var(--border)' }}>
                        {userActivity.map((act: any, idx: number) => (
                           <div key={idx} style={{ position: 'relative', marginBottom: '1.5rem' }}>
                              <div style={{ position: 'absolute', left: -22, top: 4, width: 14, height: 14, borderRadius: '50%', background: 'var(--primary)', border: '3px solid var(--bg-card)' }} />
                              <div style={{ background: '#F8FAFC', border: '1px solid var(--border-light)', borderRadius: 12, padding: '1rem' }}>
                                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                                    <strong style={{ color: 'var(--text)', fontSize: 'var(--text-sm)' }}>{act.title}</strong>
                                    <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                      <CalendarDays size={12} />
                                      {new Date(act.date).toLocaleString(isAr ? 'ar-EG' : 'en-US')}
                                    </span>
                                 </div>
                                 <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{act.description}</p>
                              </div>
                           </div>
                        ))}
                     </div>
                  ) : (
                     <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                        <Activity size={48} style={{ opacity: 0.2, margin: '0 auto 1rem' }} />
                        <p>{isAr ? 'لا توجد نشاطات مسجلة بعد' : 'No recent activity recorded yet'}</p>
                     </div>
                  )}
                </div>
             )}
           </div>
        ) : (
          <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="input-group">
              <label className="input-label">{isAr ? 'الاسم كامل' : 'Full Name'}</label>
              <input required className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder={isAr ? 'أدخل الاسم الثلاثي' : 'Enter full name'} />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              <div className="input-group">
                <label className="input-label">{isAr ? 'البريد الإلكتروني' : 'Email'}</label>
                <input required type="email" className="input" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="example@email.com" />
              </div>
              <div className="input-group">
                <label className="input-label">{isAr ? 'رقم الهاتف' : 'Phone'}</label>
                <input className="input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+201000000000" />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              <div className="input-group">
                <label className="input-label">{isAr ? 'كلمة المرور' : 'Password'}</label>
                <input 
                  required={modalMode === 'create'} 
                  type="password" 
                  className="input" 
                  value={form.password} 
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))} 
                  placeholder={modalMode === 'edit' ? (isAr ? '(اتركه فارغا لعدم التغيير)' : '(Leave empty to keep)') : '********'} 
                  minLength={8}
                />
              </div>
              <div className="input-group">
                <label className="input-label">{isAr ? 'الدور الإداري' : 'Role Assign'}</label>
                <select 
                  className="input select" 
                  value={form.role} 
                  onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                  disabled={modalMode === 'edit'}
                  style={{ 
                    ...(modalMode === 'edit' ? { background: 'var(--bg-muted)', cursor: 'not-allowed', color: 'var(--text-muted)' } : {}),
                    fontWeight: 600 
                  }}
                >
                  <option value="student">{isAr ? 'طالب (Student)' : 'Student'}</option>
                  <option value="tutor">{isAr ? 'معلم (Tutor)' : 'Tutor'}</option>
                  <option value="admin">{isAr ? 'مدير منصة (Admin)' : 'Admin'}</option>
                </select>
                {modalMode === 'edit' && <span style={{ fontSize: 11, color: 'var(--warning)', marginTop: 4 }}>{isAr ? ' ⚠️لا يمكن تغيير الدور بعد الإنشاء لضمان استقرار البيانات' : '⚠️ Cannot cleanly modify role after genesis'}</span>}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
              <button 
                type="button" 
                onClick={closeModal} 
                style={{ padding: '12px 24px', borderRadius: '12px', background: 'var(--bg-alt)', color: 'var(--text)', fontWeight: 600, transition: 'all 0.2s', border: '1px solid var(--border)' }}
                onMouseOver={(e) => { e.currentTarget.style.background = '#E5E7EB'; }}
                onMouseOut={(e) => { e.currentTarget.style.background = 'var(--bg-alt)'; }}
              >
                {isAr ? 'إلغاء الأمر' : 'Cancel'}
              </button>
              <button 
                 type="submit" 
                 disabled={createMutation.isPending || updateMutation.isPending} 
                 className="btn-primary" 
                 style={{ 
                    padding: '12px 28px', 
                    borderRadius: '12px', 
                    fontWeight: 700, 
                    boxShadow: '0 4px 14px 0 rgba(27, 73, 101, 0.39)',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)' 
                 }}
                 onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(27, 73, 101, 0.5)'; }}
                 onMouseOut={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 14px 0 rgba(27, 73, 101, 0.39)'; }}
              >
                {createMutation.isPending || updateMutation.isPending ? '...' : (isAr ? 'حفظ التغييرات' : 'Save Changes')}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Confirm Dialog Modal Layer */}
      <Modal 
        isOpen={!!confirmDialog?.isOpen} 
        onClose={() => setConfirmDialog(null)} 
        title={confirmDialog?.title || ''} 
        maxWidth={450}
      >
        {confirmDialog && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', textAlign: 'center', padding: '1rem 0 0.5rem' }}>
            <div style={{ margin: '0 auto', width: 64, height: 64, borderRadius: '50%', background: confirmDialog.isDanger ? '#FEE2E2' : '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: confirmDialog.isDanger ? '#DC2626' : '#D97706', boxShadow: `0 0 0 8px ${confirmDialog.isDanger ? '#FEF2F2' : '#FFFBEB'}` }}>
              <AlertTriangle size={32} />
            </div>
            
            <div style={{ marginTop: 8 }}>
              <p style={{ fontSize: '1.05rem', color: 'var(--text)', fontWeight: 500, lineHeight: 1.6 }}>{confirmDialog.message}</p>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <button 
                onClick={() => setConfirmDialog(null)} 
                style={{ flex: 1, padding: '12px', borderRadius: 12, background: 'var(--bg-muted)', color: 'var(--text-secondary)', fontWeight: 600, transition: 'all 0.2s', border: '1px solid var(--border)' }} 
                onMouseOver={(e) => e.currentTarget.style.background = '#E5E7EB'} 
                onMouseOut={(e) => e.currentTarget.style.background = 'var(--bg-muted)'}
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button 
                onClick={confirmDialog.onConfirm} 
                disabled={deleteMutation.isPending || toggleActiveMutation.isPending || bulkMutation.isPending}
                style={{ 
                  flex: 1, 
                  padding: '12px', 
                  borderRadius: 12, 
                  background: confirmDialog.isDanger ? '#DC2626' : '#D97706', 
                  color: '#fff', 
                  fontWeight: 600, 
                  boxShadow: `0 4px 14px ${confirmDialog.isDanger ? 'rgba(220,38,38,0.3)' : 'rgba(217,119,6,0.3)'}`, 
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  border: 'none',
                  cursor: 'pointer'
                }}
                onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 6px 20px ${confirmDialog.isDanger ? 'rgba(220,38,38,0.4)' : 'rgba(217,119,6,0.4)'}`; }}
                onMouseOut={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = `0 4px 14px ${confirmDialog.isDanger ? 'rgba(220,38,38,0.3)' : 'rgba(217,119,6,0.3)'}`; }}
              >
                {(deleteMutation.isPending || toggleActiveMutation.isPending || bulkMutation.isPending) ? '...' : (isAr ? 'تأكيد الإجراء' : 'Confirm Action')}
              </button>
            </div>
          </div>
        )}
      </Modal>
      
      {/* Global Slide-up Keyframe injected via style tag for bulk bar */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}}/>
    </>
  );
}
