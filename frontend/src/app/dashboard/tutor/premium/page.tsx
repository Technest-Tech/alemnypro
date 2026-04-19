'use client';
import { useLocale } from '@/lib/locale';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PremiumTab from '../components/PremiumTab';

export default function PremiumPage() {
  const { locale } = useLocale();
  const isAr = locale === 'ar';
  return (
    <DashboardLayout role="tutor">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#1A1A2E', letterSpacing: '-0.02em' }}>
          ⚡ {isAr ? 'AlemnyPro بريميوم' : 'AlemnyPro Premium'}
        </h1>
        <p style={{ fontSize: '0.875rem', color: '#6B7280', marginTop: 4 }}>
          {isAr ? 'درِّس أكثر. اكسب أكثر. مع ميزات حصرية للمعلمين المحترفين' : 'Teach more. Earn more. With exclusive features for professional tutors'}
        </p>
      </div>
      <PremiumTab isAr={isAr} />
    </DashboardLayout>
  );
}
