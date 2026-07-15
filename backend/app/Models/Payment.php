<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payment extends Model
{
    protected $fillable = [
        'contract_id',
        'payment_method',
        'amount',
        'transaction_date',
        'receipt_url',
        'verified_by_admin_id',
        'verification_status',
        'verification_notes',
    ];

    public function contract(): BelongsTo
    {
        return $this->belongsTo(Contract::class);
    }
}
