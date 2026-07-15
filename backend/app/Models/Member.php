<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Member extends Model
{
    protected $fillable = [
        'user_id',
        'full_name',
        'email',
        'phone',
        'birth_date',
        'membership_level',
    ];

    public function contracts(): HasMany
    {
        return $this->hasMany(Contract::class);
    }
}
