<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AppointmentSlot extends Model
{
    use HasFactory;

    protected $fillable = [
        'date', 'time_slot', 'max_slots', 'booked_count'
    ];

    protected $casts = [
        'date' => 'date',
    ];

    /**
     * Get available slots for a specific date
     */
    public static function getAvailableSlots($date)
    {
        $timeSlots = [
            '8:00 AM', '8:30 AM', '9:00 AM', '9:30 AM', 
            '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
            '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM', 
            '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM',
        ];

        $slots = [];
        
        foreach ($timeSlots as $time) {
            // Count approved + pending appointments for this slot
            $bookedCount = Appointment::whereDate('appointment_date', $date)
                ->where('time_slot', $time)
                ->whereIn('status', ['approved', 'pending'])
                ->count();

            $slots[] = [
                'time' => $time,
                'max' => 10,
                'booked' => $bookedCount,
                'available' => max(0, 10 - $bookedCount),
                'is_full' => $bookedCount >= 10,
            ];
        }

        return $slots;
    }

    /**
     * Check if a specific slot is available
     */
    public static function isSlotAvailable($date, $timeSlot)
    {
        $bookedCount = Appointment::whereDate('appointment_date', $date)
            ->where('time_slot', $timeSlot)
            ->whereIn('status', ['approved', 'pending'])
            ->count();

        return $bookedCount < 10;
    }

    /**
     * Get remaining slots count
     */
    public static function remainingSlots($date, $timeSlot)
    {
        $bookedCount = Appointment::whereDate('appointment_date', $date)
            ->where('time_slot', $timeSlot)
            ->whereIn('status', ['approved', 'pending'])
            ->count();

        return max(0, 10 - $bookedCount);
    }
}