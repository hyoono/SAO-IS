<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Document;
use App\Models\Notification;
use App\Models\User;
use App\Models\WorkflowTemplate;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function summary(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $unreadNotifications = Notification::where('user_id', $user->id)
            ->where('is_read', false)
            ->count();

        $modules = match ($user->role) {
            'admin' => $this->adminModules($unreadNotifications),
            'staff' => $this->staffModules($user, $unreadNotifications),
            'org_officer' => $this->submitterModules($user, 'Organization Compliance', $unreadNotifications),
            'student' => $this->submitterModules($user, 'Student Requests', $unreadNotifications),
            'faculty' => $this->facultyModules($user, $unreadNotifications),
            default => [],
        };

        return response()->json([
            'role' => $user->role,
            'modules' => $modules,
        ]);
    }

    private function adminModules(int $unreadNotifications): array
    {
        return [
            [
                'title' => 'Active Users',
                'value' => User::count(),
                'detail' => 'Total accounts registered in SAO-IS.',
            ],
            [
                'title' => 'Workflow Templates',
                'value' => WorkflowTemplate::count(),
                'detail' => 'Templates currently governing document approvals.',
            ],
            [
                'title' => 'Unread Notifications',
                'value' => $unreadNotifications,
                'detail' => 'Alerts requiring administrator review.',
            ],
        ];
    }

    private function staffModules(User $user, int $unreadNotifications): array
    {
        $staffQueue = Document::whereIn('status', ['pending', 'in_review'])
            ->whereHas('currentStep', function ($query) use ($user): void {
                $query->where('assignee_role', 'staff')
                    ->orWhere('assignee_user_id', $user->id);
            })
            ->count();

        $requestedInfo = Document::where('status', 'awaiting_info')->count();

        return [
            [
                'title' => 'Pending Reviews',
                'value' => $staffQueue,
                'detail' => 'Documents currently assigned for staff review.',
            ],
            [
                'title' => 'Awaiting Info',
                'value' => $requestedInfo,
                'detail' => 'Submissions waiting for requester updates.',
            ],
            [
                'title' => 'Unread Notifications',
                'value' => $unreadNotifications,
                'detail' => 'Staff alerts and approval follow-ups.',
            ],
        ];
    }

    private function submitterModules(User $user, string $labelPrefix, int $unreadNotifications): array
    {
        $myDocuments = Document::where('submitted_by', $user->id);

        return [
            [
                'title' => $labelPrefix,
                'value' => (clone $myDocuments)->count(),
                'detail' => 'Documents you have submitted so far.',
            ],
            [
                'title' => 'In Progress',
                'value' => (clone $myDocuments)->whereIn('status', ['pending', 'in_review', 'awaiting_info'])->count(),
                'detail' => 'Requests still moving through workflow steps.',
            ],
            [
                'title' => 'Unread Notifications',
                'value' => $unreadNotifications,
                'detail' => 'Updates related to your requests.',
            ],
        ];
    }

    private function facultyModules(User $user, int $unreadNotifications): array
    {
        $endorsementQueue = Document::whereIn('status', ['pending', 'in_review'])
            ->whereHas('currentStep', function ($query) use ($user): void {
                $query->where('assignee_role', 'faculty')
                    ->orWhere('assignee_user_id', $user->id);
            })
            ->count();

        $completed = Document::whereIn('status', ['approved', 'rejected'])->count();

        return [
            [
                'title' => 'Pending Endorsements',
                'value' => $endorsementQueue,
                'detail' => 'Requests assigned for faculty endorsement.',
            ],
            [
                'title' => 'Resolved Requests',
                'value' => $completed,
                'detail' => 'Documents closed through final decisions.',
            ],
            [
                'title' => 'Unread Notifications',
                'value' => $unreadNotifications,
                'detail' => 'Faculty updates and reminders.',
            ],
        ];
    }
}
