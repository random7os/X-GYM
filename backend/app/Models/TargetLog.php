<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TargetLog extends Model
{
    protected $fillable = [
        'sales_agent_id',
        'target_month',
        'target_amount',
        'achieved_amount',
    ];

    public function agent(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sales_agent_id');
    }
}
