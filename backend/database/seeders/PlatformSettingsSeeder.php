<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PlatformSettingsSeeder extends Seeder
{
    public function run(): void
    {
        $settings = [
            [
                'key'            => 'platform_fee_pct',
                'value'          => '15.00',
                'type'           => 'decimal',
                'label_en'       => 'Platform Commission %',
                'label_ar'       => 'نسبة عمولة المنصة',
                'description_en' => 'Percentage deducted from each confirmed session as platform commission.',
                'description_ar' => 'النسبة المئوية التي تُخصم من كل حصة مؤكدة كعمولة للمنصة.',
                'is_public'      => false,
            ],
            [
                'key'            => 'dispute_window_hours',
                'value'          => '48',
                'type'           => 'integer',
                'label_en'       => 'Dispute Window (hours)',
                'label_ar'       => 'نافذة الاعتراض (ساعات)',
                'description_en' => 'Number of hours the student has to raise a dispute after a session is marked complete.',
                'description_ar' => 'عدد الساعات المتاحة للطالب للاعتراض بعد تأكيد انتهاء الحصة.',
                'is_public'      => true,
            ],
            [
                'key'            => 'min_session_duration',
                'value'          => '30',
                'type'           => 'integer',
                'label_en'       => 'Minimum Session Duration (minutes)',
                'label_ar'       => 'أقل مدة للحصة (دقائق)',
                'description_en' => 'Minimum allowed lesson duration in minutes.',
                'description_ar' => 'أقل مدة مسموح بها لأي حصة دراسية بالدقائق.',
                'is_public'      => true,
            ],
            [
                'key'            => 'max_session_duration',
                'value'          => '180',
                'type'           => 'integer',
                'label_en'       => 'Maximum Session Duration (minutes)',
                'label_ar'       => 'أقصى مدة للحصة (دقائق)',
                'description_en' => 'Maximum allowed lesson duration in minutes.',
                'description_ar' => 'أقصى مدة مسموح بها لأي حصة دراسية بالدقائق.',
                'is_public'      => true,
            ],
            [
                'key'            => 'default_currency',
                'value'          => 'EGP',
                'type'           => 'string',
                'label_en'       => 'Default Currency',
                'label_ar'       => 'العملة الافتراضية',
                'description_en' => 'The default currency used across all transactions.',
                'description_ar' => 'العملة الافتراضية المستخدمة في جميع العمليات المالية.',
                'is_public'      => true,
            ],
            [
                'key'            => 'max_lessons_per_booking',
                'value'          => '20',
                'type'           => 'integer',
                'label_en'       => 'Max Lessons Per Booking',
                'label_ar'       => 'أقصى عدد حصص في الحجز',
                'description_en' => 'Maximum number of lessons that can be included in a single booking.',
                'description_ar' => 'الحد الأقصى لعدد الحصص التي يمكن تضمينها في حجز واحد.',
                'is_public'      => true,
            ],
        ];

        foreach ($settings as $setting) {
            DB::table('platform_settings')->updateOrInsert(
                ['key' => $setting['key']],
                array_merge($setting, [
                    'created_at' => now(),
                    'updated_at' => now(),
                ])
            );
        }
    }
}
