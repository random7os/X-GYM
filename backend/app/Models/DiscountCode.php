<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DiscountCode extends Model
{
    protected $fillable = [
        'name',
        'code',
        'percentage',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'percentage' => 'decimal:2',
    ];
}
