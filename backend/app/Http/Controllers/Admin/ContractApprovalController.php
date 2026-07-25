<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Contract;
use App\Models\Payment;
use App\Models\Role;
use App\Models\TargetLog;
use App\Models\User;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\FinancialExport;

class ContractApprovalController extends Controller
{
    public function pending()
    {
        $contracts = Contract::with(['member', 'salesAgent', 'payments', 'discountCode'])
            ->where('status', 'pending')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json(['pending' => $contracts]);
    }

    public function show(Contract $contract)
    {
        return response()->json($contract->load(['member', 'salesAgent', 'payments', 'ptSessions', 'discountCode']));
    }

    public function approve(Contract $contract)
    {
        if ($contract->status === 'approved') {
            return response()->json(['message' => 'Contract already approved'], 200);
        }

        $contract->update([
            'status' => 'approved',
            'financial_status' => 'verified',
            'review_message' => 'Your contract was approved and is now contributing to your monthly target.',
            'reviewed_at' => now(),
        ]);
        $contract->payments()->update(['verification_status' => 'approved']);

        $month = $contract->created_at->format('Y-m');
        $targetLog = TargetLog::firstOrCreate([
            'sales_agent_id' => $contract->sales_agent_id,
            'target_month' => $month,
        ], [
            'target_amount' => 0,
            'achieved_amount' => 0,
        ]);

        $targetLog->increment('achieved_amount', $contract->amount);

        return response()->json(['message' => 'Contract approved successfully']);
    }

    public function reject(Request $request, Contract $contract)
    {
        $contract->update([
            'status' => 'rejected',
            'financial_status' => 'failed',
            'review_message' => $request->input('notes') ?: 'Your contract was rejected. Please review the details and resubmit.',
            'reviewed_at' => now(),
        ]);
        $contract->payments()->update(['verification_status' => 'rejected', 'verification_notes' => $request->input('notes')]);

        return response()->json(['message' => 'Contract rejected']);
    }

    public function filterPayments(Request $request)
    {
        $query = Contract::with(['member', 'salesAgent', 'payments', 'discountCode'])
            ->when($request->from, fn ($q) => $q->whereDate('created_at', '>=', $request->from))
            ->when($request->to, fn ($q) => $q->whereDate('created_at', '<=', $request->to))
            ->when($request->agent_id, fn ($q) => $q->where('sales_agent_id', $request->agent_id))
            ->when($request->payment_method, fn ($q) => $q->where('payment_method', $request->payment_method));

        return response()->json(['results' => $query->orderBy('created_at', 'desc')->get()]);
    }

    public function agents(Request $request)
    {
        $month = now()->format('Y-m');

        $agents = User::with('role')
            ->whereHas('role', fn ($query) => $query->where('name', 'sales_agent'))
            ->get()
            ->map(function ($agent) use ($month) {
                $target = TargetLog::where('sales_agent_id', $agent->id)
                    ->where('target_month', $month)
                    ->first();

                $pendingCount = Contract::where('sales_agent_id', $agent->id)
                    ->where('status', 'pending')
                    ->count();

                return [
                    'id' => $agent->id,
                    'full_name' => $agent->full_name,
                    'email' => $agent->email,
                    'target' => $target,
                    'approved_amount' => $target ? $target->achieved_amount : 0,
                    'pending_count' => $pendingCount,
                ];
            });

        return response()->json(['agents' => $agents]);
    }

    public function storeAgent(Request $request)
    {
        $request->validate([
            'full_name' => 'required|string|max:255',
            'username' => 'required|string|max:255|unique:users,username',
            'password' => 'required|string|min:6|max:255',
            'email' => 'nullable|email|max:255',
            'target_amount' => 'nullable|numeric|min:0',
        ]);

        $role = Role::where('name', 'sales_agent')->first();
        if (! $role) {
            return response()->json(['message' => 'Sales agent role is not configured.'], 422);
        }

        $user = User::create([
            'full_name' => $request->input('full_name'),
            'username' => $request->input('username'),
            'email' => $request->input('email') ?: $request->input('username').'@x.local',
            'password' => bcrypt($request->input('password')),
            'role_id' => $role->id,
            'is_active' => true,
        ]);

        if ($request->filled('target_amount')) {
            TargetLog::updateOrCreate([
                'sales_agent_id' => $user->id,
                'target_month' => now()->format('Y-m'),
            ], [
                'target_amount' => $request->input('target_amount'),
                'achieved_amount' => 0,
            ]);
        }

        return response()->json(['agent' => $user, 'message' => 'Sales agent created successfully.']);
    }

    public function updateTarget(Request $request, User $agent)
    {
        $request->validate([
            'target_amount' => 'required|numeric|min:0',
        ]);

        $month = now()->format('Y-m');

        $target = TargetLog::firstOrNew([
            'sales_agent_id' => $agent->id,
            'target_month' => $month,
        ]);

        $target->target_amount = $request->input('target_amount');
        $target->achieved_amount = $target->achieved_amount ?? 0;
        $target->save();

        return response()->json(['target' => $target, 'message' => 'Agent target updated successfully']);
    }

    public function agentSummary(User $agent, Request $request)
    {
        $contracts = Contract::where('sales_agent_id', $agent->id)
            ->when($request->from, fn ($q) => $q->whereDate('created_at', '>=', $request->from))
            ->when($request->to, fn ($q) => $q->whereDate('created_at', '<=', $request->to))
            ->get();

        return response()->json([
            'agent' => $agent,
            'total_sales' => $contracts->sum('amount'),
            'contract_count' => $contracts->count(),
            'approved_revenue' => $contracts->where('status', 'approved')->sum('amount'),
        ]);
    }

    public function deleteAgent(User $agent)
    {
        if ($agent->role->name !== 'sales_agent') {
            return response()->json(['message' => 'Only sales agents can be deleted'], 422);
        }

        $agent->contracts()->delete();
        $agent->targetLogs()->delete();
        $agent->delete();

        return response()->json(['message' => 'Agent deleted successfully']);
    }
}
