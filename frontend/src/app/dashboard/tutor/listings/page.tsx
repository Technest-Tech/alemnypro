'use client';
import { useLocale } from '@/lib/locale';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ListingsTab from '../components/ListingsTab';

export default function ListingsPage() {
  const { locale } = useLocale();
  const isAr = locale === 'ar';
  return (
    <DashboardLayout role="tutor">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#1A1A2E', letterSpacing: '-0.02em' }}>
          🏷️ {isAr ? 'إعلاناتي وملفي المهني' : 'My Listings & Profile'}
        </h1>
        <p style={{ fontSize: '0.875rem', color: '#6B7280', marginTop: 4 }}>
          {isAr ? 'أدر نبذتك وأسعارك وفيديو التعريف لجذب المزيد من الطلاب' : 'Manage your bio, pricing, and intro video to attract more students'}
        </p>
      </div>
      <ListingsTab isAr={isAr} />
    </DashboardLayout>
  );
}
