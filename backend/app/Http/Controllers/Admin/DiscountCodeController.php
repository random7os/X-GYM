<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\DiscountCode;
use Illuminate\Http\Request;

class DiscountCodeController extends Controller
{
    public function index()
    {
        $codes = DiscountCode::orderBy('created_at', 'desc')->get();
        return response()->json(['discount_codes' => $codes]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:discount_codes,code',
            'percentage' => 'required|numeric|min:0.01|max:100',
        ]);

        $code = DiscountCode::create([
            'name' => $request->name,
            'code' => strtoupper($request->code),
            'percentage' => $request->percentage,
            'is_active' => true,
        ]);

        return response()->json(['discount_code' => $code, 'message' => 'Discount code created successfully.']);
    }

    public function update(Request $request, DiscountCode $discountCode)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:discount_codes,code,' . $discountCode->id,
            'percentage' => 'required|numeric|min:0.01|max:100',
        ]);

        $discountCode->update([
            'name' => $request->name,
            'code' => strtoupper($request->code),
            'percentage' => $request->percentage,
        ]);

        return response()->json(['discount_code' => $discountCode, 'message' => 'Discount code updated successfully.']);
    }

    public function toggle(DiscountCode $discountCode)
    {
        $discountCode->update(['is_active' => !$discountCode->is_active]);

        return response()->json([
            'discount_code' => $discountCode,
            'message' => $discountCode->is_active ? 'Discount code enabled.' : 'Discount code disabled.',
        ]);
    }

    public function validateCode(Request $request)
    {
        $request->validate(['code' => 'required|string|max:50']);

        $code = DiscountCode::where('code', strtoupper($request->code))
            ->where('is_active', true)
            ->first();

        if (!$code) {
            return response()->json(['message' => 'Invalid or inactive discount code.'], 404);
        }

        return response()->json(['discount_code' => $code]);
    }
}
