<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Subject;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class SubjectController extends Controller
{
    public function index(): JsonResponse
    {
        return $this->success(Subject::with('category')->orderBy('name_en')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'category_id' => ['required', 'exists:subject_categories,id'],
            'name_ar'     => ['required', 'string', 'max:255'],
            'name_en'     => ['required', 'string', 'max:255'],
            'icon'        => ['nullable', 'string', 'max:10'],
            'levels'      => ['nullable', 'array'],
            'levels.*'    => ['string', 'max:100'],
        ]);

        $validated['slug'] = Str::slug($validated['name_en']);

        return $this->created(Subject::create($validated));
    }

    public function show(int $id): JsonResponse
    {
        return $this->success(Subject::with('category')->findOrFail($id));
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $subject = Subject::findOrFail($id);

        $validated = $request->validate([
            'name_ar'     => ['sometimes', 'string', 'max:255'],
            'name_en'     => ['sometimes', 'string', 'max:255'],
            'icon'        => ['nullable', 'string', 'max:10'],
            'category_id' => ['sometimes', 'exists:subject_categories,id'],
            'is_active'   => ['sometimes', 'boolean'],
            'levels'      => ['nullable', 'array'],
            'levels.*'    => ['string', 'max:100'],
        ]);

        $subject->update($validated);
        return $this->success($subject->fresh()->load('category'));
    }

    public function destroy(int $id): JsonResponse
    {
        Subject::findOrFail($id)->delete();
        return $this->success(null, 'Subject deleted');
    }
}

