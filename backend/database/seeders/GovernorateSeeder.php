<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class GovernorateSeeder extends Seeder
{
    public function run(): void
    {
        $governorates = [
            ['name_ar' => 'القاهرة', 'name_en' => 'Cairo', 'slug' => 'cairo'],
            ['name_ar' => 'الجيزة', 'name_en' => 'Giza', 'slug' => 'giza'],
            ['name_ar' => 'الإسكندرية', 'name_en' => 'Alexandria', 'slug' => 'alexandria'],
            ['name_ar' => 'الشرقية', 'name_en' => 'Sharqia', 'slug' => 'sharqia'],
            ['name_ar' => 'القليوبية', 'name_en' => 'Qalyubia', 'slug' => 'qalyubia'],
            ['name_ar' => 'الدقهلية', 'name_en' => 'Dakahlia', 'slug' => 'dakahlia'],
            ['name_ar' => 'البحيرة', 'name_en' => 'Beheira', 'slug' => 'beheira'],
            ['name_ar' => 'المنوفية', 'name_en' => 'Monufia', 'slug' => 'monufia'],
            ['name_ar' => 'الغربية', 'name_en' => 'Gharbia', 'slug' => 'gharbia'],
            ['name_ar' => 'كفر الشيخ', 'name_en' => 'Kafr El Sheikh', 'slug' => 'kafr-el-sheikh'],
            ['name_ar' => 'دمياط', 'name_en' => 'Damietta', 'slug' => 'damietta'],
            ['name_ar' => 'بورسعيد', 'name_en' => 'Port Said', 'slug' => 'port-said'],
            ['name_ar' => 'الإسماعيلية', 'name_en' => 'Ismailia', 'slug' => 'ismailia'],
            ['name_ar' => 'السويس', 'name_en' => 'Suez', 'slug' => 'suez'],
            ['name_ar' => 'الفيوم', 'name_en' => 'Faiyum', 'slug' => 'faiyum'],
            ['name_ar' => 'بني سويف', 'name_en' => 'Beni Suef', 'slug' => 'beni-suef'],
            ['name_ar' => 'المنيا', 'name_en' => 'Minya', 'slug' => 'minya'],
            ['name_ar' => 'أسيوط', 'name_en' => 'Assiut', 'slug' => 'assiut'],
            ['name_ar' => 'سوهاج', 'name_en' => 'Sohag', 'slug' => 'sohag'],
            ['name_ar' => 'قنا', 'name_en' => 'Qena', 'slug' => 'qena'],
            ['name_ar' => 'الأقصر', 'name_en' => 'Luxor', 'slug' => 'luxor'],
            ['name_ar' => 'أسوان', 'name_en' => 'Aswan', 'slug' => 'aswan'],
            ['name_ar' => 'البحر الأحمر', 'name_en' => 'Red Sea', 'slug' => 'red-sea'],
            ['name_ar' => 'شمال سيناء', 'name_en' => 'North Sinai', 'slug' => 'north-sinai'],
            ['name_ar' => 'جنوب سيناء', 'name_en' => 'South Sinai', 'slug' => 'south-sinai'],
            ['name_ar' => 'مطروح', 'name_en' => 'Matrouh', 'slug' => 'matrouh'],
            ['name_ar' => 'الوادي الجديد', 'name_en' => 'New Valley', 'slug' => 'new-valley'],
        ];

        DB::table('governorates')->insert($governorates);

        // Seed Cairo cities
        $cairoId = DB::table('governorates')->where('slug', 'cairo')->value('id');
        $gizaId = DB::table('governorates')->where('slug', 'giza')->value('id');
        $alexId = DB::table('governorates')->where('slug', 'alexandria')->value('id');

        $cairoCities = [
            ['governorate_id' => $cairoId, 'name_ar' => 'مدينة نصر', 'name_en' => 'Nasr City', 'slug' => 'nasr-city'],
            ['governorate_id' => $cairoId, 'name_ar' => 'المعادي', 'name_en' => 'Maadi', 'slug' => 'maadi'],
            ['governorate_id' => $cairoId, 'name_ar' => 'مصر الجديدة', 'name_en' => 'Heliopolis', 'slug' => 'heliopolis'],
            ['governorate_id' => $cairoId, 'name_ar' => 'الزمالك', 'name_en' => 'Zamalek', 'slug' => 'zamalek'],
            ['governorate_id' => $cairoId, 'name_ar' => 'وسط البلد', 'name_en' => 'Downtown', 'slug' => 'downtown-cairo'],
            ['governorate_id' => $cairoId, 'name_ar' => 'المقطم', 'name_en' => 'Moqattam', 'slug' => 'moqattam'],
            ['governorate_id' => $cairoId, 'name_ar' => 'شبرا', 'name_en' => 'Shubra', 'slug' => 'shubra'],
            ['governorate_id' => $cairoId, 'name_ar' => 'عين شمس', 'name_en' => 'Ain Shams', 'slug' => 'ain-shams'],
            ['governorate_id' => $cairoId, 'name_ar' => 'المرج', 'name_en' => 'El Marg', 'slug' => 'el-marg'],
            ['governorate_id' => $cairoId, 'name_ar' => 'القاهرة الجديدة', 'name_en' => 'New Cairo', 'slug' => 'new-cairo'],
            ['governorate_id' => $gizaId, 'name_ar' => 'الدقي', 'name_en' => 'Dokki', 'slug' => 'dokki'],
            ['governorate_id' => $gizaId, 'name_ar' => 'المهندسين', 'name_en' => 'Mohandessin', 'slug' => 'mohandessin'],
            ['governorate_id' => $gizaId, 'name_ar' => 'الشيخ زايد', 'name_en' => 'Sheikh Zayed', 'slug' => 'sheikh-zayed'],
            ['governorate_id' => $gizaId, 'name_ar' => 'أكتوبر', 'name_en' => '6th of October', 'slug' => '6th-october'],
            ['governorate_id' => $gizaId, 'name_ar' => 'فيصل', 'name_en' => 'Faisal', 'slug' => 'faisal'],
            ['governorate_id' => $alexId, 'name_ar' => 'سيدي بشر', 'name_en' => 'Sidi Bishr', 'slug' => 'sidi-bishr'],
            ['governorate_id' => $alexId, 'name_ar' => 'المنتزه', 'name_en' => 'Montazah', 'slug' => 'montazah'],
            ['governorate_id' => $alexId, 'name_ar' => 'العجمي', 'name_en' => 'Agami', 'slug' => 'agami'],
            ['governorate_id' => $alexId, 'name_ar' => 'المعمورة', 'name_en' => 'Maamoura', 'slug' => 'maamoura'],
            ['governorate_id' => $alexId, 'name_ar' => 'الرمل', 'name_en' => 'Raml', 'slug' => 'raml'],
        ];

        DB::table('cities')->insert($cairoCities);

        // Seed Maadi neighborhoods
        $maadiId = DB::table('cities')->where('slug', 'maadi')->value('id');
        $nasrId  = DB::table('cities')->where('slug', 'nasr-city')->value('id');
        $newCairoId = DB::table('cities')->where('slug', 'new-cairo')->value('id');

        $neighborhoods = [
            ['city_id' => $maadiId, 'name_ar' => 'دجلة', 'name_en' => 'Degla', 'slug' => 'degla'],
            ['city_id' => $maadiId, 'name_ar' => 'المعادي الجديدة', 'name_en' => 'New Maadi', 'slug' => 'new-maadi'],
            ['city_id' => $maadiId, 'name_ar' => 'التحلية', 'name_en' => 'Tahliya', 'slug' => 'tahliya'],
            ['city_id' => $nasrId, 'name_ar' => 'الحي العاشر', 'name_en' => 'Area 10', 'slug' => 'nasr-area-10'],
            ['city_id' => $nasrId, 'name_ar' => 'الحي الثامن', 'name_en' => 'Area 8', 'slug' => 'nasr-area-8'],
            ['city_id' => $nasrId, 'name_ar' => 'ميدان الرماية', 'name_en' => 'Shooting Club', 'slug' => 'shooting-club'],
            ['city_id' => $newCairoId, 'name_ar' => 'التجمع الخامس', 'name_en' => '5th Settlement', 'slug' => '5th-settlement'],
            ['city_id' => $newCairoId, 'name_ar' => 'الرحاب', 'name_en' => 'Rehab', 'slug' => 'rehab'],
            ['city_id' => $newCairoId, 'name_ar' => 'مدينتي', 'name_en' => 'Madinaty', 'slug' => 'madinaty'],
        ];

        DB::table('neighborhoods')->insert($neighborhoods);
    }
}
