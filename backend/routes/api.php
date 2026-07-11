<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\Student\ProfileController;
use App\Http\Controllers\Api\Student\HealthProfileController;
use App\Http\Controllers\Api\Student\AppointmentController as StudentAppointmentController;
use App\Http\Controllers\Api\Student\ConsultationController as StudentConsultationController;
use App\Http\Controllers\Api\Student\DashboardController as StudentDashboardController;
use App\Http\Controllers\Api\Nurse\AppointmentController as NurseAppointmentController;
use App\Http\Controllers\Api\Nurse\ConsultationController as NurseConsultationController;
use App\Http\Controllers\Api\Nurse\StudentController as NurseStudentController;
use App\Http\Controllers\Api\Nurse\DashboardController as NurseDashboardController;
use App\Http\Controllers\Api\Nurse\AnnouncementController;
use App\Http\Controllers\Api\Nurse\MedicineController;
use App\Http\Controllers\Api\Kiosk\CheckinController;
use App\Http\Controllers\Api\Kiosk\KioskController;
use App\Services\AuthService;

/*
|--------------------------------------------------------------------------
| API Routes - PUPBC CareLink
|--------------------------------------------------------------------------
*/

// ============================================
// HEALTH CHECK
// ============================================
Route::get('/health', function () {
    return response()->json([
        'success' => true,
        'status' => 'healthy',
        'version' => '1.0.0',
        'timestamp' => now()->toDateTimeString(),
        'environment' => app()->environment(),
    ]);
});

// ============================================
// TEST ROUTE
// ============================================
Route::get('/test', function () {
    return response()->json([
        'success' => true,
        'message' => 'PUPBC CareLink API is working!',
        'version' => '1.0.0',
        'timestamp' => now()->toDateTimeString()
    ]);
});

// ============================================
// PUBLIC ROUTES (No Authentication Required)
// ============================================

// KIOSK ROUTES (Public - no auth needed for tablet kiosk)
// Rate limited: 30 requests per minute for kiosk
Route::prefix('kiosk')->middleware('throttle:30,1')->group(function () {
    Route::post('/lookup', [KioskController::class, 'lookup']);
    Route::post('/checkin', [KioskController::class, 'checkin']);
    Route::get('/queue', [KioskController::class, 'todayQueue']);
    Route::post('/call-next', [KioskController::class, 'callNext']);
    Route::post('/verify-qr', [CheckinController::class, 'verifyQR']);
    Route::get('/today-checkins', [CheckinController::class, 'todayCheckins']);
    Route::get('/appointment/{reference}', [CheckinController::class, 'getAppointment']);
    Route::get('/available-slots', [KioskController::class, 'availableSlots']);
});

