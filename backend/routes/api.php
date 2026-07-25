<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\Sales\ContractController;
use App\Http\Controllers\Admin\ContractApprovalController;
use App\Http\Controllers\Admin\ExportController;
use App\Http\Controllers\Admin\DiscountCodeController;
use App\Http\Controllers\NotificationController;

Route::post('auth/login', [AuthController::class, 'login']);
Route::post('auth/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');
Route::get('auth/user', [AuthController::class, 'user'])->middleware('auth:sanctum');
Route::put('auth/password', [AuthController::class, 'updatePassword'])->middleware('auth:sanctum');

Route::prefix('sales')->middleware(['auth:sanctum', 'role:sales_agent'])->group(function () {
    Route::get('dashboard', [ContractController::class, 'dashboard']);
    Route::get('contracts', [ContractController::class, 'index']);
    Route::get('notifications', [ContractController::class, 'notifications']);
    Route::get('contracts/{contract}', [ContractController::class, 'show']);
    Route::post('contracts', [ContractController::class, 'store']);
    Route::get('contracts/{contract}/qr', [ContractController::class, 'qrCode']);
    Route::post('contracts/{contract}/payment', [ContractController::class, 'uploadPayment']);
    Route::get('members/search', [ContractController::class, 'searchMembers']);
    Route::get('discount-codes/validate', [DiscountCodeController::class, 'validateCode']);
});

Route::prefix('admin')->middleware(['auth:sanctum', 'role:admin'])->group(function () {
    Route::get('contracts/pending', [ContractApprovalController::class, 'pending']);
    Route::get('contracts/{contract}', [ContractApprovalController::class, 'show']);
    Route::post('contracts/{contract}/approve', [ContractApprovalController::class, 'approve']);
    Route::post('contracts/{contract}/reject', [ContractApprovalController::class, 'reject']);
    Route::get('payments/filter', [ContractApprovalController::class, 'filterPayments']);
    Route::get('agents', [ContractApprovalController::class, 'agents']);
    Route::post('agents', [ContractApprovalController::class, 'storeAgent']);
    Route::post('agents/{agent}/target', [ContractApprovalController::class, 'updateTarget']);
    Route::get('agents/{agent}/sales-summary', [ContractApprovalController::class, 'agentSummary']);
    Route::delete('agents/{agent}', [ContractApprovalController::class, 'deleteAgent']);
    Route::get('exports/financial', [ExportController::class, 'financialExport']);
    Route::get('discount-codes', [DiscountCodeController::class, 'index']);
    Route::post('discount-codes', [DiscountCodeController::class, 'store']);
    Route::put('discount-codes/{discountCode}', [DiscountCodeController::class, 'update']);
    Route::post('discount-codes/{discountCode}/toggle', [DiscountCodeController::class, 'toggle']);
});

Route::post('notifications/contract-submitted', [NotificationController::class, 'contractSubmitted']);
Route::get('notifications/admin', [NotificationController::class, 'adminNotifications'])->middleware(['auth:sanctum', 'role:admin']);
Route::get('qr/verify/{token}', [ContractController::class, 'verifyQr']);
