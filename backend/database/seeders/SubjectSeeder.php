<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * SubjectSeeder
 *
 * Each subject now carries a `levels` array — the predefined teaching audience
 * levels that the admin has defined. Tutors will multi-select from these.
 *
 * Level keys used (bilingual display is handled in the frontend):
 *   children        → أطفال (under 12)
 *   primary         → ابتدائي (Grades 1-6)
 *   preparatory     → إعدادي (Grades 7-9)
 *   secondary_1     → أول ثانوي
 *   secondary_2     → ثاني ثانوي
 *   secondary_3     → ثالث ثانوي / Thanawya Amma
 *   igcse_ol        → IGCSE O Level
 *   igcse_al        → IGCSE A Level
 *   ib              → International Baccalaureate
 *   university      → جامعي
 *   postgraduate    → دراسات عليا
 *   adults          → بالغون (general adult learners)
 *   beginner        → مستوى مبتدئ
 *   intermediate    → مستوى متوسط
 *   advanced        → مستوى متقدم
 *   professional    → مستوى احترافي / مهني
 */
class SubjectSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('tutor_subjects')->delete();
        DB::table('subjects')->delete();
        DB::table('subject_categories')->delete();

        // Common level groups (reused below)
        $schoolLevels   = ['primary','preparatory','secondary_1','secondary_2','secondary_3'];
        $allSchoolLevels= ['children','primary','preparatory','secondary_1','secondary_2','secondary_3'];
        $languageLevels = ['children','beginner','intermediate','advanced','professional','adults'];
        $techLevels     = ['beginner','intermediate','advanced','professional'];
        $universityLevels = ['secondary_3','university','postgraduate','adults'];
        $igcseLevels    = ['preparatory','igcse_ol','igcse_al'];
        $ibLevels       = ['igcse_ol','ib'];
        $examLevels     = ['secondary_3','igcse_ol','igcse_al','ib','university','adults'];
        $allLevels      = ['children','primary','preparatory','secondary_1','secondary_2','secondary_3','igcse_ol','igcse_al','ib','university','postgraduate','adults','beginner','intermediate','advanced','professional'];

        $categories = [
            // ══════════════════════════════════════════════════
            // 1. Academic — Egyptian National Curriculum
            // ══════════════════════════════════════════════════
            [
                'name_ar' => 'أكاديمي — المناهج الوطنية المصرية',
                'name_en' => 'Academic — Egyptian National Curriculum',
                'slug'    => 'national-curriculum',
                'icon'    => '🎓',
                'sort_order' => 1,
                'subjects' => [
                    [
                        'name_ar' => 'اللغة العربية',
                        'name_en' => 'Arabic (اللغة العربية)',
                        'slug'    => 'arabic-language',
                        'icon'    => '🌙',
                        'synonyms' => ['Arabic', 'عربي', 'لغة عربية', 'Arab'],
                        'search_keywords' => 'arabic language grammar نحو صرف بلاغة literature',
                        'levels'  => $allSchoolLevels,
                    ],
                    [
                        'name_ar' => 'الرياضيات',
                        'name_en' => 'Mathematics (الرياضيات)',
                        'slug'    => 'mathematics',
                        'icon'    => '➗',
                        'synonyms' => ['Math', 'Maths', 'رياضيات', 'حساب', 'جبر', 'هندسة'],
                        'search_keywords' => 'mathematics algebra geometry calculus trigonometry statistics رياضيات',
                        'levels'  => array_merge($allSchoolLevels, ['university']),
                    ],
                    [
                        'name_ar' => 'الفيزياء',
                        'name_en' => 'Physics (الفيزياء)',
                        'slug'    => 'physics',
                        'icon'    => '⚡',
                        'synonyms' => ['Physics', 'فيزياء', 'فيزيا'],
                        'search_keywords' => 'physics mechanics electricity magnetism waves optics quantum فيزياء',
                        'levels'  => ['preparatory','secondary_1','secondary_2','secondary_3','university'],
                    ],
                    [
                        'name_ar' => 'الكيمياء',
                        'name_en' => 'Chemistry (الكيمياء)',
                        'slug'    => 'chemistry',
                        'icon'    => '🧪',
                        'synonyms' => ['Chemistry', 'كيمياء', 'كيميا'],
                        'search_keywords' => 'chemistry organic inorganic reactions كيمياء عضوية',
                        'levels'  => ['preparatory','secondary_1','secondary_2','secondary_3','university'],
                    ],
                    [
                        'name_ar' => 'الأحياء',
                        'name_en' => 'Biology (الأحياء)',
                        'slug'    => 'biology',
                        'icon'    => '🧬',
                        'synonyms' => ['Biology', 'أحياء', 'علم الأحياء', 'Bio'],
                        'search_keywords' => 'biology genetics cells ecology botany zoology أحياء',
                        'levels'  => ['preparatory','secondary_1','secondary_2','secondary_3','university'],
                    ],
                    [
                        'name_ar' => 'الجيولوجيا',
                        'name_en' => 'Geology (الجيولوجيا)',
                        'slug'    => 'geology',
                        'icon'    => '🪨',
                        'synonyms' => ['Geology', 'جيولوجيا'],
                        'search_keywords' => 'geology rocks minerals earth science جيولوجيا',
                        'levels'  => ['secondary_1','secondary_2','secondary_3'],
                    ],
                    [
                        'name_ar' => 'التاريخ',
                        'name_en' => 'History (التاريخ)',
                        'slug'    => 'history',
                        'icon'    => '🏛️',
                        'synonyms' => ['History', 'تاريخ'],
                        'search_keywords' => 'history ancient modern egypt world تاريخ',
                        'levels'  => $schoolLevels,
                    ],
                    [
                        'name_ar' => 'الجغرافيا',
                        'name_en' => 'Geography (الجغرافيا)',
                        'slug'    => 'geography',
                        'icon'    => '🌍',
                        'synonyms' => ['Geography', 'جغرافيا'],
                        'search_keywords' => 'geography physical human maps climate جغرافيا',
                        'levels'  => $schoolLevels,
                    ],
                    [
                        'name_ar' => 'الفلسفة وعلم المنطق',
                        'name_en' => 'Philosophy (الفلسفة)',
                        'slug'    => 'philosophy',
                        'icon'    => '🧠',
                        'synonyms' => ['Philosophy', 'فلسفة', 'منطق'],
                        'search_keywords' => 'philosophy logic ethics فلسفة منطق',
                        'levels'  => ['secondary_1','secondary_2','secondary_3','university'],
                    ],
                    [
                        'name_ar' => 'علم النفس',
                        'name_en' => 'Psychology (علم النفس)',
                        'slug'    => 'psychology',
                        'icon'    => '💭',
                        'synonyms' => ['Psychology', 'علم النفس'],
                        'search_keywords' => 'psychology behavior mental علم نفس',
                        'levels'  => ['secondary_1','secondary_2','secondary_3','university','postgraduate'],
                    ],
                    [
                        'name_ar' => 'اللغة الإنجليزية (منهج وطني)',
                        'name_en' => 'English — National Curriculum',
                        'slug'    => 'english-national',
                        'icon'    => '📖',
                        'synonyms' => ['English national', 'إنجليزي منهج'],
                        'search_keywords' => 'english national curriculum school egypt ministry',
                        'levels'  => $allSchoolLevels,
                    ],
                ],
            ],

            // ══════════════════════════════════════════════════
            // 2. Academic — International Schools
            // ══════════════════════════════════════════════════
            [
                'name_ar' => 'أكاديمي — المدارس الدولية',
                'name_en' => 'Academic — International Schools',
                'slug'    => 'international-curriculum',
                'icon'    => '🌐',
                'sort_order' => 2,
                'subjects' => [
                    [
                        'name_ar' => 'IGCSE رياضيات',
                        'name_en' => 'IGCSE Math',
                        'slug'    => 'igcse-math',
                        'icon'    => '➗',
                        'synonyms' => ['IGCSE Mathematics', 'Cambridge Math', 'O Level Math'],
                        'search_keywords' => 'igcse math mathematics cambridge o level algebra',
                        'levels'  => $igcseLevels,
                    ],
                    [
                        'name_ar' => 'IGCSE فيزياء',
                        'name_en' => 'IGCSE Physics',
                        'slug'    => 'igcse-physics',
                        'icon'    => '⚡',
                        'synonyms' => ['Cambridge Physics', 'O Level Physics'],
                        'search_keywords' => 'igcse physics cambridge o level mechanics electricity',
                        'levels'  => $igcseLevels,
                    ],
                    [
                        'name_ar' => 'IGCSE كيمياء',
                        'name_en' => 'IGCSE Chemistry',
                        'slug'    => 'igcse-chemistry',
                        'icon'    => '🧪',
                        'synonyms' => ['Cambridge Chemistry', 'O Level Chemistry'],
                        'search_keywords' => 'igcse chemistry cambridge organic reactions',
                        'levels'  => $igcseLevels,
                    ],
                    [
                        'name_ar' => 'IGCSE تكنولوجيا المعلومات',
                        'name_en' => 'IGCSE ICT / Computer Science',
                        'slug'    => 'igcse-ict',
                        'icon'    => '💻',
                        'synonyms' => ['IGCSE Computer Science', 'Cambridge ICT'],
                        'search_keywords' => 'igcse ict computer science cambridge technology',
                        'levels'  => $igcseLevels,
                    ],
                    [
                        'name_ar' => 'IGCSE محاسبة',
                        'name_en' => 'IGCSE Accounting',
                        'slug'    => 'igcse-accounting',
                        'icon'    => '🧾',
                        'synonyms' => ['Cambridge Accounting', 'O Level Accounting'],
                        'search_keywords' => 'igcse accounting cambridge bookkeeping financial',
                        'levels'  => $igcseLevels,
                    ],
                    [
                        'name_ar' => 'SAT رياضيات',
                        'name_en' => 'SAT Math',
                        'slug'    => 'sat-math',
                        'icon'    => '📐',
                        'synonyms' => ['SAT Mathematics', 'SAT Prep Math'],
                        'search_keywords' => 'sat math college board algebra data analysis',
                        'levels'  => $examLevels,
                    ],
                    [
                        'name_ar' => 'SAT إنجليزي',
                        'name_en' => 'SAT English (EBRW)',
                        'slug'    => 'sat-english',
                        'icon'    => '📖',
                        'synonyms' => ['SAT Reading', 'SAT Writing', 'SAT Verbal', 'EBRW'],
                        'search_keywords' => 'sat english reading writing evidence based ebrw',
                        'levels'  => $examLevels,
                    ],
                    [
                        'name_ar' => 'تحضير ACT',
                        'name_en' => 'ACT Preparation',
                        'slug'    => 'act-preparation',
                        'icon'    => '📝',
                        'synonyms' => ['ACT', 'ACT Test Prep'],
                        'search_keywords' => 'act preparation test american college english math',
                        'levels'  => $examLevels,
                    ],
                    [
                        'name_ar' => 'تحضير EST',
                        'name_en' => 'EST Preparation',
                        'slug'    => 'est-preparation',
                        'icon'    => '📝',
                        'synonyms' => ['EST', 'Emsat'],
                        'search_keywords' => 'est preparation emsat test egypt saudi arabic math english',
                        'levels'  => $examLevels,
                    ],
                    [
                        'name_ar' => 'IB رياضيات',
                        'name_en' => 'IB Mathematics',
                        'slug'    => 'ib-mathematics',
                        'icon'    => '➗',
                        'synonyms' => ['IB Math', 'International Baccalaureate Math'],
                        'search_keywords' => 'ib mathematics international baccalaureate analysis',
                        'levels'  => $ibLevels,
                    ],
                    [
                        'name_ar' => 'IB فيزياء',
                        'name_en' => 'IB Physics',
                        'slug'    => 'ib-physics',
                        'icon'    => '⚡',
                        'synonyms' => ['International Baccalaureate Physics'],
                        'search_keywords' => 'ib physics international baccalaureate mechanics waves',
                        'levels'  => $ibLevels,
                    ],
                    [
                        'name_ar' => 'IB إدارة أعمال',
                        'name_en' => 'IB Business Management',
                        'slug'    => 'ib-business',
                        'icon'    => '📊',
                        'synonyms' => ['IB Business', 'International Baccalaureate Business'],
                        'search_keywords' => 'ib business management international baccalaureate',
                        'levels'  => $ibLevels,
                    ],
                ],
            ],

            // ══════════════════════════════════════════════════
            // 3. Languages
            // ══════════════════════════════════════════════════
            [
                'name_ar' => 'اللغات',
                'name_en' => 'Languages',
                'slug'    => 'languages',
                'icon'    => '🗣️',
                'sort_order' => 3,
                'subjects' => [
                    [
                        'name_ar' => 'الإنجليزية — عامة',
                        'name_en' => 'English — General',
                        'slug'    => 'english-general',
                        'icon'    => '🇬🇧',
                        'synonyms' => ['English', 'إنجليزي', 'لغة انجليزية'],
                        'search_keywords' => 'english general conversation speaking writing grammar',
                        'levels'  => $languageLevels,
                    ],
                    [
                        'name_ar' => 'تحضير IELTS',
                        'name_en' => 'IELTS Preparation',
                        'slug'    => 'ielts-preparation',
                        'icon'    => '🎓',
                        'synonyms' => ['IELTS', 'ايلتس'],
                        'search_keywords' => 'ielts preparation british council academic general listening',
                        'levels'  => ['intermediate','advanced','professional','adults'],
                    ],
                    [
                        'name_ar' => 'تحضير TOEFL',
                        'name_en' => 'TOEFL Preparation',
                        'slug'    => 'toefl-preparation',
                        'icon'    => '🎓',
                        'synonyms' => ['TOEFL', 'توفل'],
                        'search_keywords' => 'toefl preparation ets american english',
                        'levels'  => ['intermediate','advanced','professional','adults'],
                    ],
                    [
                        'name_ar' => 'الإنجليزية التجارية',
                        'name_en' => 'Business English',
                        'slug'    => 'business-english',
                        'icon'    => '💼',
                        'synonyms' => ['Business English', 'Corporate English'],
                        'search_keywords' => 'business english professional corporate presentation emails',
                        'levels'  => ['intermediate','advanced','professional','adults'],
                    ],
                    [
                        'name_ar' => 'الألمانية (Goethe/Telc)',
                        'name_en' => 'German (Goethe/Telc)',
                        'slug'    => 'german',
                        'icon'    => '🇩🇪',
                        'synonyms' => ['German', 'Deutsch', 'ألماني', 'Goethe', 'Telc'],
                        'search_keywords' => 'german deutsch goethe telc a1 a2 b1 b2 c1',
                        'levels'  => $languageLevels,
                    ],
                    [
                        'name_ar' => 'الفرنسية (DELF)',
                        'name_en' => 'French (DELF)',
                        'slug'    => 'french',
                        'icon'    => '🇫🇷',
                        'synonyms' => ['French', 'Français', 'فرنسي', 'DELF'],
                        'search_keywords' => 'french français delf dalf tcf a1 a2 b1 b2',
                        'levels'  => $languageLevels,
                    ],
                    [
                        'name_ar' => 'الإيطالية',
                        'name_en' => 'Italian',
                        'slug'    => 'italian',
                        'icon'    => '🇮🇹',
                        'synonyms' => ['Italian', 'Italiano', 'إيطالي'],
                        'search_keywords' => 'italian italiano cils celi a1 a2 b1 b2',
                        'levels'  => $languageLevels,
                    ],
                    [
                        'name_ar' => 'الإسبانية',
                        'name_en' => 'Spanish',
                        'slug'    => 'spanish',
                        'icon'    => '🇪🇸',
                        'synonyms' => ['Spanish', 'Español', 'إسباني', 'DELE'],
                        'search_keywords' => 'spanish espanol dele a1 a2 b1 b2',
                        'levels'  => $languageLevels,
                    ],
                    [
                        'name_ar' => 'الصينية (HSK)',
                        'name_en' => 'Chinese (HSK)',
                        'slug'    => 'chinese-hsk',
                        'icon'    => '🇨🇳',
                        'synonyms' => ['Chinese', 'Mandarin', 'صيني', 'HSK'],
                        'search_keywords' => 'chinese mandarin hsk language china business',
                        'levels'  => $languageLevels,
                    ],
                    [
                        'name_ar' => 'العربية للناطقين بغيرها',
                        'name_en' => 'Arabic for Non-Native Speakers',
                        'slug'    => 'arabic-non-native',
                        'icon'    => '🌙',
                        'synonyms' => ['Arabic for foreigners', 'MSA', 'Fusha'],
                        'search_keywords' => 'arabic non native speakers fusha msa conversational dialect',
                        'levels'  => $languageLevels,
                    ],
                ],
            ],

            // ══════════════════════════════════════════════════
            // 4. Technology & Professional Skills
            // ══════════════════════════════════════════════════
            [
                'name_ar' => 'التكنولوجيا والمهارات المهنية',
                'name_en' => 'Technology & Pro Skills',
                'slug'    => 'tech-pro-skills',
                'icon'    => '💻',
                'sort_order' => 4,
                'subjects' => [
                    [
                        'name_ar' => 'تطوير الويب (Fullstack)',
                        'name_en' => 'Web Development (Fullstack)',
                        'slug'    => 'web-development',
                        'icon'    => '🌐',
                        'synonyms' => ['Web Dev', 'Frontend', 'Backend', 'HTML', 'CSS', 'JavaScript', 'React', 'Laravel'],
                        'search_keywords' => 'web development html css javascript react nextjs laravel php nodejs',
                        'levels'  => $techLevels,
                    ],
                    [
                        'name_ar' => 'تطوير تطبيقات الجوال (Flutter)',
                        'name_en' => 'Mobile App Development (Flutter)',
                        'slug'    => 'mobile-app-development',
                        'icon'    => '📱',
                        'synonyms' => ['Mobile Development', 'Flutter', 'React Native', 'App Dev'],
                        'search_keywords' => 'mobile app development flutter react native android ios dart',
                        'levels'  => $techLevels,
                    ],
                    [
                        'name_ar' => 'Python والذكاء الاصطناعي',
                        'name_en' => 'Python & AI',
                        'slug'    => 'python-ai',
                        'icon'    => '🐍',
                        'synonyms' => ['Python', 'AI', 'Machine Learning', 'Data Science'],
                        'search_keywords' => 'python programming ai artificial intelligence machine learning data science',
                        'levels'  => $techLevels,
                    ],
                    [
                        'name_ar' => 'تصميم الجرافيك (Photoshop/Illustrator)',
                        'name_en' => 'Graphic Design (Photoshop/Illustrator)',
                        'slug'    => 'graphic-design',
                        'icon'    => '🎨',
                        'synonyms' => ['Graphic Design', 'Photoshop', 'Illustrator', 'تصميم'],
                        'search_keywords' => 'graphic design photoshop illustrator adobe creative cloud branding',
                        'levels'  => $techLevels,
                    ],
                    [
                        'name_ar' => 'تصميم UI/UX (Figma)',
                        'name_en' => 'UI/UX Design (Figma)',
                        'slug'    => 'ui-ux-design',
                        'icon'    => '🖥️',
                        'synonyms' => ['UI Design', 'UX Design', 'Figma', 'Prototyping'],
                        'search_keywords' => 'ui ux design figma prototyping wireframe user experience interface',
                        'levels'  => $techLevels,
                    ],
                    [
                        'name_ar' => 'المونتاج والإنتاج (Premiere/After Effects)',
                        'name_en' => 'Video Editing (Premiere/After Effects)',
                        'slug'    => 'video-editing',
                        'icon'    => '🎬',
                        'synonyms' => ['Video Editing', 'Premiere Pro', 'After Effects', 'مونتاج'],
                        'search_keywords' => 'video editing premiere pro after effects motion graphics',
                        'levels'  => $techLevels,
                    ],
                    [
                        'name_ar' => 'تحليل البيانات (Excel/SQL/PowerBI)',
                        'name_en' => 'Data Analysis (Excel/SQL/PowerBI)',
                        'slug'    => 'data-analysis',
                        'icon'    => '📊',
                        'synonyms' => ['Data Analysis', 'Excel', 'SQL', 'Power BI', 'PowerBI'],
                        'search_keywords' => 'data analysis excel sql powerbi tableau statistics',
                        'levels'  => array_merge($techLevels, ['adults']),
                    ],
                ],
            ],

            // ══════════════════════════════════════════════════
            // 5. Arts & Music
            // ══════════════════════════════════════════════════
            [
                'name_ar' => 'الفنون والموسيقى',
                'name_en' => 'Arts & Music',
                'slug'    => 'arts-music',
                'icon'    => '🎵',
                'sort_order' => 5,
                'subjects' => [
                    [
                        'name_ar' => 'البيانو',
                        'name_en' => 'Piano',
                        'slug'    => 'piano',
                        'icon'    => '🎹',
                        'synonyms' => ['Piano', 'بيانو', 'كيبورد'],
                        'search_keywords' => 'piano keyboard music classical beginner advanced',
                        'levels'  => ['children','beginner','intermediate','advanced','professional'],
                    ],
                    [
                        'name_ar' => 'الغيتار',
                        'name_en' => 'Guitar',
                        'slug'    => 'guitar',
                        'icon'    => '🎸',
                        'synonyms' => ['Guitar', 'جيتار', 'Electric Guitar', 'Acoustic'],
                        'search_keywords' => 'guitar acoustic electric bass music chords',
                        'levels'  => ['children','beginner','intermediate','advanced','professional'],
                    ],
                    [
                        'name_ar' => 'الرسم والتصوير الفني',
                        'name_en' => 'Drawing & Painting',
                        'slug'    => 'drawing-painting',
                        'icon'    => '🖌️',
                        'synonyms' => ['Drawing', 'Painting', 'رسم', 'تصوير فني', 'Art'],
                        'search_keywords' => 'drawing painting art watercolor oil digital sketch',
                        'levels'  => ['children','beginner','intermediate','advanced','adults'],
                    ],
                ],
            ],

            // ══════════════════════════════════════════════════
            // 6. Business & Finance
            // ══════════════════════════════════════════════════
            [
                'name_ar' => 'الأعمال والمال',
                'name_en' => 'Business & Finance',
                'slug'    => 'business-finance',
                'icon'    => '💼',
                'sort_order' => 6,
                'subjects' => [
                    [
                        'name_ar' => 'المحاسبة والمالية',
                        'name_en' => 'Accounting & Finance',
                        'slug'    => 'accounting-finance',
                        'icon'    => '🧾',
                        'synonyms' => ['Accounting', 'Finance', 'محاسبة', 'مالية'],
                        'search_keywords' => 'accounting finance bookkeeping financial statements',
                        'levels'  => ['secondary_3','university','postgraduate','adults','professional'],
                    ],
                    [
                        'name_ar' => 'إدارة الأعمال',
                        'name_en' => 'Business Management',
                        'slug'    => 'business-management',
                        'icon'    => '📊',
                        'synonyms' => ['Management', 'Business', 'إدارة'],
                        'search_keywords' => 'business management marketing strategy operations hr',
                        'levels'  => ['university','postgraduate','adults','professional'],
                    ],
                    [
                        'name_ar' => 'التسويق الرقمي',
                        'name_en' => 'Digital Marketing',
                        'slug'    => 'digital-marketing',
                        'icon'    => '📣',
                        'synonyms' => ['Digital Marketing', 'SEO', 'Social Media Marketing', 'تسويق'],
                        'search_keywords' => 'digital marketing seo social media ads google facebook',
                        'levels'  => $techLevels,
                    ],
                ],
            ],
        ];

        foreach ($categories as $categoryData) {
            $subjects = $categoryData['subjects'];
            unset($categoryData['subjects']);

            $categoryData['created_at'] = now();
            $categoryData['updated_at'] = now();

            $categoryId = DB::table('subject_categories')->insertGetId($categoryData);

            foreach ($subjects as $subject) {
                $subject['category_id']     = $categoryId;
                $subject['is_active']       = true;
                $subject['synonyms']        = json_encode($subject['synonyms'] ?? []);
                $subject['levels']          = json_encode($subject['levels']  ?? []);
                $subject['created_at']      = now();
                $subject['updated_at']      = now();
                DB::table('subjects')->insert($subject);
            }
        }
    }
}
