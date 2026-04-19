'use client';

import tabStyles from './tabs.module.css';

interface Props { isAr: boolean; }

const FEATURES = [
  {
    icon: '🚫',
    nameAr: 'عمولة صفر',
    nameEn: '0% Commission',
    descAr: 'احتفظ بـ 100% من أرباحك — لا رسوم للمنصة',
    descEn: 'Keep 100% of your earnings — no platform fees',
  },
  {
    icon: '🔍',
    nameAr: 'تعزيز SEO',
    nameEn: 'SEO Boost',
    descAr: 'ملفك يظهر أولاً في نتائج البحث دائماً',
    descEn: 'Your profile always appears first in search results',
  },
  {
    icon: '🤖',
    nameAr: 'مساعد كتابة AI',
    nameEn: 'AI Writing Assistant',
    descAr: 'توليد أوصاف احترافية لدروسك تلقائياً',
    descEn: 'Auto-generate professional course descriptions',
  },
  {
    icon: '✅',
    nameAr: 'شارة معلم موصى به',
    nameEn: 'Recommended Badge',
    descAr: 'شارة مميزة تزيد الثقة وتضاعف الحجوزات',
    descEn: 'A trust badge that doubles booking conversion',
  },
  {
    icon: '📊',
    nameAr: 'تحليلات متقدمة',
    nameEn: 'Advanced Analytics',
    descAr: 'تقارير مفصلة عن ظهورك وأداؤك',
    descEn: 'Detailed reports on your profile performance',
  },
  {
    icon: '💬',
    nameAr: 'دعم مخصص',
    nameEn: 'Priority Support',
    descAr: 'خط دعم مباشر مع فريق AlemnyPro',
    descEn: 'Direct support line with the AlemnyPro team',
  },
];

const COMPARE_ROWS = [
  { featureAr: 'ظهور في البحث', featureEn: 'Search Visibility', free: '✓', pro: '✓ مميز / Priority' },
  { featureAr: 'عمولة المنصة',  featureEn: 'Platform Commission', free: '15%', pro: '0%' },
  { featureAr: 'مساعد AI للكتابة', featureEn: 'AI Writing Assistant', free: '✗', pro: '✓' },
  { featureAr: 'باقات الأسعار',    featureEn: 'Pricing Packs',     free: '✗', pro: '✓' },
  { featureAr: 'تحليلات متقدمة',    featureEn: 'Advanced Analytics', free: '✗', pro: '✓' },
  { featureAr: 'شارة موصى به',      featureEn: 'Recommended Badge',  free: '✗', pro: '✓' },
];

