<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\Governorate;
use App\Models\City;
use App\Models\Neighborhood;
use Illuminate\Http\JsonResponse;

class LocationController extends Controller
{
    public function governorates(): JsonResponse
    {
        return $this->success(Governorate::orderBy('name_en')->get());
    }

    public function cities(int $governorate): JsonResponse
    {
        $cities = City::where('governorate_id', $governorate)->orderBy('name_en')->get();
        return $this->success($cities);
    }

    public function neighborhoods(int $city): JsonResponse
    {
        $neighborhoods = Neighborhood::where('city_id', $city)->orderBy('name_en')->get();
        return $this->success($neighborhoods);
    }
}
