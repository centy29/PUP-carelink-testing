<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\VerifyEmailRequest;
use App\Http\Requests\Auth\ResendOTPRequest;
use App\Services\AuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use App\Mail\VerifyEmail;

class AuthController extends Controller
{
    protected AuthService $authService;

    public function __construct(AuthService $authService)
    {
        $this->authService = $authService;
    }

    /**
     * Send OTP to email before registration
     */
    public function sendOTP(Request $request): JsonResponse
    {
        $request->validate([
            'email' => [
                'required',
                'email',
                'regex:/@iskolarngbayan\.pup\.edu\.ph$/',
                'unique:users,email'
            ],
        ], [
            'email.regex' => 'Please use your PUP Webmail (@iskolarngbayan.pup.edu.ph).',
            'email.unique' => 'This email is already registered.',
        ]);

        try {
            $tempUser = new \App\Models\User();
            $tempUser->email = $request->email;
            $tempUser->id = Str::uuid();
            $tempUser->first_name = 'Student';
            
            $otp = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
            
            // Store OTP in cache (5 minutes expiry)
            Cache::put('otp_' . $request->email, $otp, now()->addMinutes(5));

            // Send OTP via email (to PUP Webmail or any email)
            try {// Send OTP to alternate email, NOT PUP Webmail
                    $alternateEmail = $request->alternate_email;
                    Mail::to($alternateEmail)->send(new VerifyEmail($tempUser, $otp));
                    \Log::info('OTP sent to alternate email: ' . $alternateEmail . ' | OTP: ' . $otp);
            } catch (\Exception $e) {
                \Log::error('Email failed: ' . $e->getMessage());
                \Log::info('OTP for ' . $request->email . ': ' . $otp);
            }

            return response()->json([
                'success' => true,
                'message' => 'OTP sent to your PUP Webmail. Please check your inbox.',
                'data' => [
                    'email' => $request->email,
                    'expires_in' => 300,
                ]
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to send OTP. Please try again.',
            ], 400);
        }
    }

    /**
     * Verify OTP sent to email
     */
    public function verifyOTP(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
            'otp' => 'required|string|size:6',
        ]);

        $cachedOTP = Cache::get('otp_' . $request->email);

        if (!$cachedOTP || $cachedOTP !== $request->otp) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid or expired OTP.',
            ], 400);
        }

        // Generate verification token (valid for 30 minutes)
        $token = Str::random(64);
        Cache::put('verified_' . $request->email, $token, now()->addMinutes(30));

        // Remove OTP after successful verification
        Cache::forget('otp_' . $request->email);

        return response()->json([
            'success' => true,
            'message' => 'Email verified successfully.',
            'data' => [
                'email' => $request->email,
                'verification_token' => $token,
            ]
        ], 200);
    }

    /**
     * Register a new student
     */
    public function register(Request $request): JsonResponse
    {
        try {
            // Verify the email was validated first
            $verifiedToken = Cache::get('verified_' . $request->email);
            
            if (!$verifiedToken || $verifiedToken !== $request->verification_token) {
                return response()->json([
                    'success' => false,
                    'message' => 'Please verify your PUP Webmail first.',
                ], 400);
            }

            $result = $this->authService->register($request->all());

            // Remove verification token after successful registration
            Cache::forget('verified_' . $request->email);

            return response()->json([
                'success' => true,
                'message' => $result['message'],
                'data' => [
                    'user' => $result['user'],
                    'requires_verification' => true,
                ],
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Login student
     */
    public function login(Request $request): JsonResponse
    {
        try {
            $result = $this->authService->login($request->all());

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
     * Verify email with OTP (after registration)
     */
    public function verifyEmail(VerifyEmailRequest $request): JsonResponse
    {
        try {
            $result = $this->authService->verifyEmailOTP(
                $request->student_id,
                $request->otp
            );

            return response()->json([
                'success' => true,
                'message' => $result['message'],
                'data' => $result['user'],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Resend OTP
     */
    public function resendOTP(ResendOTPRequest $request): JsonResponse
    {
        try {
            $result = $this->authService->resendOTP($request->student_id);

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