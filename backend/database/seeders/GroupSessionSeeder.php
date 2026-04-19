<?php

namespace Database\Seeders;

use App\Models\GroupSession;
use App\Models\GroupEnrollment;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class GroupSessionSeeder extends Seeder
{
    public function run(): void
    {
        // ── Resolve tutor users ─────────────────────────────────────────────
        $ahmed  = User::where('email', 'ahmed.tutor@alemnypro.com')->first();
        $sara   = User::where('email', 'sara.tutor@alemnypro.com')->first();
        $mohamed = User::where('email', 'mohamed.dev@alemnypro.com')->first();
        $noura  = User::where('email', 'noura.chem@alemnypro.com')->first();

        if (!$ahmed || !$sara || !$mohamed || !$noura) {
            $this->command->warn('Tutors not found — run TutorSeeder first.');
            return;
        }

        // ── Resolve subject IDs ─────────────────────────────────────────────
        $mathId    = DB::table('subjects')->where('slug', 'mathematics')->value('id');
        $physicsId = DB::table('subjects')->where('slug', 'physics')->value('id');
        $englishId = DB::table('subjects')->where('slug', 'english')->value('id');
        $pythonId  = DB::table('subjects')->where('slug', 'python')->value('id');
        $chemId    = DB::table('subjects')->where('slug', 'chemistry')->value('id');

        // ── Seed student users for enrollments ──────────────────────────────
        $students = $this->seedStudents();

        // ── Group Sessions Data ─────────────────────────────────────────────
        $sessions = [

            // ── أحمد: Math revision (CONFIRMED — full) ──
            [
                'tutor_id'            => $ahmed->id,
                'subject_id'          => $mathId,
                'title_ar'            => 'مراجعة ليلة امتحان الرياضيات — ث.ع',
                'title_en'            => 'Math Final Exam Revision — Thanaweya',
                'description_ar'      => 'مراجعة شاملة لأهم مسائل الرياضيات قبل الامتحان مباشرة. سيتم حل نماذج امتحانات سابقة وتغطية أكثر المسائل احتمالاً.',
                'description_en'      => 'Comprehensive Math revision the night before the final exam. Past papers solved live, highest-probability questions covered.',
                'lesson_format'       => 'online',
                'pricing_model'       => 'per_seat',
                'seat_price'          => 80,
                'max_capacity'        => 8,
                'min_threshold'       => 4,
                'is_first_session_free' => false,
                'status'              => 'confirmed',
                'session_date'        => now()->addDays(3)->toDateString(),
                'session_time'        => '20:00:00',
                'duration_minutes'    => 120,
                'recurrence'          => 'none',
                'confirmed_at'        => now(),
                'enrollments'         => 6, // 6 of 8 enrolled
            ],

            // ── أحمد: Physics monthly group ──
            [
                'tutor_id'            => $ahmed->id,
                'subject_id'          => $physicsId,
                'title_ar'            => 'مجموعة فيزياء شهرية — ثانوي',
                'title_en'            => 'Monthly Physics Group — Secondary',
                'description_ar'      => 'برنامج شهري لتغطية منهج الفيزياء للصفوف الثانوية بطريقة تفاعلية. يشمل حل مسائل وشرح نظريات وتدريبات أسبوعية.',
                'description_en'      => 'Monthly program covering the Physics curriculum for secondary students in an interactive style. Includes problem solving, theory, and weekly exercises.',
                'lesson_format'       => 'online',
                'pricing_model'       => 'monthly_subscription',
                'seat_price'          => 350,
                'max_capacity'        => 10,
                'min_threshold'       => 5,
                'is_first_session_free' => true,
                'status'              => 'open',
                'session_date'        => now()->addDays(7)->toDateString(),
                'session_time'        => '18:00:00',
                'duration_minutes'    => 90,
                'recurrence'          => 'weekly',
                'enrollments'         => 3,
            ],

            // ── سارة: IELTS prep workshop (CONFIRMED) ──
            [
                'tutor_id'            => $sara->id,
                'subject_id'          => $englishId,
                'title_ar'            => 'ورشة تحضير IELTS — Writing Task 2',
                'title_en'            => 'IELTS Preparation Workshop — Writing Task 2',
                'description_ar'      => 'لا تخسر درجاتك في الـ Writing! ورشة مكثفة لمدة ساعتين. نتعلم كيف نكتب essay محترف بمعايير IELTS الحقيقية مع تصحيح مباشر.',
                'description_en'      => "Don't lose points in Writing! Intensive 2-hour workshop on writing a band 7+ essay using real IELTS criteria, with live correction.",
                'lesson_format'       => 'online',
                'pricing_model'       => 'per_seat',
                'seat_price'          => 120,
                'max_capacity'        => 6,
                'min_threshold'       => 3,
                'is_first_session_free' => false,
                'status'              => 'confirmed',
                'session_date'        => now()->addDays(5)->toDateString(),
                'session_time'        => '19:00:00',
                'duration_minutes'    => 120,
                'recurrence'          => 'none',
                'confirmed_at'        => now(),
                'enrollments'         => 5,
            ],

            // ── سارة: Daily English conversation ──
            [
                'tutor_id'            => $sara->id,
                'subject_id'          => $englishId,
                'title_ar'            => 'محادثة إنجليزية يومية — مستوى B2',
                'title_en'            => 'Daily English Conversation — B2 Level',
                'description_ar'      => 'حصص محادثة يومية لمدة 45 دقيقة مع مجموعة صغيرة. تجرّب الإنجليزي في بيئة آمنة وودية. مناسب لمستوى B1–B2.',
                'description_en'      => 'Daily 45-minute conversation sessions with a small group. Practice English in a safe, friendly environment. Suitable for B1–B2 level.',
                'lesson_format'       => 'online',
                'pricing_model'       => 'monthly_subscription',
                'seat_price'          => 280,
                'max_capacity'        => 8,
                'min_threshold'       => 4,
                'is_first_session_free' => true,
                'status'              => 'open',
                'session_date'        => now()->addDays(1)->toDateString(),
                'session_time'        => '08:00:00',
                'duration_minutes'    => 45,
                'recurrence'          => 'monthly',
                'enrollments'         => 2,
            ],

            // ── محمد: Python beginner bootcamp ──
            [
                'tutor_id'            => $mohamed->id,
                'subject_id'          => $pythonId,
                'title_ar'            => 'بناء مشروعك الأول بـ Python',
                'title_en'            => 'Build Your First Python Project From Scratch',
                'description_ar'      => 'رحلة من الصفر إلى مشروع حقيقي. سنبني مع بعض تطبيق كامل بـ Python خلال 8 ساعات موزعة على 4 جلسات. مناسب للمبتدئين تماماً.',
                'description_en'      => 'From zero to a real project. We build a complete Python application together across 4 sessions (8 hours). Perfect for absolute beginners.',
                'lesson_format'       => 'online',
                'pricing_model'       => 'per_seat',
                'seat_price'          => 200,
                'max_capacity'        => 6,
                'min_threshold'       => 3,
                'is_first_session_free' => false,
                'status'              => 'open',
                'session_date'        => now()->addDays(10)->toDateString(),
                'session_time'        => '18:00:00',
                'duration_minutes'    => 120,
                'recurrence'          => 'weekly',
                'enrollments'         => 2,
            ],

            // ── محمد: Advanced Python / APIs ──
            [
                'tutor_id'            => $mohamed->id,
                'subject_id'          => $pythonId,
                'title_ar'            => 'بناء REST APIs بـ FastAPI — متقدم',
                'title_en'            => 'Building REST APIs with FastAPI — Advanced',
                'description_ar'      => 'للمبرمجين اللي بيحبوا يتعلموا كيفية بناء APIs احترافية بـ Python. نغطي Authentication, Databases, Testing وDeployment.',
                'description_en'      => 'For developers who want to master building production-grade APIs with Python. Covers Auth, Databases, Testing, and Deployment.',
                'lesson_format'       => 'online',
                'pricing_model'       => 'per_seat',
                'seat_price'          => 350,
                'max_capacity'        => 8,
                'min_threshold'       => 4,
                'is_first_session_free' => false,
                'status'              => 'confirmed',
                'session_date'        => now()->addDays(6)->toDateString(),
                'session_time'        => '20:00:00',
                'duration_minutes'    => 150,
                'recurrence'          => 'none',
                'confirmed_at'        => now(),
                'enrollments'         => 5,
            ],

            // ── نورا: Chemistry exam revision ──
            [
                'tutor_id'            => $noura->id,
                'subject_id'          => $chemId,
                'title_ar'            => 'مراجعة كيمياء مكثفة — ث.ع',
                'title_en'            => 'Intensive Chemistry Revision — Thanaweya Amma',
                'description_ar'      => 'مراجعة سريعة ومكثفة لأهم فصول الكيمياء. نركز على المعادلات والتفاعلات التي بتيجي في الامتحان. معاكم د. نورا شخصياً!',
                'description_en'      => 'Fast, intensive revision of the most important Chemistry chapters. Focus on equations and reactions that appear in exams. With Dr. Noura herself!',
                'lesson_format'       => 'online',
                'pricing_model'       => 'per_seat',
                'seat_price'          => 90,
                'max_capacity'        => 10,
                'min_threshold'       => 5,
                'is_first_session_free' => false,
                'status'              => 'open',
                'session_date'        => now()->addDays(4)->toDateString(),
                'session_time'        => '17:00:00',
                'duration_minutes'    => 90,
                'recurrence'          => 'none',
                'enrollments'         => 4,
            ],

            // ── نورا: Biology (OPEN — barely started, free first) ──
            [
                'tutor_id'            => $noura->id,
                'subject_id'          => $chemId,
                'title_ar'            => 'أحياء شهري — مستوى ثانوي',
                'title_en'            => 'Monthly Biology Group — Secondary Level',
                'description_ar'      => 'برنامج أحياء شهري تفاعلي. سنغطي الخلية، الجينات، الأجهزة الحيوية وكل منهج الأحياء بطريقة بصرية وعملية.',
                'description_en'      => 'Interactive monthly Biology program. Covering cells, genetics, body systems — the full curriculum in a visual, practical way.',
                'lesson_format'       => 'online',
                'pricing_model'       => 'monthly_subscription',
                'seat_price'          => 300,
                'max_capacity'        => 10,
                'min_threshold'       => 4,
                'is_first_session_free' => true,
                'status'              => 'open',
                'session_date'        => now()->addDays(14)->toDateString(),
                'session_time'        => '16:00:00',
                'duration_minutes'    => 60,
                'recurrence'          => 'monthly',
                'enrollments'         => 1,
            ],
        ];

        foreach ($sessions as $data) {
            $enrollmentCount = $data['enrollments'];
            unset($data['enrollments']);

            // Set timestamps
            $data['created_at'] = now();
            $data['updated_at'] = now();

            $session = GroupSession::create($data);

            // Create enrollments from the pool of students
            $shuffled = $students->shuffle()->take($enrollmentCount);
            foreach ($shuffled as $student) {
                GroupEnrollment::create([
                    'group_session_id' => $session->id,
                    'student_id'       => $student->id,
                    'status'           => 'enrolled',
                    'amount_paid'      => $session->seat_price,
                    'payment_status'   => $session->status === 'confirmed' ? 'held' : 'held',
                    'enrolled_at'      => now()->subHours(rand(1, 72)),
                ]);
            }

            $this->command->info("✓ Created: [{$session->status}] {$session->title_en} ({$enrollmentCount}/{$session->max_capacity} seats)");
        }
    }

    private function seedStudents(): \Illuminate\Support\Collection
    {
        $studentData = [
            ['name' => 'Omar Yasser',     'email' => 'omar.student@alemnypro.com',   'phone' => '01001111111'],
            ['name' => 'Nada Sherif',     'email' => 'nada.student@alemnypro.com',   'phone' => '01001112222'],
            ['name' => 'Hassan Fathy',    'email' => 'hassan.student@alemnypro.com', 'phone' => '01001113333'],
            ['name' => 'Layla Mahmoud',   'email' => 'layla.student@alemnypro.com',  'phone' => '01001114444'],
            ['name' => 'Youssef Nour',    'email' => 'youssef.student@alemnypro.com','phone' => '01001115555'],
            ['name' => 'Salma Ali',       'email' => 'salma.student@alemnypro.com',  'phone' => '01001116666'],
            ['name' => 'Karim Wael',      'email' => 'karim.student@alemnypro.com',  'phone' => '01001117777'],
            ['name' => 'Dina Ibrahim',    'email' => 'dina.student@alemnypro.com',   'phone' => '01001118888'],
            ['name' => 'Tamer Galal',     'email' => 'tamer.student@alemnypro.com',  'phone' => '01001119999'],
            ['name' => 'Rana Adel',       'email' => 'rana.student@alemnypro.com',   'phone' => '01001110000'],
        ];

        return collect($studentData)->map(function ($data) {
            // Upsert so re-running doesn't fail
            return User::firstOrCreate(
                ['email' => $data['email']],
                [
                    'name'      => $data['name'],
                    'phone'     => $data['phone'],
                    'password'  => \Illuminate\Support\Facades\Hash::make('password'),
                    'role'      => 'student',
                    'locale'    => 'ar',
                    'is_active' => true,
                ]
            );
        });
    }
}
