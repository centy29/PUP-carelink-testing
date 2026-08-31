<?php

namespace App\Services;

use App\Models\User;
use App\Models\PasswordReset;
use App\Repositories\Contracts\UserRepositoryInterface;
use App\Repositories\Contracts\EmailVerificationRepositoryInterface;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Tymon\JWTAuth\Facades\JWTAuth;
use App\Mail\VerifyEmail;
use App\Mail\PasswordResetMail;
use Carbon\Carbon;

class AuthService
{
    protected UserRepositoryInterface $userRepository;
    protected EmailVerificationRepositoryInterface $emailVerificationRepository;

    public function __construct(
        UserRepositoryInterface $userRepository,
        EmailVerificationRepositoryInterface $emailVerificationRepository
    ) {
        $this->userRepository = $userRepository;
        $this->emailVerificationRepository = $emailVerificationRepository;
    }

    public function register(array $data): array
    {
        $user = $this->userRepository->create([
            'student_id' => $data['student_id'],
            'first_name' => $data['first_name'],
            'middle_name' => $data['middle_name'] ?? null,
            'last_name' => $data['last_name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'role' => 'student',
            'birthday' => $data['birthday'] ?? null,
            'gender' => $data['gender'] ?? null,
            'course' => $data['course'] ?? null,
            'year' => $data['year'] ?? null,
            'section' => $data['section'] ?? null,
            'mobile_number' => $data['mobile_number'] ?? null,
            // Auto-verify since already verified via registration OTP flow
            'email_verified_at' => now(),
            'status' => 'active',
        ]);

        $this->generateQRCode($user);
        // No need to send OTP again - already verified in registration steps 1-3

        return ['user' => $user, 'message' => 'Registration successful. You can now login.'];
    }

    public function login(array $credentials): array
    {
        $user = $this->userRepository->findByStudentId($credentials['student_id']);
        if (!$user) throw new \Exception('Student ID not found.');

        if ($user->role === 'student') {
            $birthday = $user->birthday instanceof \DateTime ? $user->birthday->format('Y-m-d') : Carbon::parse($user->birthday)->format('Y-m-d');
            if ($birthday !== $credentials['birthday']) throw new \Exception('Invalid birthday.');
        }

        if ($user->status === 'archived') throw new \Exception('Account archived.');
        if ($user->status === 'inactive') throw new \Exception('Account inactive.');
        if (!$this->verifyPassword($credentials['password'], $user->password)) throw new \Exception('Invalid password.');
        if (!$user->email_verified_at && $user->role === 'student') throw new \Exception('Please verify your email first.');

        $this->userRepository->recordLogin($user, request()->ip());
        $token = JWTAuth::fromUser($user);
        $ttl = JWTAuth::factory()->getTTL();

        return ['user' => $user, 'token' => $token, 'token_type' => 'bearer', 'expires_in' => $ttl * 60, 'role' => $user->role];
    }

    public function adminLogin(string $email, string $password): array
    {
        $user = User::where('email', $email)->whereIn('role', ['admin', 'nurse'])->first();
        if (!$user || !$this->verifyPassword($password, $user->password)) {
            throw new \Exception('Invalid credentials.');
        }

        $token = JWTAuth::fromUser($user);
        $ttl = JWTAuth::factory()->getTTL();

        return [
            'user' => $user,
            'token' => $token,
            'token_type' => 'bearer',
            'expires_in' => $ttl * 60,
            'role' => $user->role
        ];
    }

    public function verifyEmailOTP(string $studentId, string $otp): array
    {
        $user = $this->userRepository->findByStudentId($studentId);
        if (!$user) throw new \Exception('User not found.');

        $verification = $this->emailVerificationRepository->findValidOtp($user, $otp);
        if (!$verification) throw new \Exception('Invalid or expired OTP.');

        $this->emailVerificationRepository->markAsUsed($verification);
        $this->userRepository->verifyEmail($user);
        return ['message' => 'Email verified.', 'user' => $user];
    }

    public function resendOTP(string $studentId): array
    {
        $user = $this->userRepository->findByStudentId($studentId);
        if (!$user) throw new \Exception('User not found.');
        if ($user->email_verified_at) throw new \Exception('Already verified.');

        $this->emailVerificationRepository->invalidateOldOtps($user);
        $this->sendOTP($user);
        return ['message' => 'OTP resent.'];
    }

    public function forgotPassword(array $data): array
    {
        $user = $this->userRepository->findByEmail($data['email']);
        if (!$user) throw new \Exception('Email not found.');

        PasswordReset::where('user_id', $user->id)->where('is_used', false)->update(['is_used' => true]);
        $otp = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        PasswordReset::create([
            'user_id' => $user->id,
            'otp' => $otp,
            'expires_at' => now()->addMinutes(5),
            'is_used' => false
        ]);

        try {
            Mail::to($user->email)->send(new PasswordResetMail($user, $otp));
            \Log::info('Password OTP sent: ' . $otp);
        } catch (\Exception $e) {
            \Log::error('Email failed: ' . $e->getMessage());
            \Log::info('Password OTP: ' . $otp);
        }

        return ['message' => 'OTP sent.'];
    }

    public function resetPassword(array $data): array
    {
        $user = $this->userRepository->findByEmail($data['email']);
        if (!$user) throw new \Exception('Email not found.');

        $pr = PasswordReset::where('user_id', $user->id)
            ->where('otp', $data['otp'])
            ->where('is_used', false)
            ->where('expires_at', '>', now())
            ->latest()->first();

        if (!$pr) throw new \Exception('Invalid or expired OTP.');

        $pr->update(['is_used' => true]);
        $this->userRepository->update($user, ['password' => Hash::make($data['password'])]);
        return ['message' => 'Password reset.'];
    }

    public function logout(): bool
    {
        try {
            JWTAuth::invalidate(JWTAuth::getToken());
        } catch (\Exception $e) {
        }
        return true;
    }

    public function refreshToken(): array
    {
        $token = JWTAuth::refresh(JWTAuth::getToken());
        $ttl = JWTAuth::factory()->getTTL();
        return ['token' => $token, 'token_type' => 'bearer', 'expires_in' => $ttl * 60];
    }

    public function getAuthenticatedUser()
    {
        return auth()->user()->load('profile', 'qrCode');
    }

    /**
     * Verify a login password against the stored value.
     *
     * TESTING SETUP: the seeded test accounts store their passwords as
     * PLAIN TEXT in the database so they are readable when inspected.
     * This check therefore accepts:
     *   1. an exact plain-text match (seeded test accounts), and
     *   2. a bcrypt hash match (real accounts registered via the app,
     *      which are hashed by register()/resetPassword()).
     *
     * FOR PRODUCTION: delete the plain-text comparison below and revert
     * the seeder to Hash::make('...') so only hashed passwords work.
     */
    protected function verifyPassword(string $input, string $stored): bool
    {
        if ($input === $stored) return true; // plain text match (testing only)
        return Hash::check($input, $stored); // bcrypt hash match (normal accounts)
    }

    protected function sendOTP(User $user): void
    {
        $otp = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        $this->emailVerificationRepository->create($user, $user->email, $otp);
        try {
            Mail::to($user->email)->send(new VerifyEmail($user, $otp));
            \Log::info('OTP sent: ' . $otp);
        } catch (\Exception $e) {
            \Log::error('Email failed: ' . $e->getMessage());
            \Log::info('OTP: ' . $otp);
        }
    }

    protected function generateQRCode(User $user): void
    {
        $hash = hash('sha256', $user->id . Str::random(32));
        $user->qrCode()->create(['qr_code_hash' => $hash, 'is_active' => true]);
    }
}