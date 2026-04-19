<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\BookingRequest;
use App\Models\ConversationMessage;
use App\Models\TutorProfile;
use App\Services\WhatsAppService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BookingController extends Controller
{
    public function __construct(
        private readonly WhatsAppService $whatsApp
    ) {}

    private function frontendUrl(string $path): string
    {
        return config('app.frontend_url', 'http://localhost:3000') . $path;
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'tutor_id'     => ['required', 'exists:users,id'],
            'subject_id'   => ['required', 'exists:subjects,id'],
            'lesson_format'=> ['required', 'in:online,in_person'],
            'message'      => ['nullable', 'string', 'max:1000'],
            'preferred_date'=> ['nullable', 'date', 'after_or_equal:today'],
            'preferred_time'=> ['nullable', 'date_format:H:i'],
        ]);

        $student      = $request->user();
        $tutorProfile = TutorProfile::where('user_id', $validated['tutor_id'])->firstOrFail();

        $booking = BookingRequest::create([
            'student_id'    => $student->id,
            'tutor_id'      => $validated['tutor_id'],
            'subject_id'    => $validated['subject_id'],
            'lesson_format' => $validated['lesson_format'],
            'message'       => $validated['message'] ?? null,
            'preferred_date'=> $validated['preferred_date'] ?? null,
            'preferred_time'=> $validated['preferred_time'] ?? null,
            'hourly_rate'   => $tutorProfile->hourly_rate,
            'status'        => 'pending',
        ]);

        $booking->load(['tutor:id,name,phone', 'subject:id,name_ar,name_en']);

        // Auto-create first conversation message (booking_request type)
        ConversationMessage::create([
            'booking_request_id' => $booking->id,
            'sender_id'          => $student->id,
            'type'               => 'booking_request',
            'body'               => $validated['message'] ?? null,
            'metadata'           => [
                'subject_name_ar'  => $booking->subject->name_ar,
                'subject_name_en'  => $booking->subject->name_en,
                'lesson_format'    => $validated['lesson_format'],
                'preferred_date'   => $validated['preferred_date'] ?? null,
                'preferred_time'   => $validated['preferred_time'] ?? null,
                'student_name'     => $student->name,
            ],
        ]);

        // WhatsApp notify tutor of new booking request
        $tutor = $booking->tutor;
        if ($tutor?->phone) {
            $this->whatsApp->notifyTutorNewBookingRequest(
                tutorPhone  : $tutor->phone,
                tutorName   : $tutor->name,
                studentName : $student->name,
                subjectName : $booking->subject->name_ar ?? $booking->subject->name_en,
                dashboardUrl: $this->frontendUrl('/dashboard/tutor/messages')
            );
        }

        // WhatsApp confirm to student — delayed 65 s to respect Wasender's
        // free-trial rate limit (1 msg / 60 s per account).
        if ($student->phone) {
            $studentPhone  = $student->phone;
            $studentName   = $student->name;
            $tutorName     = $tutor->name;
            $subjectName   = $booking->subject->name_ar ?? $booking->subject->name_en;
            $dashboardUrl  = $this->frontendUrl('/dashboard/student/messages');
            $whatsApp      = $this->whatsApp;

            dispatch(function () use ($whatsApp, $studentPhone, $studentName, $tutorName, $subjectName, $dashboardUrl) {
                $whatsApp->notifyStudentBookingRequestSent(
                    studentPhone : $studentPhone,
                    studentName  : $studentName,
                    tutorName    : $tutorName,
                    subjectName  : $subjectName,
                    dashboardUrl : $dashboardUrl
                );
            })->delay(now()->addSeconds(65));
        }

        return $this->created(
            $booking->load(['tutor:id,name', 'subject']),
            'Booking request sent'
        );
    }

    public function index(Request $request): JsonResponse
    {
        $bookings = BookingRequest::where('student_id', $request->user()->id)
            ->with(['tutor:id,name,avatar', 'subject'])
            ->when($request->filled('status'), fn ($q) => $q->byStatus($request->status))
            ->orderBy('created_at', 'desc')
            ->paginate(10);

        return $this->success($bookings);
    }

    public function cancel(Request $request, int $id): JsonResponse
    {
        $booking = BookingRequest::where('student_id', $request->user()->id)
            ->where('id', $id)
            ->whereIn('status', ['pending', 'accepted'])
            ->firstOrFail();

        $booking->update(['status' => 'cancelled']);

        return $this->success(null, 'Booking cancelled');
    }
}

