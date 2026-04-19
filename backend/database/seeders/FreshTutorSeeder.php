<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\TutorProfile;
use App\Models\Subject;

class FreshTutorSeeder extends Seeder
{
    public function run(): void
    {
        // ── 1. Keep only user 42 (teacher@gmail.com) among tutors ──────────────
        $keepUserId = 42;

        // Get all tutor user IDs except the one to keep
        $tutorUserIds = TutorProfile::whereNot('user_id', $keepUserId)
            ->pluck('user_id')
            ->toArray();

        if (!empty($tutorUserIds)) {
            // Delete tutor profiles (cascade will handle related rows)
            TutorProfile::whereIn('user_id', $tutorUserIds)->delete();
            // Delete the user accounts themselves
            User::whereIn('id', $tutorUserIds)->delete();
        }

        // ── 2. Load subjects we'll attach ──────────────────────────────────────
        $subjects = Subject::whereIn('slug', [
            'mathematics', 'physics', 'chemistry', 'english-language',
            'arabic-language', 'biology', 'history',
        ])->get()->keyBy('slug');

        // Fallback: grab first 5 subjects if slugs don't match
        if ($subjects->isEmpty()) {
            $subjects = Subject::take(7)->get()->keyBy('slug');
        }
        $allSubjects = $subjects->values();

        // ── 3. Seed 5 rich tutors ──────────────────────────────────────────────
        $tutors = [
            [
                'user' => [
                    'name'     => 'منى إبراهيم شرف',
                    'email'    => 'mona.math@alemnypro.com',
                    'password' => Hash::make('password'),
                    'role'     => 'tutor',
                    'phone'    => '+201001234501',
                    'is_active'=> true,
                ],
                'profile' => [
                    'headline_ar'        => 'متخصصة في الرياضيات والفيزياء للمرحلة الثانوية',
                    'headline_en'        => 'Secondary Math & Physics Specialist',
                    'bio_ar'             => 'خبرة 10 سنوات في تدريس الرياضيات والفيزياء لطلاب الثانوية العامة والدبلومة الأمريكية. ساعدت أكثر من 300 طالب في تحقيق درجات متميزة. أتبع أسلوباً تبسيطياً يعتمد على الفهم العميق لا الحفظ.',
                    'headline_en'        => 'Secondary Math & Physics Specialist',
                    'bio_en'             => '10 years of experience teaching Math and Physics for secondary and American Diploma students. Helped 300+ students achieve top grades using a deep-understanding approach rather than rote memorization.',
                    'experience_years'   => 10,
                    'education'          => 'بكالوريوس هندسة - جامعة عين شمس',
                    'education_level'    => 'بكالوريوس',
                    'hourly_rate'        => 400,
                    'hourly_rate_online' => 350,
                    'lesson_format'      => 'both',
                    'is_first_lesson_free' => true,
                    'first_lesson_duration'=> '60',
                    'travel_expenses'    => 20,
                    'currency'           => 'EGP',
                    'governorate_id'     => 1,
                    'city_id'            => 4,
                    'avg_rating'         => 4.9,
                    'total_reviews'      => 74,
                    'total_students'     => 58,
                    'verification_status'=> 'verified',
                    'onboarding_step'    => 7,
                    'onboarding_status'  => 'approved',
                    'is_featured'        => true,
                    'is_live'            => true,
                ],
                'subject_slugs' => ['mathematics', 'physics'],
            ],
            [
                'user' => [
                    'name'     => 'كريم عادل منصور',
                    'email'    => 'karim.english@alemnypro.com',
                    'password' => Hash::make('password'),
                    'role'     => 'tutor',
                    'phone'    => '+201001234502',
                    'is_active'=> true,
                ],
                'profile' => [
                    'headline_ar'          => 'مدرب IELTS و SAT معتمد | مستوى C2',
                    'headline_en'          => 'Certified IELTS & SAT Trainer | C2 Level',
                    'bio_ar'               => 'خريج جامعة الأمريكية بالقاهرة ومدرب معتمد من British Council. دربت أكثر من 400 طالب على IELTS و SAT وحققوا Band 8+ وأكثر من 1500 في SAT. أعمل مع الطلاب على تطوير مهارات اللغة الإنجليزية الكاملة.',
                    'bio_en'               => 'AUC graduate and British Council certified trainer. Trained 400+ students for IELTS & SAT, achieving Band 8+ and SAT 1500+. I focus on developing complete English language skills tailored to each student.',
                    'experience_years'     => 7,
                    'education'            => 'بكالوريوس آداب إنجليزي - الجامعة الأمريكية بالقاهرة',
                    'education_level'      => 'بكالوريوس',
                    'hourly_rate'          => 550,
                    'hourly_rate_online'   => 500,
                    'lesson_format'        => 'both',
                    'is_first_lesson_free' => false,
                    'first_lesson_duration'=> '90',
                    'travel_expenses'      => 30,
                    'currency'             => 'EGP',
                    'governorate_id'       => 1,
                    'city_id'              => 1,
                    'avg_rating'           => 5.0,
                    'total_reviews'        => 112,
                    'total_students'       => 87,
                    'verification_status'  => 'verified',
                    'onboarding_step'      => 7,
                    'onboarding_status'    => 'approved',
                    'is_featured'          => true,
                    'is_live'              => true,
                ],
                'subject_slugs' => ['english-language'],
            ],
            [
                'user' => [
                    'name'     => 'هالة سامي غريب',
                    'email'    => 'hala.chem@alemnypro.com',
                    'password' => Hash::make('password'),
                    'role'     => 'tutor',
                    'phone'    => '+201001234503',
                    'is_active'=> true,
                ],
                'profile' => [
                    'headline_ar'          => 'خبيرة كيمياء وأحياء | ثانوي وجامعي',
                    'headline_en'          => 'Chemistry & Biology Expert | Secondary & University',
                    'bio_ar'               => 'دكتوراه في الكيمياء الحيوية من جامعة القاهرة. أدرّس الكيمياء والأحياء لطلاب الثانوية والجامعة بأسلوب تجريبي ممتع. لديّ مختبر خاص للتجارب العملية. نتائج طلابي تتحدث عن نفسها.',
                    'bio_en'               => 'PhD in Biochemistry from Cairo University. I teach Chemistry and Biology to secondary and university students using an experimental, engaging style. I run practical lab sessions with real experiments. My students\' results speak for themselves.',
                    'experience_years'     => 12,
                    'education'            => 'دكتوراه كيمياء حيوية - جامعة القاهرة',
                    'education_level'      => 'دكتوراه',
                    'hourly_rate'          => 600,
                    'hourly_rate_online'   => 500,
                    'lesson_format'        => 'both',
                    'is_first_lesson_free' => true,
                    'first_lesson_duration'=> '60',
                    'travel_expenses'      => 25,
                    'currency'             => 'EGP',
                    'governorate_id'       => 1,
                    'city_id'              => 3,
                    'avg_rating'           => 4.8,
                    'total_reviews'        => 55,
                    'total_students'       => 43,
                    'verification_status'  => 'verified',
                    'onboarding_step'      => 7,
                    'onboarding_status'    => 'approved',
                    'is_featured'          => false,
                    'is_live'              => true,
                ],
                'subject_slugs' => ['chemistry', 'biology'],
            ],
            [
                'user' => [
                    'name'     => 'أحمد ناصر الدين',
                    'email'    => 'ahmed.history@alemnypro.com',
                    'password' => Hash::make('password'),
                    'role'     => 'tutor',
                    'phone'    => '+201001234504',
                    'is_active'=> true,
                ],
                'profile' => [
                    'headline_ar'          => 'مؤرخ وباحث | التاريخ والجغرافيا والتربية الوطنية',
                    'headline_en'          => 'Historian & Researcher | History, Geography & Civic Ed',
                    'bio_ar'               => 'ماجستير في التاريخ الحديث من جامعة المنصورة. أدرّس التاريخ والجغرافيا بطريقة سردية مشوّقة تجعل الأحداث حيّة في ذهن الطالب. خبرتي تشمل جميع المراحل الدراسية من الإعدادي حتى الجامعي.',
                    'bio_en'               => 'Master\'s in Modern History from Mansoura University. I teach History and Geography using a narrative storytelling approach that brings events to life. My experience spans middle school through university level.',
                    'experience_years'     => 8,
                    'education'            => 'ماجستير تاريخ - جامعة المنصورة',
                    'education_level'      => 'ماجستير',
                    'hourly_rate'          => 300,
                    'hourly_rate_online'   => 250,
                    'lesson_format'        => 'online',
                    'is_first_lesson_free' => false,
                    'first_lesson_duration'=> '60',
                    'travel_expenses'      => null,
                    'currency'             => 'EGP',
                    'governorate_id'       => 5,
                    'city_id'              => null,
                    'avg_rating'           => 4.7,
                    'total_reviews'        => 38,
                    'total_students'       => 29,
                    'verification_status'  => 'verified',
                    'onboarding_step'      => 7,
                    'onboarding_status'    => 'approved',
                    'is_featured'          => false,
                    'is_live'              => true,
                ],
                'subject_slugs' => ['history'],
            ],
            [
                'user' => [
                    'name'     => 'ريم وليد عطية',
                    'email'    => 'reem.arabic@alemnypro.com',
                    'password' => Hash::make('password'),
                    'role'     => 'tutor',
                    'phone'    => '+201001234505',
                    'is_active'=> true,
                ],
                'profile' => [
                    'headline_ar'          => 'معلمة لغة عربية معتمدة | نحو وصرف وأدب',
                    'headline_en'          => 'Certified Arabic Language Teacher | Grammar, Morphology & Literature',
                    'bio_ar'               => 'ليسانس آداب عربي مع مرتبة الشرف. أتخصص في تدريس النحو والصرف والأدب العربي لجميع المستويات. أساعد الطلاب على الفهم العميق للغة العربية وليس فقط الحصول على درجات. أدرّس الطلاب العرب وغير العرب.',
                    'bio_en'               => 'Arabic Language degree with honors. I specialize in Arabic grammar, morphology, and literature for all levels — helping students achieve deep language understanding, not just passing grades. I teach both Arab and non-Arab students.',
                    'experience_years'     => 6,
                    'education'            => 'ليسانس آداب عربي - جامعة الإسكندرية',
                    'education_level'      => 'بكالوريوس',
                    'hourly_rate'          => 280,
                    'hourly_rate_online'   => 250,
                    'lesson_format'        => 'both',
                    'is_first_lesson_free' => true,
                    'first_lesson_duration'=> '60',
                    'travel_expenses'      => 15,
                    'currency'             => 'EGP',
                    'governorate_id'       => 3,
                    'city_id'              => null,
                    'avg_rating'           => 4.6,
                    'total_reviews'        => 29,
                    'total_students'       => 22,
                    'verification_status'  => 'verified',
                    'onboarding_step'      => 7,
                    'onboarding_status'    => 'approved',
                    'is_featured'          => false,
                    'is_live'              => true,
                ],
                'subject_slugs' => ['arabic-language'],
            ],
        ];

        foreach ($tutors as $data) {
            // Create user
            $user = User::create($data['user']);

            // Assign tutor role if Spatie is available
            try { $user->assignRole('tutor'); } catch (\Throwable) {}

            // Build profile data
            $profileData = array_merge($data['profile'], ['user_id' => $user->id]);

            // Create profile (slug auto-generated from user name via HasSlug)
            $profile = TutorProfile::create($profileData);

            // Attach subjects
            foreach ($data['subject_slugs'] as $subSlug) {
                $subject = $allSubjects->where('slug', $subSlug)->first()
                    ?? $allSubjects->first();

                if ($subject) {
                    DB::table('tutor_subjects')->insertOrIgnore([
                        'tutor_profile_id' => $profile->id,
                        'subject_id'       => $subject->id,
                        'levels'           => json_encode(['secondary', 'university']),
                        'hourly_rate'      => $data['profile']['hourly_rate'],
                        'created_at'       => now(),
                        'updated_at'       => now(),
                    ]);
                }
            }
        }

        $this->command->info('✅ Cleaned DB and seeded 5 fresh tutors successfully.');
    }
}
