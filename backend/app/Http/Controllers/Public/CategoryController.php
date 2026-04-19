<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\SubjectCategory;
use Illuminate\Http\JsonResponse;

class CategoryController extends Controller
{
    public function index(): JsonResponse
    {
        $categories = SubjectCategory::withCount('subjects')
            ->orderBy('sort_order')
            ->get();

        return $this->success($categories);
    }
}
