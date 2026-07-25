<?php

namespace App\Http\Controllers\Sales;

use App\Http\Controllers\Controller;
use App\Http\Requests\SalesContractRequest;
use App\Models\AdminNotification;
use App\Models\Contract;
use App\Models\Member;
use App\Models\Payment;
use App\Models\PtSession;
use App\Models\TargetLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ContractController extends Controller
{
    public function dashboard(Request $request)
    {
        $agent = $request->user();
        $month = now()->format('Y-m');

        $target = TargetLog::firstOrNew([
            'sales_agent_id' => $agent->id,
            'target_month' => $month,
        ]);

        return response()->json([
            'target' => $target->target_amount > 0 ? $target : null,
            'achieved' => $target->achieved_amount,
            'remaining' => max(0, $target->target_amount - $target->achieved_amount),
            'percent_achieved' => $target->target_amount > 0
                ? round(($target->achieved_amount / $target->target_amount) * 100)
                : 0,
        ]);
    }

    public function index(Request $request)
    {
        $contracts = Contract::with('member')
            ->where('sales_agent_id', $request->user()->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json(['contracts' => $contracts]);
    }

    public function show(Contract $contract)
    {
        return response()->json($contract->load(['member', 'payments', 'ptSessions', 'discountCode']));
    }

    public function store(SalesContractRequest $request)
    {
        if ($request->member_id) {
            $member = Member::findOrFail($request->member_id);
        } else {
            $member = Member::firstOrCreate([
                'email' => $request->member_email,
            ], [
                'user_id' => $request->user()->id,
                'full_name' => $request->member_name,
                'phone' => $request->member_phone,
                'birth_date' => $request->member_birthdate,
                'membership_level' => $request->membership_type,
            ]);
        }

        if ($request->contract_code) {
            $contractCode = $request->contract_code;
        } else {
            $prefix = match ($request->contract_type) {
                'referral' => 'RM',
                'family' => 'FM',
                default => 'XM',
            };
            $lastCode = Contract::where('contract_code', 'like', $prefix . '-%')
                ->orderByRaw('CAST(SUBSTR(contract_code, 4) AS INTEGER) DESC')
                ->value('contract_code');
            $nextNumber = $lastCode ? (int) substr($lastCode, 3) + 1 : ($prefix === 'XM' ? 3020 : 1000);
            $contractCode = $prefix . '-' . $nextNumber;
        }

        $contract = Contract::create([
            'member_id' => $member->id,
            'sales_agent_id' => $request->user()->id,
            'contract_code' => $contractCode,
            'start_date' => $request->start_date,
            'end_date' => $request->end_date,
            'membership_type' => $request->membership_type,
            'pt_package_id' => $request->pt_package_id,
            'payment_method' => $request->payment_method,
            'amount' => $request->amount,
            'renewal_type' => $request->renewal_type,
            'previous_contract_id' => $request->previous_contract_id,
            'status' => 'pending',
            'financial_status' => 'awaiting_verification',
            'review_message' => $request->renewal_type === 'renewal'
                ? 'Membership renewal pending admin review.'
                : 'Your contract is pending review by the admin team.',
            'reviewed_at' => null,
            'discount_code_id' => $request->discount_code_id
                ? \App\Models\DiscountCode::where('id', $request->discount_code_id)->where('is_active', true)->value('id')
                : null,
            'discount_name' => $request->discount_code_id
                ? \App\Models\DiscountCode::where('id', $request->discount_code_id)->where('is_active', true)->value('name')
                : null,
        ]);

        if ($request->hasFile('receipt')) {
            $path = $request->file('receipt')->store('receipts', 'public');
            Payment::create([
                'contract_id' => $contract->id,
                'payment_method' => $request->payment_method,
                'amount' => $request->amount,
                'transaction_date' => now(),
                'receipt_url' => url('storage/' . $path),
                'verification_status' => 'pending',
            ]);
        }

        if ($request->hasFile('id_verification')) {
            $idPath = $request->file('id_verification')->store('id_verifications', 'public');
            $contract->update(['id_verification_path' => url('storage/' . $idPath)]);
        }

        AdminNotification::create([
            'type' => 'contract_submitted',
            'title' => "Contract #{$contract->id} is Pending Approval",
            'message' => 'Awaiting Financial Verification',
            'data' => json_encode([
                'contract_id' => $contract->id,
                'contract_code' => $contract->contract_code,
            ]),
            'is_read' => false,
        ]);

        return response()->json(['contract' => $contract]);
    }

    public function notifications(Request $request)
    {
        $notifications = Contract::query()
            ->where('sales_agent_id', $request->user()->id)
            ->whereNotNull('reviewed_at')
            ->orderByDesc('reviewed_at')
            ->get()
            ->map(function (Contract $contract) {
                return [
                    'id' => $contract->id,
                    'contract_code' => $contract->contract_code,
                    'status' => $contract->status,
                    'message' => $contract->review_message,
                    'reviewed_at' => $contract->reviewed_at,
                ];
            });

        return response()->json(['notifications' => $notifications]);
    }

    public function searchMembers(Request $request)
    {
        $request->validate(['phone' => 'required|string|max:50']);

        $members = Member::where('phone', 'LIKE', '%' . $request->phone . '%')
            ->with(['contracts' => function ($q) {
                $q->orderBy('created_at', 'desc')->limit(1);
            }])
            ->get();

        return response()->json(['members' => $members]);
    }

    public function uploadPayment(Request $request, Contract $contract)
    {
        $request->validate([
            'receipt' => 'required|image|mimes:jpg,png,jpeg|max:5120',
        ]);

        $path = $request->file('receipt')->store('receipts', 'public');

        $payment = Payment::create([
            'contract_id' => $contract->id,
            'payment_method' => $request->payment_method,
            'amount' => $contract->amount,
            'transaction_date' => now(),
            'receipt_url' => url('storage/' . $path),
            'verification_status' => 'pending',
        ]);

        return response()->json(['payment' => $payment]);
    }

    public function qrCode(Contract $contract)
    {
        if (! $contract->qr_code_token) {
            $contract->qr_code_token = Str::uuid();
            $contract->save();
        }

        return response()->json([
            'qr_code_token' => $contract->qr_code_token,
            'contract' => $contract->load(['member', 'salesAgent', 'payments']),
        ]);
    }

    public function verifyQr($token)
    {
        $contract = Contract::where('qr_code_token', $token)
            ->where('status', 'approved')
            ->with(['member', 'salesAgent'])
            ->firstOrFail();

        return response()->json([
            'contract_id' => $contract->id,
            'contract_code' => $contract->contract_code,
            'member_name' => $contract->member->full_name,
            'sales_agent' => $contract->salesAgent->full_name,
            'amount' => $contract->amount,
            'status' => $contract->status,
            'payment_method' => $contract->payment_method,
        ]);
    }
}
