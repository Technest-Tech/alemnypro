import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocale } from '@/lib/locale';
import { tutorApi, publicApi } from '@/lib/api';
import { toast } from 'react-hot-toast';

interface Props {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function CreateSessionForm({ onSuccess, onCancel }: Props) {
  const { locale } = useLocale();
  const isAr = locale === 'ar';
  const queryClient = useQueryClient();

  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    subject_id: '',
    title_ar: '',
    title_en: '',
    description_ar: '',
    description_en: '',
    lesson_format: 'online',
    pricing_model: 'per_seat',
    seat_price: '',
    max_capacity: '10',
    min_threshold: '4',
    is_first_session_free: false,
    session_date: '',
    session_time: '',
    duration_minutes: '60',
  });

  const { data: subjectsResponse } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => publicApi.getSubjects().then(r => r.data),
  });
  
  const subjects = subjectsResponse?.data || [];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (name === 'min_threshold') {
      if (parseInt(value) > parseInt(formData.max_capacity)) {
        toast.error(isAr ? 'الحد الأدنى لا يمكن أن يتجاوز الحد الأقصى' : 'Minimum threshold cannot exceed max capacity');
        return;
      }
    }
    if (name === 'max_capacity') {
      if (parseInt(formData.min_threshold) > parseInt(value)) {
        setFormData(prev => ({ ...prev, min_threshold: value, [name]: value }));
        return;
      }
    }

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await tutorApi.createGroupSession({
        ...formData,
        subject_id: Number(formData.subject_id),
        seat_price: Number(formData.seat_price),
        max_capacity: Number(formData.max_capacity),
        min_threshold: Number(formData.min_threshold),
        duration_minutes: Number(formData.duration_minutes),
      });

      toast.success(isAr ? 'تم إنشاء الجلسة بنجاح!' : 'Group session created successfully!');
      queryClient.invalidateQueries({ queryKey: ['tutor-group-sessions'] });
      onSuccess();
    } catch (err: any) {
      toast.error(err.response?.data?.message || (isAr ? 'حدث خطأ ما' : 'An error occurred'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={{ fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 6 }}>
            {isAr ? 'المادة الدراسية' : 'Subject'}
          </label>
          <select name="subject_id" className="input select" value={formData.subject_id} onChange={handleInputChange} required style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
            <option value="">{isAr ? 'اختر المادة' : 'Select a subject'}</option>
            {subjects.map((s: any) => (
              <option key={s.id} value={s.id}>{isAr ? s.name_ar : s.name_en}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 6 }}>
            {isAr ? 'عنوان الجلسة' : 'Session Title'}
          </label>
          <input type="text" name="title_ar" className="input" value={formData.title_ar} onChange={handleInputChange} required placeholder={isAr ? 'مراجعة ليلة الامتحان' : 'Final Revision'} style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '10px' }} />
        </div>

        <div>
          <label style={{ fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 6 }}>
            {isAr ? 'التسعير (ج.م)' : 'Seat Price (EGP)'}
          </label>
          <input type="number" name="seat_price" className="input" min="0" value={formData.seat_price} onChange={handleInputChange} required style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '10px' }} />
        </div>

        <div style={{ gridColumn: '1 / -1' }}>
          <label style={{ fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 6 }}>
            {isAr ? 'وصف الجلسة' : 'Description'}
          </label>
          <textarea name="description_ar" className="input" rows={3} value={formData.description_ar} onChange={handleInputChange} required placeholder={isAr ? 'ماذا سيتعلم الطلاب؟' : 'What will students learn?'} style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '10px', resize: 'vertical' }} />
        </div>

        <div>
          <label style={{ fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 6 }}>{isAr ? 'تاريخ الجلسة' : 'Date'}</label>
          <input type="date" name="session_date" className="input" min={new Date().toISOString().split('T')[0]} value={formData.session_date} onChange={handleInputChange} required style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '10px' }} />
        </div>
        
        <div>
          <label style={{ fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 6 }}>{isAr ? 'الوقت' : 'Time'}</label>
          <input type="time" name="session_time" className="input" value={formData.session_time} onChange={handleInputChange} required style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '10px' }} />
        </div>

        <div>
          <label style={{ fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 6 }}>{isAr ? 'المدة (بالدقائق)' : 'Duration (mins)'}</label>
          <input type="number" name="duration_minutes" className="input" min="15" max="300" step="15" value={formData.duration_minutes} onChange={handleInputChange} required style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '10px' }} />
        </div>

        <div>
          <label style={{ fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 6 }}>{isAr ? 'الحد الأقصى للطلاب' : 'Max Capacity'}</label>
          <input type="number" name="max_capacity" className="input" min="2" max="100" value={formData.max_capacity} onChange={handleInputChange} required style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '10px' }} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: 10, paddingTop: 20, borderTop: '1px solid #e2e8f0' }}>
        <button type="button" onClick={onCancel} className="btn btn-outline btn-md" style={{ pointerEvents: isLoading ? 'none' : 'auto' }}>
          {isAr ? 'إلغاء' : 'Cancel'}
        </button>
        <button type="submit" className="btn btn-primary btn-md" disabled={isLoading} style={{ minWidth: 120 }}>
          {isLoading ? '...' : (isAr ? 'إطلاق الجلسة 🚀' : 'Launch Session 🚀')}
        </button>
      </div>
    </form>
  );
}
