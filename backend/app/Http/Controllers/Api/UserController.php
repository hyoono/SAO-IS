<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    /**
     * GET /users — List users, optionally filter by role.
     * Admin only.
     */
    public function index(Request $request): JsonResponse
    {
        $query = User::query()->orderBy('name');

        if ($role = $request->query('role')) {
            $query->where('role', $role);
        }

        return response()->json($query->paginate(20));
    }

    /**
     * POST /users — Create a local user account.
     * Admin only.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'role' => ['required', Rule::in(['admin', 'staff', 'org_officer', 'student', 'faculty'])],
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password_hash' => Hash::make($validated['password']),
            'role' => $validated['role'],
        ]);

        return response()->json([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'created_at' => $user->created_at,
        ], 201);
    }

    /**
     * GET /users/:id — Get user profile.
     * Admin or the user themselves.
     */
    public function show(Request $request, User $user): JsonResponse
    {
        /** @var User $currentUser */
        $currentUser = $request->user();

        if ($currentUser->role !== 'admin' && $currentUser->id !== $user->id) {
            abort(403, 'You can only view your own profile.');
        }

        return response()->json([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'ms365_id' => $user->ms365_id,
            'created_at' => $user->created_at,
            'updated_at' => $user->updated_at,
        ]);
    }

    /**
     * PATCH /users/:id — Update name, role, or password.
     * Admin or the user themselves (self can only change name/password, not role).
     */
    public function update(Request $request, User $user): JsonResponse
    {
        /** @var User $currentUser */
        $currentUser = $request->user();
        $isAdmin = $currentUser->role === 'admin';
        $isSelf = $currentUser->id === $user->id;

        if (!$isAdmin && !$isSelf) {
            abort(403, 'You do not have permission to update this user.');
        }

        $rules = [
            'name' => ['sometimes', 'string', 'max:255'],
            'password' => ['sometimes', 'string', 'min:8'],
        ];

        // Only admin can change roles
        if ($isAdmin) {
            $rules['role'] = ['sometimes', Rule::in(['admin', 'staff', 'org_officer', 'student', 'faculty'])];
        }

        $validated = $request->validate($rules);

        if (isset($validated['name'])) {
            $user->name = $validated['name'];
        }

        if (isset($validated['password'])) {
            $user->password_hash = Hash::make($validated['password']);
        }

        if ($isAdmin && isset($validated['role'])) {
            $user->role = $validated['role'];
        }

        $user->save();

        return response()->json([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'updated_at' => $user->updated_at,
        ]);
    }
}
