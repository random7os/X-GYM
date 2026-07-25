<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Contract extends Model
{
    protected $fillable = [
        'member_id',
        'sales_agent_id',
        'contract_code',
        'start_date',
        'end_date',
        'membership_type',
        'pt_package_id',
        'payment_method',
        'amount',
        'renewal_type',
        'previous_contract_id',
        'status',
        'financial_status',
        'review_message',
        'reviewed_at',
        'qr_code_token',
        'id_verification_path',
        'discount_code_id',
        'discount_name',
    ];

    public function member(): BelongsTo
    {
        return $this->belongsTo(Member::class);
    }

    public function salesAgent(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sales_agent_id');
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function ptSessions(): HasMany
    {
        return $this->hasMany(PtSession::class);
    }

    public function discountCode(): BelongsTo
    {
        return $this->belongsTo(DiscountCode::class);
    }
}
