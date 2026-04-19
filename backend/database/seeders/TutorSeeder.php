<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\TutorProfile;
use App\Models\TutorSubject;
use App\Models\TutorAvailability;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class TutorSeeder extends Seeder
{
    public function run(): void
    {
        // ── Resolve location IDs ──────────────────────────────────────────
        $cairoId     = DB::table('governorates')->where('slug', 'cairo')->value('id');
        $gizaId      = DB::table('governorates')->where('slug', 'giza')->value('id');
        $alexId      = DB::table('governorates')->where('slug', 'alexandria')->value('id');
        $sharqiaId   = DB::table('governorates')->where('slug', 'sharqia')->value('id');
        $qalyubiaId  = DB::table('governorates')->where('slug', 'qalyubia')->value('id');
        $dakahliaId  = DB::table('governorates')->where('slug', 'dakahlia')->value('id');
        $minyaId     = DB::table('governorates')->where('slug', 'minya')->value('id');
        $assiutId    = DB::table('governorates')->where('slug', 'assiut')->value('id');

        $maadiId      = DB::table('cities')->where('slug', 'maadi')->value('id');
        $nasrId       = DB::table('cities')->where('slug', 'nasr-city')->value('id');
        $heliopolisId = DB::table('cities')->where('slug', 'heliopolis')->value('id');
        $zamalekId    = DB::table('cities')->where('slug', 'zamalek')->value('id');
        $newCairoId   = DB::table('cities')->where('slug', 'new-cairo')->value('id');
        $mohandId     = DB::table('cities')->where('slug', 'mohandessin')->value('id');
        $dokkiId      = DB::table('cities')->where('slug', 'dokki')->value('id');
        $sheikhZayedId = DB::table('cities')->where('slug', 'sheikh-zayed')->value('id');
        $sidiBishrId  = DB::table('cities')->where('slug', 'sidi-bishr')->value('id');
        $montazahId   = DB::table('cities')->where('slug', 'montazah')->value('id');

        // ── Resolve subject IDs ───────────────────────────────────────────
        $mathId       = DB::table('subjects')->where('slug', 'mathematics')->value('id');
        $physicsId    = DB::table('subjects')->where('slug', 'physics')->value('id');
        $chemId       = DB::table('subjects')->where('slug', 'chemistry')->value('id');
        $bioId        = DB::table('subjects')->where('slug', 'biology')->value('id');
        $arabicId     = DB::table('subjects')->where('slug', 'arabic-language')->value('id');
        $engGeneralId = DB::table('subjects')->where('slug', 'english-general')->value('id');
        $ieltsId      = DB::table('subjects')->where('slug', 'ielts-preparation')->value('id');
        $toeflId      = DB::table('subjects')->where('slug', 'toefl-preparation')->value('id');
        $frenchId     = DB::table('subjects')->where('slug', 'french')->value('id');
        $germanId     = DB::table('subjects')->where('slug', 'german')->value('id');
        $pythonId     = DB::table('subjects')->where('slug', 'python-ai')->value('id');
        $webDevId     = DB::table('subjects')->where('slug', 'web-development')->value('id');
        $mobileId     = DB::table('subjects')->where('slug', 'mobile-app-development')->value('id');
        $dataId       = DB::table('subjects')->where('slug', 'data-analysis')->value('id');
        $graphicId    = DB::table('subjects')->where('slug', 'graphic-design')->value('id');
        $uiuxId       = DB::table('subjects')->where('slug', 'ui-ux-design')->value('id');
        $igcsMathId   = DB::table('subjects')->where('slug', 'igcse-math')->value('id');
        $igcsPhysId   = DB::table('subjects')->where('slug', 'igcse-physics')->value('id');
        $igcsChemId   = DB::table('subjects')->where('slug', 'igcse-chemistry')->value('id');
        $satMathId    = DB::table('subjects')->where('slug', 'sat-math')->value('id');
        $satEngId     = DB::table('subjects')->where('slug', 'sat-english')->value('id');
        $ibMathId     = DB::table('subjects')->where('slug', 'ib-mathematics')->value('id');
        $historyId    = DB::table('subjects')->where('slug', 'history')->value('id');
        $geographyId  = DB::table('subjects')->where('slug', 'geography')->value('id');
        $geologyId    = DB::table('subjects')->where('slug', 'geology')->value('id');
        $philosophyId = DB::table('subjects')->where('slug', 'philosophy')->value('id');
        $psychologyId = DB::table('subjects')->where('slug', 'psychology')->value('id');
        $videoEditId  = DB::table('subjects')->where('slug', 'video-editing')->value('id');
        $spanishId    = DB::table('subjects')->where('slug', 'spanish')->value('id');
        $chineseId    = DB::table('subjects')->where('slug', 'chinese-hsk')->value('id');
        $bizEngId     = DB::table('subjects')->where('slug', 'business-english')->value('id');

        // ── Tutor Data ────────────────────────────────────────────────────
        $tutors = [
            // ── 1. Ahmed Mohamed Salem ──
            [
                'user' => ['name' => 'أحمد محمد سالم', 'email' => 'ahmed.salem@alemnypro.com', 'phone' => '01001234567'],
                'profile' => [
                    'headline_ar' => 'مدرس رياضيات وفيزياء | ثانوية عامة وIGCSE',
                    'headline_en' => 'Math & Physics Tutor | Thanaweya & IGCSE Expert',
                    'bio_ar' => 'مدرس متمرس بخبرة 8 سنوات في تدريس الرياضيات والفيزياء لجميع المراحل. أتخصص في الثانوية العامة والـ IGCSE. أساعد طلابي على فهم المفاهيم الصعبة بأسلوب مبسط وممتع. تخرجت من كلية الهندسة جامعة القاهرة وحصلت على تدريب متقدم في أساليب التدريس الحديثة.',
                    'bio_en' => 'Experienced tutor with 8 years teaching Math and Physics at all levels. Specialized in Thanaweya Amma and IGCSE. I help students understand complex concepts in a simple and engaging way. Engineering graduate from Cairo University with advanced training in modern teaching methodologies.',
                    'experience_years' => 8,
                    'education' => 'بكالوريوس هندسة - جامعة القاهرة',
                    'hourly_rate' => 300,
                    'lesson_format' => 'both',
                    'is_first_lesson_free' => true,
                    'verification_status' => 'verified',
                    'governorate_id' => $cairoId,
                    'city_id' => $maadiId,
                    'avg_rating' => 4.9,
                    'total_reviews' => 127,
                    'total_students' => 89,
                    'is_featured' => true,
                ],
                'subjects' => [$mathId, $physicsId],
                'availability' => [
                    ['day' => 0, 'start' => '16:00', 'end' => '21:00'], // Sunday
                    ['day' => 1, 'start' => '16:00', 'end' => '21:00'],
                    ['day' => 2, 'start' => '16:00', 'end' => '21:00'],
                    ['day' => 3, 'start' => '16:00', 'end' => '21:00'],
                    ['day' => 4, 'start' => '16:00', 'end' => '21:00'],
                ],
            ],

            // ── 2. Sara Ibrahim Hassan ──
            [
                'user' => ['name' => 'سارة إبراهيم حسن', 'email' => 'sara.hassan@alemnypro.com', 'phone' => '01112345678'],
                'profile' => [
                    'headline_ar' => 'متخصصة في اللغة الإنجليزية | IELTS وTOEFL',
                    'headline_en' => 'English Language Expert | IELTS & TOEFL Preparation',
                    'bio_ar' => 'مدرسة لغة إنجليزية معتمدة مع شهادة CELTA. خبرة 6 سنوات في تحضير الطلاب لاختبارات IELTS وTOEFL والمحادثة اليومية. أتبع نهجاً تفاعلياً يجعل تعلم اللغة ممتعاً وفعالاً. تخرجت من كلية الآداب قسم اللغة الإنجليزية، جامعة عين شمس.',
                    'bio_en' => 'Certified English teacher with CELTA qualification. 6 years experience preparing students for IELTS, TOEFL, and everyday conversation. I follow an interactive approach that makes learning English enjoyable and effective. Graduate of the Faculty of Arts, English Department, Ain Shams University.',
                    'experience_years' => 6,
                    'education' => 'بكالوريوس آداب إنجليزي - جامعة عين شمس',
                    'hourly_rate' => 250,
                    'lesson_format' => 'online',
                    'is_first_lesson_free' => true,
                    'verification_status' => 'verified',
                    'governorate_id' => $cairoId,
                    'city_id' => $nasrId,
                    'avg_rating' => 4.8,
                    'total_reviews' => 94,
                    'total_students' => 67,
                    'is_featured' => true,
                ],
                'subjects' => [$engGeneralId, $ieltsId, $toeflId],
                'availability' => [
                    ['day' => 0, 'start' => '10:00', 'end' => '14:00'],
                    ['day' => 1, 'start' => '10:00', 'end' => '14:00'],
                    ['day' => 3, 'start' => '10:00', 'end' => '14:00'],
                    ['day' => 6, 'start' => '10:00', 'end' => '18:00'], // Saturday
                ],
            ],

            // ── 3. Mohamed Ali Hussein ──
            [
                'user' => ['name' => 'محمد علي حسين', 'email' => 'mohamed.dev@alemnypro.com', 'phone' => '01223456789'],
                'profile' => [
                    'headline_ar' => 'مطور ومدرب برمجة Python والذكاء الاصطناعي | خبرة 5 سنوات',
                    'headline_en' => 'Python & AI Trainer | 5 Years Industry Experience',
                    'bio_ar' => 'مهندس برمجيات عمل في شركات تقنية كبرى. أدرّس Python والذكاء الاصطناعي للمبتدئين والمتوسطين مع التركيز على التطبيق العملي ومشاريع حقيقية. أؤمن بأن البرمجة مهارة يمكن لأي شخص إتقانها بالأسلوب الصحيح.',
                    'bio_en' => 'Software engineer with experience in top tech companies. Teaching Python and AI for beginners and intermediate learners, focused on practical projects. I believe programming is a skill anyone can master with the right approach.',
                    'experience_years' => 5,
                    'education' => 'بكالوريوس علوم حاسب - جامعة القاهرة',
                    'hourly_rate' => 400,
                    'lesson_format' => 'online',
                    'is_first_lesson_free' => false,
                    'verification_status' => 'verified',
                    'governorate_id' => $gizaId,
                    'city_id' => $mohandId,
                    'avg_rating' => 4.7,
                    'total_reviews' => 58,
                    'total_students' => 43,
                    'is_featured' => false,
                ],
                'subjects' => [$pythonId, $webDevId],
                'availability' => [
                    ['day' => 1, 'start' => '09:00', 'end' => '13:00'],
                    ['day' => 2, 'start' => '09:00', 'end' => '13:00'],
                    ['day' => 4, 'start' => '19:00', 'end' => '23:00'],
                    ['day' => 5, 'start' => '10:00', 'end' => '16:00'],
                ],
            ],

            // ── 4. Noura Khaled Rami ──
            [
                'user' => ['name' => 'نورا خالد رامي', 'email' => 'noura.chem@alemnypro.com', 'phone' => '01334567890'],
                'profile' => [
                    'headline_ar' => 'مدرسة كيمياء وأحياء | ثانوية عامة وأمريكان ديبلوما',
                    'headline_en' => 'Chemistry & Biology Tutor | Thanaweya & American Diploma',
                    'bio_ar' => 'طبيبة ومدرّسة كيمياء وأحياء. أساعد الطلاب على فهم العلوم بطريقة عملية ومرحة، مع التركيز على التجارب والتطبيقات الحياتية. حاصلة على دكتوراه طب من جامعة الإسكندرية وخبرة 4 سنوات في تدريس المناهج المصرية والأمريكية.',
                    'bio_en' => 'Medical doctor and science tutor. Helping students understand Chemistry and Biology practically and enjoyably, focusing on real-life applications. MD from Alexandria University with 4 years experience teaching Egyptian and American curricula.',
                    'experience_years' => 4,
                    'education' => 'دكتوراه طب - جامعة الإسكندرية',
                    'hourly_rate' => 350,
                    'lesson_format' => 'both',
                    'is_first_lesson_free' => true,
                    'verification_status' => 'verified',
                    'governorate_id' => $cairoId,
                    'city_id' => $maadiId,
                    'avg_rating' => 4.9,
                    'total_reviews' => 72,
                    'total_students' => 54,
                    'is_featured' => true,
                ],
                'subjects' => [$chemId, $bioId, $igcsChemId],
                'availability' => [
                    ['day' => 6, 'start' => '09:00', 'end' => '20:00'],
                    ['day' => 0, 'start' => '14:00', 'end' => '20:00'],
                    ['day' => 2, 'start' => '16:00', 'end' => '20:00'],
                    ['day' => 4, 'start' => '16:00', 'end' => '20:00'],
                ],
            ],

            // ── 5. Youssef Tarek Mansour ──
            [
                'user' => ['name' => 'يوسف طارق منصور', 'email' => 'youssef.igcse@alemnypro.com', 'phone' => '01445678901'],
                'profile' => [
                    'headline_ar' => 'متخصص IGCSE وIB | رياضيات وفيزياء',
                    'headline_en' => 'IGCSE & IB Expert | Math & Physics Specialist',
                    'bio_ar' => 'عملت 10 سنوات مدرساً في مدارس دولية بالقاهرة. أجيد تدريس منهج IGCSE وIB بالكامل، وأساعد الطلاب على الوصول لأعلى الدرجات. أستخدم أساليب Cambridge الرسمية في التدريس مع إضافة لمسة خاصة من المحتوى المصري.',
                    'bio_en' => 'Worked 10 years as a teacher in international schools in Cairo. Expert in full IGCSE and IB curricula, helping students achieve top grades. I use official Cambridge teaching methods with an Egyptian cultural touch.',
                    'experience_years' => 10,
                    'education' => 'بكالوريوس علوم - جامعة القاهرة | Cambridge IGCSE Certified',
                    'hourly_rate' => 450,
                    'lesson_format' => 'both',
                    'is_first_lesson_free' => false,
                    'verification_status' => 'verified',
                    'governorate_id' => $cairoId,
                    'city_id' => $newCairoId,
                    'avg_rating' => 4.8,
                    'total_reviews' => 163,
                    'total_students' => 112,
                    'is_featured' => true,
                ],
                'subjects' => [$igcsMathId, $igcsPhysId, $ibMathId, $mathId],
                'availability' => [
                    ['day' => 1, 'start' => '15:00', 'end' => '21:00'],
                    ['day' => 2, 'start' => '15:00', 'end' => '21:00'],
                    ['day' => 3, 'start' => '15:00', 'end' => '21:00'],
                    ['day' => 4, 'start' => '15:00', 'end' => '21:00'],
                    ['day' => 6, 'start' => '10:00', 'end' => '18:00'],
                ],
            ],

            // ── 6. Mariam Adel Zaki ──
            [
                'user' => ['name' => 'مريم عادل زكي', 'email' => 'mariam.french@alemnypro.com', 'phone' => '01556789012'],
                'profile' => [
                    'headline_ar' => 'مدرسة فرنساوي وإنجليزي | شهادة DELF',
                    'headline_en' => 'French & English Tutor | DELF Certified Teacher',
                    'bio_ar' => 'مدرسة لغات متخصصة بخبرة 7 سنوات. حاصلة على شهادة DELF المعتمدة من المعهد الفرنسي بالقاهرة. أدرّس الفرنسية من المستوى المبتدئ حتى المتقدم وأستعد مع طلابي لاختبارات DELF وDELF Scolaire. أيضاً أدرّس الإنجليزية للمحادثة اليومية.',
                    'bio_en' => 'Language teacher with 7 years experience. DELF certified by the French Institute in Cairo. Teaching French from beginner to advanced levels and preparing students for DELF and DELF Scolaire exams. Also teaches conversational English.',
                    'experience_years' => 7,
                    'education' => 'بكالوريوس آداب فرنسي - جامعة القاهرة | DELF B2',
                    'hourly_rate' => 220,
                    'lesson_format' => 'online',
                    'is_first_lesson_free' => true,
                    'verification_status' => 'verified',
                    'governorate_id' => $cairoId,
                    'city_id' => $zamalekId,
                    'avg_rating' => 4.6,
                    'total_reviews' => 41,
                    'total_students' => 35,
                    'is_featured' => false,
                ],
                'subjects' => [$frenchId, $engGeneralId],
                'availability' => [
                    ['day' => 0, 'start' => '09:00', 'end' => '14:00'],
                    ['day' => 1, 'start' => '09:00', 'end' => '14:00'],
                    ['day' => 3, 'start' => '09:00', 'end' => '14:00'],
                    ['day' => 5, 'start' => '09:00', 'end' => '14:00'],
                ],
            ],

            // ── 7. Omar Ashraf Badawy ──
            [
                'user' => ['name' => 'عمر أشرف بدوي', 'email' => 'omar.webdev@alemnypro.com', 'phone' => '01667890123'],
                'profile' => [
                    'headline_ar' => 'مطور ويب Fullstack | React وLaravel | تدريب احترافي',
                    'headline_en' => 'Fullstack Web Developer | React & Laravel Instructor',
                    'bio_ar' => 'مطور Fullstack بخبرة 6 سنوات في React وLaravel وNode.js. أولت اهتماماً كبيراً بتدريس البرمجة العملية من خلال مشاريع حقيقية. درّبت أكثر من 200 مطور في رحلتهم نحو سوق العمل. أؤمن بأن الأفضل للمبتدئين هو التطبيق من أول يوم.',
                    'bio_en' => 'Fullstack developer with 6 years React, Laravel, and Node.js experience. Passionate about practical programming education through real projects. Trained 200+ developers on their journey to the job market. I believe beginners learn best by building from day one.',
                    'experience_years' => 6,
                    'education' => 'بكالوريوس هندسة حاسبات - جامعة عين شمس',
                    'hourly_rate' => 380,
                    'lesson_format' => 'online',
                    'is_first_lesson_free' => false,
                    'verification_status' => 'verified',
                    'governorate_id' => $gizaId,
                    'city_id' => $sheikhZayedId,
                    'avg_rating' => 4.7,
                    'total_reviews' => 88,
                    'total_students' => 74,
                    'is_featured' => true,
                ],
                'subjects' => [$webDevId, $pythonId, $mobileId],
                'availability' => [
                    ['day' => 2, 'start' => '19:00', 'end' => '23:00'],
                    ['day' => 3, 'start' => '19:00', 'end' => '23:00'],
                    ['day' => 4, 'start' => '19:00', 'end' => '23:00'],
                    ['day' => 5, 'start' => '14:00', 'end' => '22:00'],
                    ['day' => 6, 'start' => '14:00', 'end' => '22:00'],
                ],
            ],

            // ── 8. Dalia Mahmoud Shehata ──
            [
                'user' => ['name' => 'داليا محمود شحاتة', 'email' => 'dalia.arabic@alemnypro.com', 'phone' => '01778901234'],
                'profile' => [
                    'headline_ar' => 'معلمة لغة عربية ونحو | ثانوية عامة والجامعة',
                    'headline_en' => 'Arabic Language & Grammar Teacher | All Levels',
                    'bio_ar' => 'أستاذة لغة عربية بخبرة 12 سنة. متخصصة في النحو والصرف والبلاغة والأدب العربي. أساعد الطلاب في تحسين مهاراتهم الكتابية والنحوية وفهم النصوص الأدبية. أيضاً أعمل على تحضير طلاب الثانوية العامة لامتحانات اللغة العربية.',
                    'bio_en' => 'Arabic language teacher with 12 years experience. Specialized in grammar, morphology, rhetoric, and Arabic literature. I help students improve their writing, grammar skills, and literary text comprehension. Also prepares Thanaweya students for Arabic exams.',
                    'experience_years' => 12,
                    'education' => 'بكالوريوس لغة عربية - دار العلوم | دبلوم التربية',
                    'hourly_rate' => 180,
                    'lesson_format' => 'both',
                    'is_first_lesson_free' => true,
                    'verification_status' => 'verified',
                    'governorate_id' => $cairoId,
                    'city_id' => $heliopolisId,
                    'avg_rating' => 4.9,
                    'total_reviews' => 215,
                    'total_students' => 178,
                    'is_featured' => true,
                ],
                'subjects' => [$arabicId, $historyId],
                'availability' => [
                    ['day' => 0, 'start' => '15:00', 'end' => '21:00'],
                    ['day' => 1, 'start' => '15:00', 'end' => '21:00'],
                    ['day' => 2, 'start' => '15:00', 'end' => '21:00'],
                    ['day' => 3, 'start' => '15:00', 'end' => '21:00'],
                    ['day' => 4, 'start' => '15:00', 'end' => '21:00'],
                ],
            ],

            // ── 9. Hassan Salah Nour ──
            [
                'user' => ['name' => 'حسن صلاح نور', 'email' => 'hassan.data@alemnypro.com', 'phone' => '01889012345'],
                'profile' => [
                    'headline_ar' => 'محلل بيانات | Excel وSQL وPower BI',
                    'headline_en' => 'Data Analyst | Excel, SQL & Power BI Instructor',
                    'bio_ar' => 'محلل بيانات بخبرة 5 سنوات في شركات مالية كبرى. أدرّس تحليل البيانات العملي بأدوات Excel وSQL وPower BI. ساعدت عشرات المهنيين على الانتقال لمجال البيانات أو تطوير مهاراتهم الحالية. أتبع نهجاً عملياً يعتمد على حالات حقيقية من سوق العمل.',
                    'bio_en' => 'Data analyst with 5 years experience at major financial companies. Teaching practical data analysis with Excel, SQL, and Power BI. Helped dozens of professionals transition into data or upgrade their existing skills. I follow a practical approach based on real-world business cases.',
                    'experience_years' => 5,
                    'education' => 'بكالوريوس تجارة - جامعة القاهرة | Microsoft Certified',
                    'hourly_rate' => 320,
                    'lesson_format' => 'online',
                    'is_first_lesson_free' => false,
                    'verification_status' => 'verified',
                    'governorate_id' => $gizaId,
                    'city_id' => $dokkiId,
                    'avg_rating' => 4.6,
                    'total_reviews' => 47,
                    'total_students' => 38,
                    'is_featured' => false,
                ],
                'subjects' => [$dataId, $webDevId],
                'availability' => [
                    ['day' => 1, 'start' => '18:00', 'end' => '22:00'],
                    ['day' => 3, 'start' => '18:00', 'end' => '22:00'],
                    ['day' => 5, 'start' => '10:00', 'end' => '20:00'],
                    ['day' => 6, 'start' => '10:00', 'end' => '20:00'],
                ],
            ],

            // ── 10. Rana Fathy Ibrahim ──
            [
                'user' => ['name' => 'رنا فتحي إبراهيم', 'email' => 'rana.design@alemnypro.com', 'phone' => '01990123456'],
                'profile' => [
                    'headline_ar' => 'مصممة ومدرّبة Graphic Design وUI/UX | Figma وPhotoshop',
                    'headline_en' => 'Graphic Design & UI/UX Trainer | Figma & Photoshop',
                    'bio_ar' => 'مصممة جرافيك وUI/UX بخبرة 7 سنوات. عملت مع كبار العلامات التجارية وأدرّس الآن التصميم بشغف وإتقان. دوراتي تمزج بين الأساسيات النظرية والتطبيق العملي على مشاريع حقيقية. بتدرّب معايا هتعرف تتكلم التصميم بطلاقة.',
                    'bio_en' => 'Graphic Design and UI/UX expert with 7 years working with major brands. Now teaching design with passion and precision. My courses blend theoretical foundations with hands-on real projects. You will speak design fluently after training with me.',
                    'experience_years' => 7,
                    'education' => 'بكالوريوس فنون جميلة - جامعة حلوان',
                    'hourly_rate' => 280,
                    'lesson_format' => 'online',
                    'is_first_lesson_free' => true,
                    'verification_status' => 'verified',
                    'governorate_id' => $cairoId,
                    'city_id' => $nasrId,
                    'avg_rating' => 4.8,
                    'total_reviews' => 61,
                    'total_students' => 52,
                    'is_featured' => true,
                ],
                'subjects' => [$graphicId, $uiuxId],
                'availability' => [
                    ['day' => 0, 'start' => '11:00', 'end' => '16:00'],
                    ['day' => 2, 'start' => '11:00', 'end' => '16:00'],
                    ['day' => 4, 'start' => '11:00', 'end' => '16:00'],
                    ['day' => 6, 'start' => '10:00', 'end' => '18:00'],
                ],
            ],

            // ── 11. Karim Ayman Badran ──
            [
                'user' => ['name' => 'كريم أيمن بدران', 'email' => 'karim.physics@alemnypro.com', 'phone' => '01011122233'],
                'profile' => [
                    'headline_ar' => 'مدرس فيزياء | ثانوية عامة وIGCSE | المجموعات والأونلاين',
                    'headline_en' => 'Physics Tutor | Thanaweya & IGCSE | Groups & Online',
                    'bio_ar' => 'مدرس فيزياء محترف بخبرة 9 سنوات. درّست في أكثر من 15 مدرسة وأكاديمية في القاهرة الجديدة ومدينة نصر. أتبع شرحاً متوسلاً بالمنطق والتجربة لا بالحفظ. نسبة نجاح طلابي في الفيزياء تتجاوز 95%.',
                    'bio_en' => 'Professional physics tutor with 9 years experience. Taught in 15+ schools and academies across New Cairo and Nasr City. I explain through logic and experimentation, not memorization. My students achieve 95%+ pass rates in Physics.',
                    'experience_years' => 9,
                    'education' => 'بكالوريوس علوم فيزياء - جامعة القاهرة',
                    'hourly_rate' => 280,
                    'lesson_format' => 'both',
                    'is_first_lesson_free' => false,
                    'verification_status' => 'verified',
                    'governorate_id' => $cairoId,
                    'city_id' => $newCairoId,
                    'avg_rating' => 4.7,
                    'total_reviews' => 142,
                    'total_students' => 112,
                    'is_featured' => false,
                ],
                'subjects' => [$physicsId, $igcsPhysId, $mathId],
                'availability' => [
                    ['day' => 0, 'start' => '14:00', 'end' => '20:00'],
                    ['day' => 1, 'start' => '14:00', 'end' => '20:00'],
                    ['day' => 2, 'start' => '14:00', 'end' => '20:00'],
                    ['day' => 3, 'start' => '14:00', 'end' => '20:00'],
                    ['day' => 4, 'start' => '14:00', 'end' => '20:00'],
                ],
            ],

            // ── 12. Hana Walid Soliman ──
            [
                'user' => ['name' => 'هناء وليد سليمان', 'email' => 'hana.german@alemnypro.com', 'phone' => '01122233344'],
                'profile' => [
                    'headline_ar' => 'مدرسة ألماني | Goethe A1-C1 | تحضير اختبارات',
                    'headline_en' => 'German Tutor | Goethe A1-C1 Certified | Exam Prep',
                    'bio_ar' => 'مدرسة لغة ألمانية حاصلة على C1 من معهد Goethe. درست وعاشت في ألمانيا لمدة 3 سنوات. أدرّس جميع مستويات الألمانية مع التركيز على الاستخدام الحقيقي في الحياة اليومية وبيئة العمل. أحضّر الطلاب لاختبارات Goethe وTelc وÖSD.',
                    'bio_en' => 'German language teacher with Goethe C1 certification. Studied and lived in Germany for 3 years. Teaching all German levels with focus on real-life and professional use. Preparing students for Goethe, Telc, and ÖSD certificates.',
                    'experience_years' => 5,
                    'education' => 'بكالوريوس ألسن ألماني - جامعة عين شمس | Goethe C1',
                    'hourly_rate' => 200,
                    'lesson_format' => 'online',
                    'is_first_lesson_free' => true,
                    'verification_status' => 'verified',
                    'governorate_id' => $alexId,
                    'city_id' => $sidiBishrId,
                    'avg_rating' => 4.5,
                    'total_reviews' => 33,
                    'total_students' => 28,
                    'is_featured' => false,
                ],
                'subjects' => [$germanId],
                'availability' => [
                    ['day' => 0, 'start' => '10:00', 'end' => '18:00'],
                    ['day' => 2, 'start' => '10:00', 'end' => '18:00'],
                    ['day' => 4, 'start' => '10:00', 'end' => '18:00'],
                    ['day' => 6, 'start' => '10:00', 'end' => '16:00'],
                ],
            ],

            // ── 13. Ahmed Samir Gouda ──
            [
                'user' => ['name' => 'أحمد سمير جودة', 'email' => 'ahmed.sat@alemnypro.com', 'phone' => '01233344455'],
                'profile' => [
                    'headline_ar' => 'متخصص SAT وAméricain Diploma | رياضيات وإنجليزي',
                    'headline_en' => 'SAT & American Diploma Expert | Math & English',
                    'bio_ar' => 'متخصص في الاختبارات الدولية منذ 8 سنوات. دربت أكثر من 500 طالب على SAT وACT وأوصلتهم لـ Ivy League وأفضل جامعات أمريكا. أتابع تحديثات College Board باستمرار لضمان أن مناهجي محدّثة ودقيقة.',
                    'bio_en' => 'International exam specialist for 8 years. Trained 500+ students for SAT and ACT, getting them into Ivy League and top US universities. I continuously follow College Board updates to ensure my curriculum is accurate and current.',
                    'experience_years' => 8,
                    'education' => 'بكالوريوس علوم - جامعة الأمريكية بالقاهرة',
                    'hourly_rate' => 500,
                    'lesson_format' => 'both',
                    'is_first_lesson_free' => false,
                    'verification_status' => 'verified',
                    'governorate_id' => $cairoId,
                    'city_id' => $zamalekId,
                    'avg_rating' => 5.0,
                    'total_reviews' => 89,
                    'total_students' => 71,
                    'is_featured' => true,
                ],
                'subjects' => [$satMathId, $satEngId, $mathId, $engGeneralId],
                'availability' => [
                    ['day' => 6, 'start' => '10:00', 'end' => '20:00'],
                    ['day' => 0, 'start' => '10:00', 'end' => '20:00'],
                    ['day' => 3, 'start' => '16:00', 'end' => '21:00'],
                    ['day' => 4, 'start' => '16:00', 'end' => '21:00'],
                ],
            ],

            // ── 14. Layla Hassan Mostafa ──
            [
                'user' => ['name' => 'ليلى حسن مصطفى', 'email' => 'layla.mobile@alemnypro.com', 'phone' => '01344455566'],
                'profile' => [
                    'headline_ar' => 'مطورة تطبيقات Flutter وReact Native',
                    'headline_en' => 'Mobile App Developer | Flutter & React Native Trainer',
                    'bio_ar' => 'مطورة تطبيقات موبايل بخبرة 4 سنوات. نشرت أكثر من 12 تطبيق على Google Play وApp Store. أدرّس Flutter وReact Native مع التركيز على الوصول لمستوى سوق العمل بسرعة. من الصفر لتطبيق حقيقي في 3 أشهر.',
                    'bio_en' => 'Mobile app developer with 4 years experience. Published 12+ apps on Google Play and App Store. Teaching Flutter and React Native with focus on reaching job-market level quickly. From zero to real app in 3 months.',
                    'experience_years' => 4,
                    'education' => 'بكالوريوس هندسة كمبيوتر - جامعة عين شمس',
                    'hourly_rate' => 350,
                    'lesson_format' => 'online',
                    'is_first_lesson_free' => true,
                    'verification_status' => 'verified',
                    'governorate_id' => $gizaId,
                    'city_id' => $mohandId,
                    'avg_rating' => 4.6,
                    'total_reviews' => 39,
                    'total_students' => 32,
                    'is_featured' => false,
                ],
                'subjects' => [$mobileId, $pythonId],
                'availability' => [
                    ['day' => 1, 'start' => '20:00', 'end' => '23:00'],
                    ['day' => 3, 'start' => '20:00', 'end' => '23:00'],
                    ['day' => 5, 'start' => '10:00', 'end' => '18:00'],
                    ['day' => 6, 'start' => '10:00', 'end' => '18:00'],
                ],
            ],

            // ── 15. Sherif Nabil Abdou ──
            [
                'user' => ['name' => 'شريف نبيل عبده', 'email' => 'sherif.history@alemnypro.com', 'phone' => '01455566677'],
                'profile' => [
                    'headline_ar' => 'مدرس تاريخ وجغرافيا | ثانوية عامة والإعدادي',
                    'headline_en' => 'History & Geography Tutor | Secondary & Prep',
                    'bio_ar' => 'مدرس متخصص في التاريخ والجغرافيا بخبرة 11 سنة. أحوّل المواد النظرية المملة إلى رحلات مثيرة بالقصص والخرائط التفاعلية. طلابي يحبون المادة لأنهم يفهمون السياق لا مجرد الحفظ.',
                    'bio_en' => 'History and Geography teacher with 11 years experience. I transform dull theory into exciting journeys using stories and interactive maps. My students love the subject because they understand context, not just memorize facts.',
                    'experience_years' => 11,
                    'education' => 'بكالوريوس آداب تاريخ - جامعة القاهرة',
                    'hourly_rate' => 150,
                    'lesson_format' => 'both',
                    'is_first_lesson_free' => true,
                    'verification_status' => 'verified',
                    'governorate_id' => $cairoId,
                    'city_id' => $heliopolisId,
                    'avg_rating' => 4.4,
                    'total_reviews' => 78,
                    'total_students' => 64,
                    'is_featured' => false,
                ],
                'subjects' => [$historyId, $geographyId, $arabicId],
                'availability' => [
                    ['day' => 0, 'start' => '14:00', 'end' => '20:00'],
                    ['day' => 1, 'start' => '14:00', 'end' => '20:00'],
                    ['day' => 2, 'start' => '14:00', 'end' => '20:00'],
                    ['day' => 3, 'start' => '14:00', 'end' => '20:00'],
                ],
            ],

            // ── 16. Nadia Rafaat Sayed ──
            [
                'user' => ['name' => 'ناديا رفعت سيد', 'email' => 'nadia.business@alemnypro.com', 'phone' => '01566677788'],
                'profile' => [
                    'headline_ar' => 'مدرّبة Business English والتقديم الاحترافي',
                    'headline_en' => 'Business English & Professional Presentation Trainer',
                    'bio_ar' => 'عملت 8 سنوات في الشركات متعددة الجنسيات وأدرّب الآن المهنيين على الإنجليزية التجارية ومهارات التقديم والتواصل في بيئة الأعمال. دوراتي مصممة خصيصاً للمديرين والمهندسين والأطباء الراغبين في الترقي وظيفياً أو السفر للخارج.',
                    'bio_en' => 'Worked 8 years in multinational companies. Now training professionals in business English, presentation skills, and workplace communication. My courses are designed for managers, engineers, and doctors seeking career advancement or working abroad.',
                    'experience_years' => 8,
                    'education' => 'بكالوريوس تجارة - جامعة القاهرة | MBA',
                    'hourly_rate' => 300,
                    'lesson_format' => 'online',
                    'is_first_lesson_free' => false,
                    'verification_status' => 'verified',
                    'governorate_id' => $cairoId,
                    'city_id' => $maadiId,
                    'avg_rating' => 4.7,
                    'total_reviews' => 55,
                    'total_students' => 47,
                    'is_featured' => false,
                ],
                'subjects' => [$bizEngId, $engGeneralId],
                'availability' => [
                    ['day' => 1, 'start' => '08:00', 'end' => '12:00'],
                    ['day' => 2, 'start' => '08:00', 'end' => '12:00'],
                    ['day' => 3, 'start' => '08:00', 'end' => '12:00'],
                    ['day' => 4, 'start' => '08:00', 'end' => '12:00'],
                ],
            ],

            // ── 17. Amr Medhat Khalil ──
            [
                'user' => ['name' => 'عمرو مدحت خليل', 'email' => 'amr.math.alex@alemnypro.com', 'phone' => '01677788899'],
                'profile' => [
                    'headline_ar' => 'مدرس رياضيات جامعي | جبر وتفاضل وتكامل',
                    'headline_en' => 'University Math Lecturer | Calculus & Linear Algebra',
                    'bio_ar' => 'محاضر جامعي في قسم الرياضيات بجامعة الإسكندرية ومدرس خصوصي. أتخصص في رياضيات الجامعة والثانوية العامة. أساعد الطلاب على فهم الرياضيات من منظور تحليلي عميق وليس مجرد حفظ قوانين.',
                    'bio_en' => 'University lecturer in the Mathematics Department at Alexandria University and private tutor. Specialized in university-level and secondary school mathematics. I help students understand math from a deep analytical perspective, not just memorizing formulas.',
                    'experience_years' => 13,
                    'education' => 'دكتوراه رياضيات - جامعة الإسكندرية',
                    'hourly_rate' => 400,
                    'lesson_format' => 'both',
                    'is_first_lesson_free' => false,
                    'verification_status' => 'verified',
                    'governorate_id' => $alexId,
                    'city_id' => $montazahId,
                    'avg_rating' => 4.8,
                    'total_reviews' => 104,
                    'total_students' => 87,
                    'is_featured' => true,
                ],
                'subjects' => [$mathId, $igcsMathId, $ibMathId],
                'availability' => [
                    ['day' => 3, 'start' => '16:00', 'end' => '22:00'],
                    ['day' => 4, 'start' => '16:00', 'end' => '22:00'],
                    ['day' => 5, 'start' => '09:00', 'end' => '18:00'],
                    ['day' => 6, 'start' => '09:00', 'end' => '18:00'],
                ],
            ],

            // ── 18. Yasmine Tarek Farouk ──
            [
                'user' => ['name' => 'ياسمين طارق فاروق', 'email' => 'yasmine.psych@alemnypro.com', 'phone' => '01788899900'],
                'profile' => [
                    'headline_ar' => 'مدرّبة علم النفس والفلسفة | ثانوية وجامعة',
                    'headline_en' => 'Psychology & Philosophy Tutor | Secondary & University',
                    'bio_ar' => 'معالجة نفسية ومدرّسة علم النفس والفلسفة. أساعد الطلاب على فهم هذه المواد من خلال تطبيقات واقعية في حياتهم اليومية. أيضاً أقدم جلسات مساعدة للطلاب على التحضير النفسي للامتحانات وإدارة القلق.',
                    'bio_en' => 'Psychotherapist and Psychology & Philosophy teacher. I help students understand these subjects through real-life applications in their daily lives. Also provides sessions helping students with psychological exam preparation and anxiety management.',
                    'experience_years' => 6,
                    'education' => 'بكالوريوس + ماجستير علم النفس - جامعة القاهرة',
                    'hourly_rate' => 250,
                    'lesson_format' => 'online',
                    'is_first_lesson_free' => true,
                    'verification_status' => 'verified',
                    'governorate_id' => $cairoId,
                    'city_id' => $nasrId,
                    'avg_rating' => 4.5,
                    'total_reviews' => 27,
                    'total_students' => 22,
                    'is_featured' => false,
                ],
                'subjects' => [$psychologyId, $philosophyId],
                'availability' => [
                    ['day' => 0, 'start' => '09:00', 'end' => '13:00'],
                    ['day' => 2, 'start' => '09:00', 'end' => '13:00'],
                    ['day' => 4, 'start' => '09:00', 'end' => '13:00'],
                    ['day' => 6, 'start' => '11:00', 'end' => '17:00'],
                ],
            ],

            // ── 19. Ibrahim Samy Naguib ──
            [
                'user' => ['name' => 'إبراهيم سامي نجيب', 'email' => 'ibrahim.geology@alemnypro.com', 'phone' => '01899900011'],
                'profile' => [
                    'headline_ar' => 'مدرس جيولوجيا وعلوم بيئية | ثانوية عامة',
                    'headline_en' => 'Geology & Earth Science Teacher | Thanaweya Amma',
                    'bio_ar' => 'مدرس جيولوجيا بخبرة 7 سنوات. الجيولوجيا مادة كثير من الطلاب يهرب منها وأنا مهمتي أبقيها ممتعة وسهلة. أستخدم عينات حقيقية من الصخور والمعادن في الشرح وأربط كل حصبة بواقع الجيولوجيا المصرية.',
                    'bio_en' => 'Geology teacher with 7 years experience. Many students fear geology — my mission is to make it fun and easy. I use real rock and mineral samples and connect every lesson to Egypt\'s actual geological context.',
                    'experience_years' => 7,
                    'education' => 'بكالوريوس علوم جيولوجيا - جامعة أسيوط',
                    'hourly_rate' => 160,
                    'lesson_format' => 'both',
                    'is_first_lesson_free' => true,
                    'verification_status' => 'pending',
                    'governorate_id' => $assiutId,
                    'city_id' => null,
                    'avg_rating' => 4.3,
                    'total_reviews' => 19,
                    'total_students' => 15,
                    'is_featured' => false,
                ],
                'subjects' => [$geologyId, $chemId],
                'availability' => [
                    ['day' => 1, 'start' => '15:00', 'end' => '20:00'],
                    ['day' => 3, 'start' => '15:00', 'end' => '20:00'],
                    ['day' => 5, 'start' => '09:00', 'end' => '16:00'],
                ],
            ],

            // ── 20. Mona Osama Galal ──
            [
                'user' => ['name' => 'منى أسامة جلال', 'email' => 'mona.igcse.chem@alemnypro.com', 'phone' => '01900011122'],
                'profile' => [
                    'headline_ar' => 'مدرسة IGCSE كيمياء وبيولوجي | IB Chemistry',
                    'headline_en' => 'IGCSE Chemistry & Biology | IB Chemistry Tutor',
                    'bio_ar' => 'مدرسة علوم مدارس دولية بخبرة 8 سنوات. تخصصت في IGCSE كيمياء وأحياء وIB Chemistry. معدل A* في كيمياء طلابي يتجاوز 75%. أستخدام تقنيات Cambridge الرسمية وأحرص على فهم عميق لا مجرد إجابة نموذجية.',
                    'bio_en' => 'International school science teacher with 8 years experience. Specialized in IGCSE Chemistry, Biology, and IB Chemistry. My students achieve A* above 75%. I use official Cambridge techniques ensuring deep understanding, not just model answers.',
                    'experience_years' => 8,
                    'education' => 'بكالوريوس صيدلة - جامعة القاهرة | Cambridge Certified',
                    'hourly_rate' => 420,
                    'lesson_format' => 'online',
                    'is_first_lesson_free' => false,
                    'verification_status' => 'verified',
                    'governorate_id' => $cairoId,
                    'city_id' => $newCairoId,
                    'avg_rating' => 4.9,
                    'total_reviews' => 98,
                    'total_students' => 81,
                    'is_featured' => true,
                ],
                'subjects' => [$igcsChemId, $chemId, $bioId],
                'availability' => [
                    ['day' => 0, 'start' => '15:00', 'end' => '21:00'],
                    ['day' => 1, 'start' => '15:00', 'end' => '21:00'],
                    ['day' => 2, 'start' => '15:00', 'end' => '21:00'],
                    ['day' => 3, 'start' => '15:00', 'end' => '21:00'],
                    ['day' => 6, 'start' => '10:00', 'end' => '18:00'],
                ],
            ],

            // ── 21. Tarek Essam Rizk ──
            [
                'user' => ['name' => 'طارق عصام رزق', 'email' => 'tarek.video.edit@alemnypro.com', 'phone' => '01011223344'],
                'profile' => [
                    'headline_ar' => 'مدرّب مونتاج احترافي | Premiere Pro وAfter Effects',
                    'headline_en' => 'Professional Video Editing Trainer | Premiere & After Effects',
                    'bio_ar' => 'منتج فيديو محترف بخبرة 9 سنوات في الإنتاج التلفزيوني ومحتوى الإنترنت. درّبت مئات المبدعين على Adobe Premiere وAfter Effects وDaVinci Resolve. أساعدك تحوّل شغفك بالفيديو لمهنة تدرّ عليك دخلاً كبيراً.',
                    'bio_en' => 'Professional video producer with 9 years in TV production and online content. Trained hundreds of creators on Adobe Premiere, After Effects, and DaVinci Resolve. I help you turn your video passion into a profitable career.',
                    'experience_years' => 9,
                    'education' => 'بكالوريوس إعلام - جامعة القاهرة',
                    'hourly_rate' => 260,
                    'lesson_format' => 'online',
                    'is_first_lesson_free' => true,
                    'verification_status' => 'verified',
                    'governorate_id' => $gizaId,
                    'city_id' => $dokkiId,
                    'avg_rating' => 4.6,
                    'total_reviews' => 52,
                    'total_students' => 44,
                    'is_featured' => false,
                ],
                'subjects' => [$videoEditId, $graphicId],
                'availability' => [
                    ['day' => 2, 'start' => '18:00', 'end' => '23:00'],
                    ['day' => 4, 'start' => '18:00', 'end' => '23:00'],
                    ['day' => 5, 'start' => '12:00', 'end' => '22:00'],
                    ['day' => 6, 'start' => '12:00', 'end' => '22:00'],
                ],
            ],

            // ── 22. Farah Mostafa Elwan ──
            [
                'user' => ['name' => 'فرح مصطفى علوان', 'email' => 'farah.spanish@alemnypro.com', 'phone' => '01122334455'],
                'profile' => [
                    'headline_ar' => 'مدرسة إسبانية | وصلت DELE B2 في سنتين',
                    'headline_en' => 'Spanish Tutor | Reached DELE B2 in 2 Years',
                    'bio_ar' => 'مدرسة لغة إسبانية حاصلة على DELE B2 تعلمتها بنفسي من الصفر وأعلّمها الآن بثقة. أؤمن بأن أفضل مدرس هو من مر بنفس رحلة الطالب. أدرّس بأسلوب المحادثة الممتعة مع قواعد واضحة.',
                    'bio_en' => 'Spanish teacher with DELE B2 who learned the language from scratch herself and now teaches it confidently. I believe the best teacher is one who shared the student\'s journey. I teach through fun conversation with clear grammar.',
                    'experience_years' => 3,
                    'education' => 'بكالوريوس لغات - جامعة عين شمس | DELE B2',
                    'hourly_rate' => 180,
                    'lesson_format' => 'online',
                    'is_first_lesson_free' => true,
                    'verification_status' => 'verified',
                    'governorate_id' => $cairoId,
                    'city_id' => $heliopolisId,
                    'avg_rating' => 4.4,
                    'total_reviews' => 21,
                    'total_students' => 17,
                    'is_featured' => false,
                ],
                'subjects' => [$spanishId, $engGeneralId],
                'availability' => [
                    ['day' => 1, 'start' => '17:00', 'end' => '21:00'],
                    ['day' => 3, 'start' => '17:00', 'end' => '21:00'],
                    ['day' => 5, 'start' => '10:00', 'end' => '18:00'],
                ],
            ],

            // ── 23. Mahmoud Saber Ismail ──
            [
                'user' => ['name' => 'محمود صابر إسماعيل', 'email' => 'mahmoud.bio.med@alemnypro.com', 'phone' => '01233445566'],
                'profile' => [
                    'headline_ar' => 'مدرس أحياء وكيمياء للثانوية | تحضير كليات الطب',
                    'headline_en' => 'Biology & Chemistry for Thanaweya | Medical School Prep',
                    'bio_ar' => 'طالب دكتوراه في كلية الطب ومدرس خصوصي لطلاب الثانوية الراغبين في دخول كليات الطب والصيدلة والطب البيطري. أجمع بين خلفيتي الطبية وشغفي بالتعليم لأعطي الطالب نظرة أعمق وأوسع للمادة.',
                    'bio_en' => 'Medical PhD student and private tutor for secondary students aiming for medical, pharmacy, and veterinary colleges. I combine my medical background with teaching passion to give students a deeper, wider view of the subject.',
                    'experience_years' => 4,
                    'education' => 'طالب دكتوراه طب - جامعة القاهرة',
                    'hourly_rate' => 220,
                    'lesson_format' => 'both',
                    'is_first_lesson_free' => false,
                    'verification_status' => 'verified',
                    'governorate_id' => $cairoId,
                    'city_id' => $nasrId,
                    'avg_rating' => 4.7,
                    'total_reviews' => 44,
                    'total_students' => 37,
                    'is_featured' => false,
                ],
                'subjects' => [$bioId, $chemId],
                'availability' => [
                    ['day' => 0, 'start' => '17:00', 'end' => '22:00'],
                    ['day' => 2, 'start' => '17:00', 'end' => '22:00'],
                    ['day' => 4, 'start' => '17:00', 'end' => '22:00'],
                    ['day' => 6, 'start' => '09:00', 'end' => '17:00'],
                ],
            ],

            // ── 24. Zeinab Amr Hegazy ──
            [
                'user' => ['name' => 'زينب عمرو حجازي', 'email' => 'zeinab.uiux@alemnypro.com', 'phone' => '01344556677'],
                'profile' => [
                    'headline_ar' => 'مصممة UI/UX وFigma | من الهواية للاحتراف',
                    'headline_en' => 'UI/UX & Figma Designer Trainer | Hobby to Career',
                    'bio_ar' => 'مديرة تصميم منتج في شركة ناشئة ومدرّبة UI/UX. ساعدت أكثر من 60 مصمم على دخول سوق العمل أو الانتقال لشركات أفضل. كورسي يبدأ بـ Figma من الصفر وينتهي بمشروع portfolio محترف.',
                    'bio_en' => 'Product design manager at a startup and UI/UX trainer. Helped 60+ designers enter the job market or transition to better companies. My course starts from Figma zero and ends with a professional portfolio project.',
                    'experience_years' => 5,
                    'education' => 'بكالوريوس هندسة - جامعة عين شمس | Google UX Certificate',
                    'hourly_rate' => 300,
                    'lesson_format' => 'online',
                    'is_first_lesson_free' => true,
                    'verification_status' => 'verified',
                    'governorate_id' => $gizaId,
                    'city_id' => $sheikhZayedId,
                    'avg_rating' => 4.8,
                    'total_reviews' => 67,
                    'total_students' => 58,
                    'is_featured' => true,
                ],
                'subjects' => [$uiuxId, $graphicId],
                'availability' => [
                    ['day' => 0, 'start' => '20:00', 'end' => '23:00'],
                    ['day' => 1, 'start' => '20:00', 'end' => '23:00'],
                    ['day' => 5, 'start' => '10:00', 'end' => '20:00'],
                    ['day' => 6, 'start' => '10:00', 'end' => '20:00'],
                ],
            ],

            // ── 25. Basel Saad Osman ──
            [
                'user' => ['name' => 'باسل سعد عثمان', 'email' => 'basel.math.sharqia@alemnypro.com', 'phone' => '01455667788'],
                'profile' => [
                    'headline_ar' => 'مدرس رياضيات ثانوية | الشرقية والدلتا',
                    'headline_en' => 'Secondary Math Tutor | Sharqia & Delta Region',
                    'bio_ar' => 'مدرس رياضيات ثانوية عامة بخبرة 10 سنوات في محافظة الشرقية. أعمل مع طلاب المراحل كلها وأركز على الطلاب الذين يعانون من صعوبات في الرياضيات. نهجي يبدأ من أبسط الأساسيات ليبني جسراً نحو الفهم العميق.',
                    'bio_en' => 'Secondary math teacher with 10 years experience in Sharqia governorate. Working with all levels and focusing on students struggling with mathematics. My approach starts from the simplest basics to build a bridge toward deep understanding.',
                    'experience_years' => 10,
                    'education' => 'بكالوريوس تربية رياضيات - جامعة الزقازيق',
                    'hourly_rate' => 120,
                    'lesson_format' => 'both',
                    'is_first_lesson_free' => true,
                    'verification_status' => 'verified',
                    'governorate_id' => $sharqiaId,
                    'city_id' => null,
                    'avg_rating' => 4.5,
                    'total_reviews' => 86,
                    'total_students' => 73,
                    'is_featured' => false,
                ],
                'subjects' => [$mathId, $physicsId],
                'availability' => [
                    ['day' => 0, 'start' => '15:00', 'end' => '21:00'],
                    ['day' => 1, 'start' => '15:00', 'end' => '21:00'],
                    ['day' => 2, 'start' => '15:00', 'end' => '21:00'],
                    ['day' => 3, 'start' => '15:00', 'end' => '21:00'],
                    ['day' => 4, 'start' => '15:00', 'end' => '21:00'],
                ],
            ],

            // ── 26. Amina Maged Shafik ──
            [
                'user' => ['name' => 'أمينة ماجد شفيق', 'email' => 'amina.chinese@alemnypro.com', 'phone' => '01566778899'],
                'profile' => [
                    'headline_ar' => 'مدرسة لغة صينية | HSK 1-4 | تجارة وثقافة',
                    'headline_en' => 'Chinese Language Tutor | HSK 1-4 | Business & Culture',
                    'bio_ar' => 'درست الصينية في بكين لمدة سنتين وحاصلة على HSK 4. أدرّس الصينية للعرب بأسلوب ممتع يدمج اللغة بالثقافة والتجارة. مثالية لمن يريد التواصل مع الشركات الصينية أو زيارة الصين.',
                    'bio_en' => 'Studied Chinese in Beijing for 2 years with HSK 4 certification. Teaching Chinese to Arabs in an engaging style that blends language with culture and business. Perfect for those wanting to communicate with Chinese companies or visit China.',
                    'experience_years' => 3,
                    'education' => 'بكالوريوس تجارة خارجية - جامعة القاهرة | HSK 4',
                    'hourly_rate' => 200,
                    'lesson_format' => 'online',
                    'is_first_lesson_free' => true,
                    'verification_status' => 'verified',
                    'governorate_id' => $cairoId,
                    'city_id' => $maadiId,
                    'avg_rating' => 4.3,
                    'total_reviews' => 15,
                    'total_students' => 12,
                    'is_featured' => false,
                ],
                'subjects' => [$chineseId],
                'availability' => [
                    ['day' => 1, 'start' => '16:00', 'end' => '21:00'],
                    ['day' => 3, 'start' => '16:00', 'end' => '21:00'],
                    ['day' => 6, 'start' => '10:00', 'end' => '16:00'],
                ],
            ],

            // ── 27. Khaled Ramzy Fouad ──
            [
                'user' => ['name' => 'خالد رمزي فؤاد', 'email' => 'khaled.chem.alex@alemnypro.com', 'phone' => '01677889900'],
                'profile' => [
                    'headline_ar' => 'مدرس كيمياء وفيزياء | الإسكندرية | حضوري وأونلاين',
                    'headline_en' => 'Chemistry & Physics Tutor | Alexandria | On & Offline',
                    'bio_ar' => 'مدرس علوم بخبرة 14 سنة في الإسكندرية المحبوبة. أدرّس كيمياء وفيزياء الثانوية العامة وIGCSE. استطعت أن أحسّن نتائج أكثر من 1000 طالب. أتميز بشرح واضح ومبسط يصل لكل مستوى.',
                    'bio_en' => 'Science teacher with 14 years experience in beloved Alexandria. Teaching Chemistry and Physics for Thanaweya and IGCSE. Improved results for 1000+ students. Known for clear, simplified explanations that reach every level.',
                    'experience_years' => 14,
                    'education' => 'بكالوريوس علوم كيمياء - جامعة الإسكندرية',
                    'hourly_rate' => 170,
                    'lesson_format' => 'both',
                    'is_first_lesson_free' => false,
                    'verification_status' => 'verified',
                    'governorate_id' => $alexId,
                    'city_id' => $sidiBishrId,
                    'avg_rating' => 4.6,
                    'total_reviews' => 198,
                    'total_students' => 166,
                    'is_featured' => false,
                ],
                'subjects' => [$chemId, $physicsId, $igcsChemId],
                'availability' => [
                    ['day' => 0, 'start' => '13:00', 'end' => '20:00'],
                    ['day' => 1, 'start' => '13:00', 'end' => '20:00'],
                    ['day' => 2, 'start' => '13:00', 'end' => '20:00'],
                    ['day' => 3, 'start' => '13:00', 'end' => '20:00'],
                    ['day' => 4, 'start' => '13:00', 'end' => '20:00'],
                ],
            ],

            // ── 28. Salma Hesham Abdallah ──
            [
                'user' => ['name' => 'سلمى هشام عبدالله', 'email' => 'salma.ielts@alemnypro.com', 'phone' => '01788990011'],
                'profile' => [
                    'headline_ar' => 'مدرّبة IELTS احترافية | أكثر من 1000 طالب ناجح',
                    'headline_en' => 'Professional IELTS Trainer | 1000+ Successful Students',
                    'bio_ar' => 'مدرّبة IELTS وTOEFL معتمدة بخبرة 9 سنوات. ساعدت أكثر من 1000 طالب يصلون لنتيجة IELTS المطلوبة. متوسط تحسّن طلابي نصفة درجة في ثلاثة أشهر. أقدّم خطة دراسة مخصصة لكل طالب حسب مستواه وهدفه.',
                    'bio_en' => 'Certified IELTS and TOEFL trainer with 9 years experience. Helped 1000+ students achieve their target IELTS score. Average student improvement is 0.5 band in 3 months. I provide a personalized study plan for each student based on their level and goal.',
                    'experience_years' => 9,
                    'education' => 'بكالوريوس تربية إنجليزي - جامعة الإسكندرية | CELTA',
                    'hourly_rate' => 280,
                    'lesson_format' => 'online',
                    'is_first_lesson_free' => true,
                    'verification_status' => 'verified',
                    'governorate_id' => $alexId,
                    'city_id' => $montazahId,
                    'avg_rating' => 4.9,
                    'total_reviews' => 187,
                    'total_students' => 156,
                    'is_featured' => true,
                ],
                'subjects' => [$ieltsId, $toeflId, $engGeneralId, $bizEngId],
                'availability' => [
                    ['day' => 0, 'start' => '09:00', 'end' => '17:00'],
                    ['day' => 1, 'start' => '09:00', 'end' => '17:00'],
                    ['day' => 2, 'start' => '09:00', 'end' => '17:00'],
                    ['day' => 3, 'start' => '09:00', 'end' => '17:00'],
                    ['day' => 4, 'start' => '09:00', 'end' => '17:00'],
                ],
            ],

            // ── 29. Hossam Atef Hamdan ──
            [
                'user' => ['name' => 'حسام عاطف حمدان', 'email' => 'hossam.math.minya@alemnypro.com', 'phone' => '01899001122'],
                'profile' => [
                    'headline_ar' => 'مدرس رياضيات وفيزياء | المنيا والصعيد',
                    'headline_en' => 'Math & Physics Tutor | Minya & Upper Egypt',
                    'bio_ar' => 'مدرس رياضيات وفيزياء في محافظة المنيا. أؤمن بأن كل طالب في مصر يستحق تعليماً عالي الجودة بصرف النظر عن موقعه الجغرافي. لهذا أدرس أونلاين بنفس مستوى المدرسين في القاهرة. خبرة 8 سنوات وأسلوب واضح وداعم.',
                    'bio_en' => 'Math and Physics tutor in Minya governorate. I believe every Egyptian student deserves quality education regardless of location. That\'s why I teach online at the same level as Cairo tutors. 8 years experience with a clear, supportive teaching style.',
                    'experience_years' => 8,
                    'education' => 'بكالوريوس تربية علوم - جامعة المنيا',
                    'hourly_rate' => 100,
                    'lesson_format' => 'online',
                    'is_first_lesson_free' => true,
                    'verification_status' => 'verified',
                    'governorate_id' => $minyaId,
                    'city_id' => null,
                    'avg_rating' => 4.4,
                    'total_reviews' => 56,
                    'total_students' => 48,
                    'is_featured' => false,
                ],
                'subjects' => [$mathId, $physicsId],
                'availability' => [
                    ['day' => 0, 'start' => '17:00', 'end' => '22:00'],
                    ['day' => 1, 'start' => '17:00', 'end' => '22:00'],
                    ['day' => 2, 'start' => '17:00', 'end' => '22:00'],
                    ['day' => 3, 'start' => '17:00', 'end' => '22:00'],
                    ['day' => 4, 'start' => '17:00', 'end' => '22:00'],
                    ['day' => 5, 'start' => '10:00', 'end' => '18:00'],
                ],
            ],

            // ── 30. Amira Fouad Zeidan ──
            [
                'user' => ['name' => 'أميرة فؤاد زيدان', 'email' => 'amira.arabic.lit@alemnypro.com', 'phone' => '01900112233'],
                'profile' => [
                    'headline_ar' => 'أستاذة لغة عربية وأدب | ثانوي عام وأزهر',
                    'headline_en' => 'Arabic Language & Literature Teacher | General & Azhar',
                    'bio_ar' => 'أستاذة عربية بخبرة 15 سنة في تدريس اللغة العربية والأدب لطلاب الثانوية العامة والأزهر. حاصلة على ماجستير في الأدب العربي. متميزة في شرح البلاغة والنصوص وتحليل القصيدة. طلابي يحبون العربية ويريدون المزيد.',
                    'bio_en' => 'Arabic teacher with 15 years experience teaching Arabic Language and Literature for General and Azhar secondary students. Master\'s degree in Arabic Literature. Excellent at explaining rhetoric, texts, and poetry analysis. My students love Arabic and want more.',
                    'experience_years' => 15,
                    'education' => 'ماجستير أدب عربي - جامعة الأزهر',
                    'hourly_rate' => 200,
                    'lesson_format' => 'both',
                    'is_first_lesson_free' => false,
                    'verification_status' => 'verified',
                    'governorate_id' => $qalyubiaId,
                    'city_id' => null,
                    'avg_rating' => 4.8,
                    'total_reviews' => 167,
                    'total_students' => 142,
                    'is_featured' => true,
                ],
                'subjects' => [$arabicId, $historyId, $philosophyId],
                'availability' => [
                    ['day' => 0, 'start' => '14:00', 'end' => '21:00'],
                    ['day' => 1, 'start' => '14:00', 'end' => '21:00'],
                    ['day' => 2, 'start' => '14:00', 'end' => '21:00'],
                    ['day' => 3, 'start' => '14:00', 'end' => '21:00'],
                    ['day' => 4, 'start' => '14:00', 'end' => '21:00'],
                    ['day' => 6, 'start' => '09:00', 'end' => '15:00'],
                ],
            ],
        ];

        // ── Map integer day keys to day name strings ──────────────────────
        // DB stores 0-6 (integer), frontend maps to named strings
        // dayMap used for display only, not here

        // ── Create each tutor ─────────────────────────────────────────────
        foreach ($tutors as $tutorData) {
            $user = User::create([
                'name'      => $tutorData['user']['name'],
                'email'     => $tutorData['user']['email'],
                'phone'     => $tutorData['user']['phone'],
                'password'  => Hash::make('password'),
                'role'      => 'tutor',
                'locale'    => 'ar',
                'is_active' => true,
            ]);

            $profileData = $tutorData['profile'];
            $profileData['user_id']          = $user->id;
            $profileData['slug']             = Str::slug($tutorData['user']['name']) . '-' . $user->id;
            $profileData['currency']         = 'EGP';
            $profileData['onboarding_step']  = 7;
            $profileData['onboarding_status'] = $profileData['verification_status'] === 'verified' ? 'approved' : 'pending_review';

            $profile = TutorProfile::create($profileData);

            // Assign subjects
            foreach ($tutorData['subjects'] as $subjectId) {
                if ($subjectId) {
                    TutorSubject::create([
                        'tutor_profile_id' => $profile->id,
                        'subject_id'       => $subjectId,
                        'proficiency_level' => 'advanced',
                        'hourly_rate'       => $profileData['hourly_rate'],
                    ]);
                }
            }

            // Assign availability
            foreach ($tutorData['availability'] as $slot) {
                TutorAvailability::create([
                    'tutor_profile_id' => $profile->id,
                    'day_of_week'      => $slot['day'], // integer 0=Sunday..6=Saturday
                    'start_time'       => $slot['start'] . ':00',
                    'end_time'         => $slot['end'] . ':00',
                    'is_active'        => true,
                ]);
            }
        }
    }
}
