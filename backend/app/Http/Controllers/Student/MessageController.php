<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\BookingRequest;
use App\Models\ConversationMessage;
use App\Services\WhatsAppService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MessageController extends Controller
{
    public function __construct(
        private readonly WhatsAppService $whatsApp
    ) {}

    private function frontendUrl(string $path): string
    {
        return config('app.frontend_url', 'http://localhost:3000') . $path;
    }

    // ─── GET /student/conversations ───────────────────────────────
    public function index(Request $request): JsonResponse
    {
        $studentId = $request->user()->id;

        $bookings = BookingRequest::where('student_id', $studentId)
            ->with([
                'tutor:id,name,avatar,phone,email',
                'subject:id,name_ar,name_en',
                'messages' => fn ($q) => $q->latest()->limit(1),
            ])
            ->orderBy('updated_at', 'desc')
            ->get()
            ->map(function (BookingRequest $booking) use ($studentId) {
                $lastMessage = $booking->messages->first();
                $unreadCount = ConversationMessage::where('booking_request_id', $booking->id)
                    ->where('is_read', false)
                    ->where('sender_id', '!=', $studentId)
                    ->count();

                return [
                    'booking_id'     => $booking->id,
                    'status'         => $booking->status,
                    'lesson_type'    => $booking->lesson_type,
                    'payment_status' => $booking->payment_status,
                    'payment_token'  => $booking->payment_token,
                    'tutor'          => $booking->tutor,
                    'subject'        => $booking->subject,
                    'last_message'   => $lastMessage ? [
                        'type'       => $lastMessage->type,
                        'body'       => $lastMessage->body,
                        'created_at' => $lastMessage->created_at,
                    ] : null,
                    'unread_count'   => $unreadCount,
                    'created_at'     => $booking->created_at,
                ];
            });

        return $this->success($bookings);
    }

    // ─── GET /student/conversations/{id}/messages ─────────────────
    public function messages(Request $request, int $id): JsonResponse
    {
        $booking = BookingRequest::where('student_id', $request->user()->id)
            ->with(['tutor:id,name,avatar,phone,email', 'subject:id,name_ar,name_en'])
            ->findOrFail($id);

        $messages = ConversationMessage::where('booking_request_id', $id)
            ->with('sender:id,name,avatar,role')
            ->orderBy('created_at')
            ->get();

        // Mark messages from tutor as read
        ConversationMessage::where('booking_request_id', $id)
            ->where('sender_id', '!=', $request->user()->id)
            ->where('is_read', false)
            ->update(['is_read' => true]);

        return $this->success([
            'booking'  => $booking,
            'messages' => $messages,
        ]);
    }

    // ─── POST /student/conversations/{id}/messages ────────────────
    public function send(Request $request, int $id): JsonResponse
    {
        $request->validate(['body' => ['required', 'string', 'max:2000']]);

        $student = $request->user();
        $booking = BookingRequest::where('student_id', $student->id)
            ->whereIn('status', ['pending', 'accepted'])
            ->with(['tutor', 'subject'])
            ->findOrFail($id);

        $message = ConversationMessage::create([
            'booking_request_id' => $booking->id,
            'sender_id'          => $student->id,
            'type'               => 'text',
            'body'               => $request->body,
        ]);

        $booking->touch();

        // WhatsApp notification to tutor
        $tutor = $booking->tutor;
        if ($tutor?->phone) {
            $this->whatsApp->notifyNewChatMessage(
                recipientPhone: $tutor->phone,
                recipientName : $tutor->name,
                senderName    : $student->name,
                messagePreview: mb_substr($request->body, 0, 100),
                dashboardUrl  : $this->frontendUrl('/dashboard/tutor/messages')
            );
        }

        return $this->created($message->load('sender:id,name,avatar,role'));
    }

    // ─── POST /student/conversations/{id}/propose-date ────────────
    public function proposeDate(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'proposed_date' => ['required', 'date', 'after_or_equal:today'],
            'proposed_time' => ['required', 'date_format:H:i'],
        ]);

        $student = $request->user();
        $booking = BookingRequest::where('student_id', $student->id)
            ->where('status', 'accepted')
            ->with(['tutor', 'subject'])
            ->findOrFail($id);

        $message = ConversationMessage::create([
            'booking_request_id' => $booking->id,
            'sender_id'          => $student->id,
            'type'               => 'date_proposal',
            'body'               => null,
            'metadata'           => [
                'proposed_date' => $request->proposed_date,
                'proposed_time' => $request->proposed_time,
                'proposed_by'   => 'student',
            ],
        ]);

        $booking->touch();

        // WhatsApp to tutor
        $tutor = $booking->tutor;
        if ($tutor?->phone) {
            $this->whatsApp->notifyDateProposal(
                recipientPhone: $tutor->phone,
                recipientName : $tutor->name,
                proposerName  : $student->name,
                proposedDate  : $request->proposed_date,
                proposedTime  : $request->proposed_time,
                dashboardUrl  : $this->frontendUrl('/dashboard/tutor/messages')
            );
        }

        return $this->created($message->load('sender:id,name,avatar'));
    }

    // ─── POST /student/conversations/{id}/confirm-date ────────────
    public function confirmDate(Request $request, int $id): JsonResponse
    {
        $student = $request->user();
        $booking = BookingRequest::where('student_id', $student->id)
            ->with(['tutor', 'messages' => fn ($q) => $q->where('type', 'date_proposal')->latest()])
            ->findOrFail($id);

        // Find the last date proposal from tutor
        $proposal = $booking->messages->first();
        if (! $proposal || $proposal->metadata['proposed_by'] !== 'tutor') {
            return response()->json(['success' => false, 'message' => 'No tutor date proposal found to confirm.'], 422);
        }

        $date = $proposal->metadata['proposed_date'];
        $time = $proposal->metadata['proposed_time'];

        DB::transaction(function () use ($booking, $student, $date, $time) {
            $booking->update(['confirmed_date' => $date, 'confirmed_time' => $time]);

            ConversationMessage::create([
                'booking_request_id' => $booking->id,
                'sender_id'          => $student->id,
                'type'               => 'date_confirmed',
                'body'               => null,
                'metadata'           => ['confirmed_date' => $date, 'confirmed_time' => $time],
            ]);
        });

        $booking->touch();

        // WhatsApp to tutor
        $tutor = $booking->tutor;
        if ($tutor?->phone) {
            $this->whatsApp->notifyDateConfirmed(
                recipientPhone: $tutor->phone,
                recipientName : $tutor->name,
                confirmedDate : $date,
                confirmedTime : $time,
                dashboardUrl  : $this->frontendUrl('/dashboard/tutor/messages')
            );
        }

        return $this->success(null, 'تم تأكيد الموعد');
    }

    // ─── POST /student/conversations/{id}/mark-read ───────────────
    public function markRead(Request $request, int $id): JsonResponse
    {
        $studentId = $request->user()->id;
        BookingRequest::where('student_id', $studentId)->findOrFail($id);

        ConversationMessage::where('booking_request_id', $id)
            ->where('sender_id', '!=', $studentId)
            ->where('is_read', false)
            ->update(['is_read' => true]);

        return $this->success(null, 'Marked as read');
    }
}
