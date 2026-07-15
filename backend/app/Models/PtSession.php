<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PtSession extends Model
{
    protected $fillable = [
        'contract_id',
        'trainer_name',
        'package_name',
        'session_count',
        'start_date',
        'end_date',
        'status',
    ];

    public function contract(): BelongsTo
    {
        return $this->belongsTo(Contract::class);
    }
}
