<?php

namespace App\Http\Controllers;

use App\Models\AdminNotification;
use App\Models\Contract;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function contractSubmitted(Request $request)
    {
        $request->validate(['contract_id' => 'required|integer|exists:contracts,id']);
        $contract = Contract::findOrFail($request->contract_id);

        $notification = AdminNotification::create([
            'type' => 'contract_submitted',
            'title' => "Contract #{$contract->id} is Pending Approval",
            'message' => 'Awaiting Financial Verification',
            'data' => [
                'contract_id' => $contract->id,
                'contract_code' => $contract->contract_code,
            ],
            'is_read' => false,
        ]);

        return response()->json(['message' => 'Notification dispatched', 'notification' => $notification]);
    }

    public function adminNotifications(Request $request)
    {
        $notifications = AdminNotification::orderBy('created_at', 'desc')->limit(20)->get();

        return response()->json(['notifications' => $notifications]);
    }
}
