<?php

namespace App\Events;

use App\Models\Contract;
use Illuminate\Queue\SerializesModels;

class ContractSubmitted
{
    use SerializesModels;

    public Contract $contract;

    public function __construct(Contract $contract)
    {
        $this->contract = $contract;
    }
}
