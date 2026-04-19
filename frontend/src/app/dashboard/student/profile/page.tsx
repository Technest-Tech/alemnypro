'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studentApi } from '@/lib/api';
import StudentLayout from '@/components/layout/StudentLayout';
import { useLocale } from '@/lib/locale';

// ─── Types ────────────────────────────────────────────────────────────────────

interface StudentProfile {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  locale: string;
  email_verified_at: string | null;
  phone_verified_at: string | null;
  wallet_balance: string;
  created_at: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

// ─── Reusable Field Row ───────────────────────────────────────────────────────

function FieldRow({ label, value, hint, badge, ltr }: {
  label: string;
  value: string;
  hint?: string;
  badge?: { text: string; color: string; bg: string };
  ltr?: boolean;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}
      </label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: '#111827' }} dir={ltr ? 'ltr' : undefined}>
          {value || '—'}
        </div>
        {badge && (
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '2px 9px', borderRadius: 100,
            background: badge.bg, color: badge.color,
          }}>
            {badge.text}
          </span>
        )}
      </div>
      {hint && <div style={{ fontSize: 11, color: '#9CA3AF' }}>{hint}</div>}
    </div>
  );
}


// ─── Section Card ─────────────────────────────────────────────────────────────

function SectionCard({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.85)',
      backdropFilter: 'blur(20px)',
      borderRadius: 20,
      border: '1px solid rgba(27,73,101,0.1)',
      boxShadow: '0 4px 24px rgba(27,73,101,0.06)',
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '18px 24px',
        borderBottom: '1px solid rgba(27,73,101,0.08)',
        display: 'flex', alignItems: 'center', gap: 10,
        background: 'linear-gradient(135deg, rgba(27,73,101,0.04), rgba(45,106,142,0.02))',
      }}>
        <span style={{ fontSize: 20 }}>{icon}</span>
        <span style={{ fontSize: 15, fontWeight: 800, color: '#1A1A2E' }}>{title}</span>
      </div>
      <div style={{ padding: 24 }}>{children}</div>
    </div>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ message, type, onDone }: { message: string; type: 'success' | 'error'; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3500);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div style={{
      position: 'fixed', top: 24, insetInlineEnd: 24, zIndex: 9999,
      padding: '14px 20px', borderRadius: 14, maxWidth: 360,
      background: type === 'success' ? 'linear-gradient(135deg, #059669, #047857)' : 'linear-gradient(135deg, #E11D48, #BE123C)',
      color: '#fff', fontWeight: 700, fontSize: 14,
      boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
      display: 'flex', alignItems: 'center', gap: 10,
      animation: 'slideIn 0.3s ease',
    }}>
      <span>{type === 'success' ? '✅' : '❌'}</span>
      <span>{message}</span>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function StudentProfilePage() {
  const { locale } = useLocale();
  const isAr = locale === 'ar';
  const qc = useQueryClient();
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // State
  const [editMode, setEditMode]   = useState(false);
  const [pwMode, setPwMode]       = useState(false);
  const [toast, setToast]         = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging]       = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', locale: 'ar' });
  const [pw, setPw]     = useState({ current_password: '', password: '', password_confirmation: '' });

  const showToast = useCallback((msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
  }, []);

  // Profile query
  const { data: profileData, isLoading } = useQuery({
    queryKey: ['student-profile'],
    queryFn: () => studentApi.getProfile().then(r => r.data.data as StudentProfile),
  });

  // Sync form with loaded profile
  useEffect(() => {
    if (profileData) {
      setForm({
        name:   profileData.name   || '',
        email:  profileData.email  || '',
        phone:  profileData.phone  || '',
        locale: profileData.locale || 'ar',
      });
    }
  }, [profileData]);

  // Update profile
  const updateMut = useMutation({
    mutationFn: () => studentApi.updateProfile({
      name:   form.name   || undefined,
      email:  form.email  || undefined,
      phone:  form.phone  || undefined,
      locale: form.locale || undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['student-profile'] });
      setEditMode(false);
      showToast(isAr ? 'تم تحديث الملف الشخصي ✨' : 'Profile updated ✨', 'success');
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'حدث خطأ';
      showToast(msg, 'error');
    },
  });

  // Avatar upload
  const avatarMut = useMutation({
    mutationFn: (file: File) => {
      const fd = new FormData();
      fd.append('avatar', file);
      return studentApi.uploadAvatar(fd);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['student-profile'] });
      setAvatarPreview(null);
      showToast(isAr ? 'تم تحديث الصورة الشخصية 📸' : 'Avatar updated 📸', 'success');
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'فشل رفع الصورة';
      showToast(msg, 'error');
    },
  });

  // Change password
  const pwMut = useMutation({
    mutationFn: () => studentApi.changePassword(pw),
    onSuccess: () => {
      setPwMode(false);
      setPw({ current_password: '', password: '', password_confirmation: '' });
      showToast(isAr ? 'تم تغيير كلمة المرور بنجاح 🔐' : 'Password changed 🔐', 'success');
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'فشل تغيير كلمة المرور';
      showToast(msg, 'error');
    },
  });

  const handleFileSelect = (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { showToast(isAr ? 'يرجى اختيار صورة' : 'Please pick an image', 'error'); return; }
    if (file.size > 4 * 1024 * 1024)    { showToast(isAr ? 'الصورة أكبر من 4MB' : 'Image exceeds 4MB', 'error'); return; }
    const url = URL.createObjectURL(file);
    setAvatarPreview(url);
    avatarMut.mutate(file);
  };

  const profile = profileData;

  // ── Styles ───────────────────────────────────────────────────────────────────
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '11px 14px', borderRadius: 12,
    border: '1.5px solid #E5E7EB', fontSize: 14, fontFamily: 'inherit',
    background: 'rgba(255,255,255,0.9)', color: '#111827',
    outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s',
  };
  const btnPrimary: React.CSSProperties = {
    padding: '10px 24px', borderRadius: 12, border: 'none', cursor: 'pointer',
    background: 'linear-gradient(135deg, #1B4965, #2D6A8E)', color: '#fff',
    fontWeight: 700, fontSize: 14, fontFamily: 'inherit',
    boxShadow: '0 3px 12px rgba(27,73,101,0.3)', transition: 'opacity 0.2s',
  };
  const btnSecondary: React.CSSProperties = {
    padding: '10px 24px', borderRadius: 12, cursor: 'pointer',
    background: 'rgba(27,73,101,0.06)', color: '#1B4965', fontFamily: 'inherit',
    border: '1.5px solid rgba(27,73,101,0.2)', fontWeight: 700, fontSize: 14,
    transition: 'background 0.2s',
  };

  return (
    <StudentLayout
      title={isAr ? '👤 ملفي الشخصي' : '👤 My Profile'}
      subtitle={isAr ? 'إدارة بياناتك الشخصية وإعداداتك' : 'Manage your personal information and settings'}
    >
      {/* Global animations */}
      <style>{`
        @keyframes slideIn { from { opacity: 0; transform: translateY(-12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse  { 0%,100% { opacity: 1; } 50% { opacity: .5; } }
        .profile-input:focus { border-color: #1B4965 !important; box-shadow: 0 0 0 3px rgba(27,73,101,0.1); }
      `}</style>

      {/* Toast */}
      {toast && <Toast message={toast.msg} type={toast.type} onDone={() => setToast(null)} />}

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: '#9CA3AF' }}>
          <div style={{ fontSize: 40, animation: 'pulse 1.5s infinite' }}>⏳</div>
          <div style={{ marginTop: 12, fontWeight: 600 }}>{isAr ? 'جاري التحميل...' : 'Loading...'}</div>
        </div>
      ) : !profile ? (
        <div style={{ textAlign: 'center', padding: 80, color: '#9CA3AF' }}>
          {isAr ? 'تعذّر تحميل البيانات' : 'Failed to load profile'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* ── Hero Card ── */}
          <div style={{
            background: 'linear-gradient(135deg, #1B4965 0%, #2D6A8E 60%, #3A82A8 100%)',
            borderRadius: 24, padding: '36px 32px',
            display: 'flex', alignItems: 'center', gap: 28, flexWrap: 'wrap',
            boxShadow: '0 8px 40px rgba(27,73,101,0.28)',
          }}>
            {/* Avatar */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              {/* Drop zone */}
              <div
                onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={e => { e.preventDefault(); setIsDragging(false); handleFileSelect(e.dataTransfer.files[0] || null); }}
                onClick={() => avatarInputRef.current?.click()}
                style={{
                  width: 100, height: 100, borderRadius: '50%', cursor: 'pointer',
                  border: `3px solid ${isDragging ? '#38BDF8' : 'rgba(255,255,255,0.4)'}`,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
                  overflow: 'hidden', position: 'relative',
                  transition: 'border-color 0.2s, transform 0.2s',
                  transform: isDragging ? 'scale(1.05)' : 'scale(1)',
                }}>
                {avatarPreview || profile.avatar ? (
                  <img src={avatarPreview || profile.avatar!}
                    alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{
                    width: '100%', height: '100%', background: 'rgba(255,255,255,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 32, fontWeight: 900, color: '#fff',
                  }}>
                    {initials(profile.name)}
                  </div>
                )}
                {/* Hover overlay */}
                <div style={{
                  position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  opacity: 0, transition: 'opacity 0.2s',
                }}
                  className="avatar-overlay"
                  onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '0')}>
                  <span style={{ fontSize: 22 }}>📷</span>
                </div>
              </div>
              <input ref={avatarInputRef} type="file" accept="image/*" style={{ display: 'none' }}
                onChange={e => handleFileSelect(e.target.files?.[0] || null)} />
              {avatarMut.isPending && (
                <div style={{
                  position: 'absolute', inset: 0, borderRadius: '50%',
                  background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <div style={{ width: 24, height: 24, border: '3px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                </div>
              )}
              <div style={{
                position: 'absolute', bottom: 2, insetInlineEnd: 2,
                width: 28, height: 28, borderRadius: '50%', background: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, boxShadow: '0 2px 8px rgba(0,0,0,0.2)', cursor: 'pointer',
              }}
                onClick={() => avatarInputRef.current?.click()}>✏️</div>
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 200 }}>
              <h2 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: '#fff' }}>{profile.name}</h2>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', marginTop: 5 }}>{profile.email}</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, padding: '4px 12px', borderRadius: 100, background: profile.email_verified_at ? 'rgba(5,150,105,0.25)' : 'rgba(217,119,6,0.25)', color: profile.email_verified_at ? '#A7F3D0' : '#FDE68A', fontWeight: 700 }}>
                  {profile.email_verified_at ? '✅' : '⚠️'} {isAr ? (profile.email_verified_at ? 'البريد مُفعّل' : 'بريد غير مُفعّل') : (profile.email_verified_at ? 'Email Verified' : 'Email Unverified')}
                </span>
                {profile.phone && (
                  <span style={{ fontSize: 11, padding: '4px 12px', borderRadius: 100, background: profile.phone_verified_at ? 'rgba(5,150,105,0.25)' : 'rgba(217,119,6,0.25)', color: profile.phone_verified_at ? '#A7F3D0' : '#FDE68A', fontWeight: 700 }}>
                    {profile.phone_verified_at ? '✅' : '⚠️'} {isAr ? (profile.phone_verified_at ? 'الهاتف مُفعّل' : 'هاتف غير مُفعّل') : (profile.phone_verified_at ? 'Phone Verified' : 'Phone Unverified')}
                  </span>
                )}
                <span style={{ fontSize: 11, padding: '4px 12px', borderRadius: 100, background: 'rgba(255,255,255,0.15)', color: '#fff', fontWeight: 700 }}>
                  💰 {Number(profile.wallet_balance || 0).toLocaleString()} {isAr ? 'جنيه' : 'EGP'}
                </span>
              </div>
            </div>

            {/* Edit button */}
            <button onClick={() => { setEditMode(true); setPwMode(false); }}
              style={{ ...btnSecondary, background: 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.3)', color: '#fff', flexShrink: 0 }}>
              ✏️ {isAr ? 'تعديل الملف' : 'Edit Profile'}
            </button>
          </div>

          {/* ── Edit Form ── */}
          {editMode && (
            <SectionCard title={isAr ? 'تعديل البيانات الشخصية' : 'Edit Personal Information'} icon="✏️">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 18 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#6B7280', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {isAr ? 'الاسم الكامل' : 'Full Name'}
                  </label>
                  <input className="profile-input" style={inputStyle} value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder={isAr ? 'اسمك الكامل' : 'Your full name'} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#6B7280', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {isAr ? 'البريد الإلكتروني' : 'Email Address'}
                  </label>
                  <input className="profile-input" style={inputStyle} type="email" value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="example@email.com" />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#6B7280', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {isAr ? 'رقم الهاتف' : 'Phone Number'}
                  </label>
                  <input className="profile-input" style={inputStyle} type="tel" value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="01XXXXXXXXX" dir="ltr" />
                </div>

              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
                <button style={btnSecondary} onClick={() => setEditMode(false)}>{isAr ? 'إلغاء' : 'Cancel'}</button>
                <button style={{ ...btnPrimary, opacity: updateMut.isPending ? 0.7 : 1 }}
                  onClick={() => updateMut.mutate()} disabled={updateMut.isPending}>
                  {updateMut.isPending ? (isAr ? 'جاري الحفظ...' : 'Saving...') : (isAr ? '💾 حفظ التغييرات' : '💾 Save Changes')}
                </button>
              </div>
            </SectionCard>
          )}

          {/* ── Personal Info (read mode) ── */}
          {!editMode && (
            <SectionCard title={isAr ? 'المعلومات الشخصية' : 'Personal Information'} icon="👤">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px,1fr))', gap: 24 }}>

                <FieldRow label={isAr ? 'الاسم الكامل' : 'Full Name'} value={profile.name} />

                <FieldRow
                  label={isAr ? 'البريد الإلكتروني' : 'Email'}
                  value={profile.email}
                  badge={profile.email_verified_at
                    ? { text: isAr ? '✅ مُفعّل' : '✅ Verified',     color: '#065F46', bg: 'rgba(5,150,105,0.12)' }
                    : { text: isAr ? '⚠️ غير مُفعّل' : '⚠️ Unverified', color: '#92400E', bg: 'rgba(217,119,6,0.12)'  }}
                />

                <FieldRow
                  label={isAr ? 'رقم الهاتف' : 'Phone'}
                  value={profile.phone || (isAr ? 'غير محدد' : 'Not set')}
                  ltr
                  badge={profile.phone
                    ? (profile.phone_verified_at
                        ? { text: isAr ? '✅ مُفعّل' : '✅ Verified',     color: '#065F46', bg: 'rgba(5,150,105,0.12)' }
                        : { text: isAr ? '⚠️ غير مُفعّل' : '⚠️ Unverified', color: '#92400E', bg: 'rgba(217,119,6,0.12)'  })
                    : undefined}
                />

                <FieldRow
                  label={isAr ? 'تاريخ الانضمام' : 'Member Since'}
                  value={new Date(profile.created_at).toLocaleDateString(isAr ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                />

                <FieldRow
                  label={isAr ? 'رصيد المحفظة' : 'Wallet Balance'}
                  value={`${Number(profile.wallet_balance || 0).toLocaleString()} ${isAr ? 'جنيه' : 'EGP'}`}
                  badge={{ text: isAr ? 'متاح' : 'Available', color: '#1B4965', bg: 'rgba(27,73,101,0.1)' }}
                />

              </div>
            </SectionCard>
          )}



          {/* ── Change Password ── */}
          <SectionCard title={isAr ? 'تغيير كلمة المرور' : 'Change Password'} icon="🔐">
            {!pwMode ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 14, color: '#374151', fontWeight: 600 }}>
                    {isAr ? 'حافظ على حسابك آمناً بكلمة مرور قوية' : 'Keep your account secure with a strong password'}
                  </div>
                  <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>
                    {isAr ? 'لم يتم تغيير كلمة المرور مؤخراً' : 'Password was not changed recently'}
                  </div>
                </div>
                <button style={btnSecondary} onClick={() => { setPwMode(true); setEditMode(false); }}>
                  🔑 {isAr ? 'تغيير كلمة المرور' : 'Change Password'}
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 400 }}>
                {[
                  { key: 'current_password', label: isAr ? 'كلمة المرور الحالية' : 'Current Password' },
                  { key: 'password',         label: isAr ? 'كلمة المرور الجديدة' : 'New Password'     },
                  { key: 'password_confirmation', label: isAr ? 'تأكيد كلمة المرور' : 'Confirm New Password' },
                ].map(({ key, label }) => (
                  <div key={key}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#6B7280', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {label}
                    </label>
                    <input type="password" className="profile-input" style={inputStyle}
                      value={pw[key as keyof typeof pw]}
                      onChange={e => setPw(p => ({ ...p, [key]: e.target.value }))}
                      placeholder="••••••••" dir="ltr" />
                  </div>
                ))}
                <div style={{ display: 'flex', gap: 10 }}>
                  <button style={btnSecondary} onClick={() => { setPwMode(false); setPw({ current_password: '', password: '', password_confirmation: '' }); }}>
                    {isAr ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button style={{ ...btnPrimary, opacity: pwMut.isPending ? 0.7 : 1 }}
                    onClick={() => pwMut.mutate()} disabled={pwMut.isPending}>
                    {pwMut.isPending ? (isAr ? 'جاري التغيير...' : 'Changing...') : (isAr ? '🔐 تأكيد التغيير' : '🔐 Confirm Change')}
                  </button>
                </div>
              </div>
            )}
          </SectionCard>


        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .avatar-overlay { opacity: 0 !important; }
        div:hover > .avatar-overlay { opacity: 1 !important; }
      `}</style>
    </StudentLayout>
  );
}
