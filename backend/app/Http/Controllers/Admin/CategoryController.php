<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SubjectCategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CategoryController extends Controller
{
    public function index(): JsonResponse
    {
        return $this->success(SubjectCategory::withCount('subjects')->orderBy('sort_order')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name_ar' => ['required', 'string', 'max:255'],
            'name_en' => ['required', 'string', 'max:255'],
            'icon' => ['nullable', 'string', 'max:10'],
            'sort_order' => ['sometimes', 'integer'],
        ]);

        $validated['slug'] = Str::slug($validated['name_en']);

        return $this->created(SubjectCategory::create($validated));
    }

    public function show(int $id): JsonResponse
    {
        return $this->success(SubjectCategory::with('subjects')->findOrFail($id));
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $cat = SubjectCategory::findOrFail($id);
        $cat->update($request->only(['name_ar', 'name_en', 'icon', 'sort_order']));
        return $this->success($cat->fresh());
    }

    public function destroy(int $id): JsonResponse
    {
        SubjectCategory::findOrFail($id)->delete();
        return $this->success(null, 'Category deleted');
    }
}