// Authentication Routes
// Rate limited: 10 requests per minute (login/register)
Route::prefix('auth')->middleware('throttle:10,1')->group(function () {
    Route::post('/send-otp', [AuthController::class, 'sendOTP']);
    Route::post('/verify-otp', [AuthController::class, 'verifyOTP']);
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/verify-email', [AuthController::class, 'verifyEmail']);
    Route::post('/resend-otp', [AuthController::class, 'resendOTP']);
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('/reset-password', [AuthController::class, 'resetPassword']);
    
    // Admin/Nurse Login
    Route::post('/admin-login', function (Request $request) {
        try {
            $request->validate([
                'email' => 'required|email',
                'password' => 'required|string|min:6',
            ]);

            $authService = app(AuthService::class);
            $result = $authService->adminLogin($request->email, $request->password);
            
            return response()->json([
                'success' => true,
                'message' => 'Login successful',
                'data' => $result
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 401);
        }
    });
});

// Public Announcements
// Rate limited: 60 requests per minute
Route::middleware('throttle:60,1')->group(function () {
    Route::get('/announcements', [AnnouncementController::class, 'index']);
    Route::get('/announcements/{id}', [AnnouncementController::class, 'show']);
});

// ============================================
// PROTECTED ROUTES (Authentication + Rate Limiting)
// ============================================
// Rate limit: 60 requests per minute per authenticated user
Route::middleware(['auth:api', 'throttle:60,1'])->group(function () {
    
    // Auth Management
    Route::prefix('auth')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::post('/refresh', [AuthController::class, 'refresh']);
        Route::get('/me', [AuthController::class, 'me']);
    });

    // Notifications
    Route::prefix('notifications')->group(function () {
        Route::get('/', function (Request $request) {
            $notifications = \App\Models\Notification::where('user_id', auth()->id())
                ->orderBy('created_at', 'desc')->paginate(20);
            return response()->json(['success' => true, 'data' => $notifications]);
        });
        Route::patch('/{id}/read', function ($id) {
            \App\Models\Notification::where('id', $id)
                ->where('user_id', auth()->id())
                ->update(['read' => true, 'read_at' => now()]);
            return response()->json(['success' => true, 'message' => 'Marked as read']);
        });
        Route::patch('/read-all', function () {
            \App\Models\Notification::where('user_id', auth()->id())
                ->update(['read' => true, 'read_at' => now()]);
            return response()->json(['success' => true, 'message' => 'All marked as read']);
        });
    });

    // ============================================
    // STUDENT ROUTES
    // ============================================
    Route::prefix('student')->group(function () {
        Route::get('/profile', [ProfileController::class, 'show']);
        Route::put('/profile', [ProfileController::class, 'update']);
        Route::post('/profile/avatar', [ProfileController::class, 'uploadAvatar']);
        Route::get('/health-profile', [HealthProfileController::class, 'show']);
        Route::post('/health-profile', [HealthProfileController::class, 'store']);
        Route::put('/health-profile', [HealthProfileController::class, 'update']);
        Route::get('/health-profile/status', [HealthProfileController::class, 'checkStatus']);
        Route::get('/appointments', [StudentAppointmentController::class, 'index']);
        Route::post('/appointments', [StudentAppointmentController::class, 'store']);
        Route::get('/appointments/{id}', [StudentAppointmentController::class, 'show']);
        Route::patch('/appointments/{id}/cancel', [StudentAppointmentController::class, 'cancel']);
        Route::get('/appointments/check-duplicate', [StudentAppointmentController::class, 'checkDuplicate']);
        Route::get('/available-slots', [StudentAppointmentController::class, 'availableSlots']);
        Route::get('/consultations', [StudentConsultationController::class, 'index']);
        Route::get('/consultations/{id}', [StudentConsultationController::class, 'show']);
        Route::get('/consultations/latest', [StudentConsultationController::class, 'latest']);
        Route::get('/qr', [StudentAppointmentController::class, 'getQRCode']);
        Route::get('/qr/status', [StudentAppointmentController::class, 'checkQRStatus']);
        Route::get('/dashboard-stats', [StudentDashboardController::class, 'stats']);
        Route::get('/upcoming-appointments', [StudentDashboardController::class, 'upcomingAppointments']);
        Route::get('/recent-consultations', [StudentDashboardController::class, 'recentConsultations']);
    });

    // ============================================
    // NURSE/ADMIN ROUTES
    // ============================================
    Route::prefix('nurse')->group(function () {
        
        // Dashboard Statistics
        Route::get('/dashboard-stats', [NurseDashboardController::class, 'stats']);
        Route::get('/dashboard/appointments-today', [NurseDashboardController::class, 'appointmentsToday']);
        Route::get('/dashboard/recent-activity', [NurseDashboardController::class, 'recentActivity']);
        
        // Appointment Management
        Route::get('/appointments', [NurseAppointmentController::class, 'index']);
        Route::get('/appointments/{id}', [NurseAppointmentController::class, 'show']);
        Route::patch('/appointments/{id}/approve', [NurseAppointmentController::class, 'approve']);
        Route::patch('/appointments/{id}/reject', [NurseAppointmentController::class, 'reject']);
        Route::patch('/appointments/{id}/reschedule', [NurseAppointmentController::class, 'reschedule']);
        Route::patch('/appointments/{id}/complete', [NurseAppointmentController::class, 'complete']);
        Route::get('/appointments/filter/{status}', [NurseAppointmentController::class, 'filterByStatus']);
        Route::get('/appointments/date/{date}', [NurseAppointmentController::class, 'filterByDate']);
        
        // Student Management
        Route::get('/students', [NurseStudentController::class, 'index']);
        Route::get('/students/search', [NurseStudentController::class, 'search']);
        Route::get('/students/{id}', [NurseStudentController::class, 'show']);
        Route::get('/students/{id}/health-profile', [NurseStudentController::class, 'healthProfile']);
        Route::get('/students/{id}/appointments', [NurseStudentController::class, 'appointments']);
        Route::get('/students/{id}/consultations', [NurseStudentController::class, 'consultations']);
        
        // Consultation Management
        Route::get('/consultations', [NurseConsultationController::class, 'index']);
        Route::post('/consultations', [NurseConsultationController::class, 'store']);
        Route::get('/consultations/{id}', [NurseConsultationController::class, 'show']);
        Route::put('/consultations/{id}', [NurseConsultationController::class, 'update']);
        Route::get('/consultations/today', [NurseConsultationController::class, 'todayConsultations']);
        Route::get('/consultations/filter/{date}', [NurseConsultationController::class, 'filterByDate']);
        
        // Medicine Inventory
        Route::get('/medicines/stats', [MedicineController::class, 'stats']);
        Route::get('/medicines/categories', [MedicineController::class, 'categories']);
        Route::post('/medicines/{id}/add-stock', [MedicineController::class, 'addStock']);
        Route::post('/medicines/{id}/reduce-stock', [MedicineController::class, 'reduceStock']);
        Route::get('/medicines', [MedicineController::class, 'index']);
        Route::post('/medicines', [MedicineController::class, 'store']);
        Route::get('/medicines/{id}', [MedicineController::class, 'show']);
        Route::put('/medicines/{id}', [MedicineController::class, 'update']);
        Route::delete('/medicines/{id}', [MedicineController::class, 'destroy']);
        
        // Announcements
        Route::get('/announcements', [AnnouncementController::class, 'index']);
        Route::post('/announcements', [AnnouncementController::class, 'store']);
        Route::get('/announcements/{id}', [AnnouncementController::class, 'show']);
        Route::put('/announcements/{id}', [AnnouncementController::class, 'update']);
        Route::delete('/announcements/{id}', [AnnouncementController::class, 'destroy']);
        
        // Reports
        Route::get('/reports/consultations', [NurseDashboardController::class, 'consultationReport']);
        Route::get('/reports/appointments', [NurseDashboardController::class, 'appointmentReport']);
        Route::get('/reports/daily-summary', [NurseDashboardController::class, 'dailySummary']);
    });

});

// ============================================
// FALLBACK ROUTE
// ============================================
Route::fallback(function () {
    return response()->json([
        'success' => false,
        'message' => 'API endpoint not found.'
    ], 404);
});