export default function PremiumTab({ isAr }: Props) {
  return (
    <div>
      {/* Hero Card */}
      <div className={tabStyles.premiumHero}>
        <div className={tabStyles.premiumBadge}>
          ⚡ {isAr ? 'بريميوم' : 'Premium'} Pro
        </div>
        <h2 className={tabStyles.premiumTitle}>
          {isAr ? 'دَرِّس أكثر. اكسب أكثر.' : 'Teach more. Earn more.'}
        </h2>
        <p className={tabStyles.premiumSubtitle}>
          {isAr
            ? 'انضم إلى آلاف المعلمين المحترفين الذين يستخدمون AlemnyPro Premium ليتفوقوا على المنافسين ويحققوا دخلاً مضاعفاً.'
            : 'Join thousands of professional tutors using AlemnyPro Premium to outrank competitors and multiply their income.'}
        </p>

        <div className={tabStyles.premiumFeatures}>
          {FEATURES.map(f => (
            <div key={f.nameEn} className={tabStyles.premiumFeature}>
              <div className={tabStyles.premiumFeatureIcon}>{f.icon}</div>
              <div className={tabStyles.premiumFeatureName}>{isAr ? f.nameAr : f.nameEn}</div>
              <div className={tabStyles.premiumFeatureDesc}>{isAr ? f.descAr : f.descEn}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
          <button className={tabStyles.premiumCTA}>
            ⚡ {isAr ? 'ابدأ مجاناً ٧ أيام' : 'Start 7-Day Free Trial'}
            <span style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 6, padding: '2px 8px', fontSize: '0.75rem' }}>
              {isAr ? 'لا بطاقة مطلوبة' : 'No card needed'}
            </span>
          </button>
          <div>
            <div className={tabStyles.premiumPrice}>
              {isAr ? '٢٩٩ ج.م/شهر' : '299 EGP/month'}
            </div>
            <div className={tabStyles.premiumPriceNew} style={{ color: '#fff' }}>
              🎁 {isAr ? '١٩٩ ج.م/شهر (طرح خاص)' : '199 EGP/month (launch offer)'}
            </div>
          </div>
        </div>
      </div>

      {/* Compare Table */}
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#1A1A2E', marginBottom: 16 }}>
          📊 {isAr ? 'مجاني مقابل بريميوم' : 'Free vs Premium'}
        </h3>
        <div style={{ overflowX: 'auto' }}>
          <table className={tabStyles.compareTable}>
            <thead>
              <tr>
                <th style={{ width: '40%' }}>{isAr ? 'الميزة' : 'Feature'}</th>
                <th>{isAr ? 'مجاني' : 'Free'}</th>
                <th>⚡ Premium Pro</th>
              </tr>
            </thead>
            <tbody>
              {COMPARE_ROWS.map(row => (
                <tr key={row.featureEn}>
                  <td style={{ fontWeight: 600 }}>{isAr ? row.featureAr : row.featureEn}</td>
                  <td style={{ textAlign: 'center' }}>
                    {row.free === '✗'
                      ? <span className={tabStyles.compareCross}>✕</span>
                      : <span style={{ color: '#374151', fontSize: '0.8125rem' }}>{row.free}</span>}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {row.pro.startsWith('✓')
                      ? <span className={tabStyles.compareCheck}>{row.pro}</span>
                      : <span style={{ color: '#059669', fontWeight: 700, fontSize: '0.8125rem' }}>{row.pro}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Testimonials */}
      <div>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#1A1A2E', marginBottom: 16 }}>
          💬 {isAr ? 'ماذا يقول معلمونا' : 'What Our Tutors Say'}
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          {[
            { name: 'Mona Gamal', nameAr: 'منى جمال', subjectAr: 'رياضيات', subjectEn: 'Mathematics', quoteAr: 'تضاعفت حجوزاتي في أول شهر بعد الاشتراك!', quoteEn: 'My bookings doubled in the first month after subscribing!' },
            { name: 'Kareem Salah', nameAr: 'كريم صلاح', subjectAr: 'فيزياء', subjectEn: 'Physics', quoteAr: 'مساعد AI وفّر عليّ ساعات من الكتابة.', quoteEn: 'The AI assistant saved me hours of writing. Worth every penny.' },
            { name: 'Yasmine Fathy', nameAr: 'ياسمين فتحي', subjectAr: 'كيمياء', subjectEn: 'Chemistry', quoteAr: 'بفضل 0% عمولة، أصبح دخلي الصافي أعلى بكثير.', quoteEn: '0% commission means my net income is so much higher.' },
          ].map(t => (
            <div key={t.name} style={{
              background: 'rgba(255,255,255,0.8)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.5)',
              borderRadius: 16,
              padding: '20px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
            }}>
              <p style={{ fontSize: '0.875rem', color: '#374151', lineHeight: 1.6, fontStyle: 'italic', marginBottom: 14 }}>
                &ldquo;{isAr ? t.quoteAr : t.quoteEn}&rdquo;
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #0F766E, #0D9488)',
                  color: '#fff', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: 13, fontWeight: 800, flexShrink: 0,
                }}>
                  {(isAr ? t.nameAr : t.name).charAt(0)}
                </div>
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1A1A2E' }}>{isAr ? t.nameAr : t.name}</div>
                  <div style={{ fontSize: '0.6875rem', color: '#9CA3AF' }}>{isAr ? t.subjectAr : t.subjectEn}</div>
                </div>
                <span style={{ marginInlineStart: 'auto', fontSize: '0.75rem', color: '#F59E0B', fontWeight: 800 }}>⭐ Pro</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
