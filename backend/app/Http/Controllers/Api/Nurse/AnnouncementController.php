<?php

namespace App\Http\Controllers\Api\Nurse;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AnnouncementController extends Controller
{
    public function index()
    {
        $announcements = Announcement::with('author:id,first_name,last_name')
            ->orderBy('created_at', 'desc')->paginate(20);

        return response()->json(['success' => true, 'data' => $announcements]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'category' => 'nullable|string|max:50',
            'target_audience' => 'nullable|in:all,students,nurses,admins',
        ]);

        $announcement = new Announcement();
        $announcement->title = $request->title;
        $announcement->content = $request->content;
        $announcement->category = $request->category;
        $announcement->target_audience = $request->target_audience ?? 'all';
        $announcement->created_by = Auth::id();
        $announcement->published_at = now();
        $announcement->save();

        return response()->json([
            'success' => true,
            'data' => $announcement->load('author:id,first_name,last_name'),
            'message' => 'Announcement created'
        ], 201);
    }

    public function show($id)
    {
        $announcement = Announcement::with('author:id,first_name,last_name')->findOrFail($id);
        return response()->json(['success' => true, 'data' => $announcement]);
    }

    public function update(Request $request, $id)
    {
        $announcement = Announcement::findOrFail($id);
        $announcement->update($request->only(['title', 'content', 'category', 'target_audience', 'is_published']));
        return response()->json(['success' => true, 'data' => $announcement, 'message' => 'Announcement updated']);
    }

    public function destroy($id)
    {
        Announcement::findOrFail($id)->delete();
        return response()->json(['success' => true, 'message' => 'Announcement deleted']);
    }
}