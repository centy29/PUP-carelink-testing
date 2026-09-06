<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    protected AuthService $authService;

    public function __construct(AuthService $authService)
    {
        $this->authService = $authService;
    }

    /**
     * Register a new student
     */
    public function register(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'student_id' => 'required|string|max:50|unique:users,student_id',
                'first_name' => 'required|string|max:100',
                'middle_name' => 'nullable|string|max:100',
                'last_name' => 'required|string|max:100',
                'email' => 'required|email|max:191|unique:users,email',
                'password' => 'required|string|min:8|confirmed',
                'birthday' => 'nullable|date',
                'gender' => 'nullable|string|max:20',
                'course' => 'nullable|string|max:100',
                'year' => 'nullable|string|max:10',
                'section' => 'nullable|string|max:10',
                'mobile_number' => 'nullable|string|max:20',
            ], [
                'student_id.unique' => 'This Student ID is already registered.',
                'email.unique' => 'This email is already registered.',
                'password.confirmed' => 'Passwords do not match.',
            ]);

            $result = $this->authService->register($request->all());

            return response()->json([
                'success' => true,
                'message' => $result['message'],
                'data' => [
                    'user' => $result['user'],
                    'requires_verification' => false,
                ],
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

        /**
     * Login a user (student, nurse or admin)
     * - students authenticate with student_id + birthday + password
     * - nurses/admins authenticate with email + password
     */
    public function login(Request $request): JsonResponse
    {
        try {
            $data = $request->all();

            // No student_id => treat as nurse/admin login
            $result = isset($data['student_id'])
                ? $this->authService->login($data)
                : $this->authService->adminLogin($data['email'], $data['password']);

            return response()->json([
                'success' => true,
                'message' => 'Login successful.',
                'data' => [
                    'user' => $result['user'],
                    'token' => $result['token'],
                    'token_type' => $result['token_type'],
                    'expires_in' => $result['expires_in'],
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 401);
        }
        }

    /**
     * Forgot password - send OTP
     */
    public function forgotPassword(Request $request): JsonResponse
    {
        try {
            $result = $this->authService->forgotPassword($request->all());

            return response()->json([
                'success' => true,
                'message' => $result['message'],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Reset password with OTP
     */
    public function resetPassword(Request $request): JsonResponse
    {
        try {
            $result = $this->authService->resetPassword($request->all());

            return response()->json([
                'success' => true,
                'message' => $result['message'],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Logout user
     */
    public function logout(): JsonResponse
    {
        try {
            $this->authService->logout();

            return response()->json([
                'success' => true,
                'message' => 'Logged out successfully.',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Refresh token
     */
    public function refresh(): JsonResponse
    {
        try {
            $result = $this->authService->refreshToken();

            return response()->json([
                'success' => true,
                'data' => $result,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 401);
        }
    }

    /**
     * Get authenticated user
     */
    public function me(): JsonResponse
    {
        try {
            $user = $this->authService->getAuthenticatedUser();

            return response()->json([
                'success' => true,
                'data' => $user,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 401);
        }
    }
}