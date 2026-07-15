<?php

namespace App\Exports;

use App\Models\Contract;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;

class FinancialExport implements FromCollection, WithHeadings
{
    protected $filters;

    public function __construct(array $filters)
    {
        $this->filters = $filters;
    }

    public function collection()
    {
        return Contract::with(['member', 'salesAgent', 'payments'])
            ->when($this->filters['from'] ?? null, fn($q) => $q->whereDate('created_at', '>=', $this->filters['from']))
            ->when($this->filters['to'] ?? null, fn($q) => $q->whereDate('created_at', '<=', $this->filters['to']))
            ->when($this->filters['agent_id'] ?? null, fn($q) => $q->where('sales_agent_id', $this->filters['agent_id']))
            ->when($this->filters['payment_method'] ?? null, fn($q) => $q->where('payment_method', $this->filters['payment_method']))
            ->get()
            ->map(function ($contract) {
                return [
                    'Contract ID' => $contract->contract_code,
                    'Member' => $contract->member->full_name,
                    'Sales Agent' => $contract->salesAgent->full_name,
                    'Amount' => number_format($contract->amount) . 'EGP',
                    'Payment Method' => $contract->payment_method,
                    'Status' => $contract->status,
                    'Created At' => $contract->created_at->format('j/n/Y'),
                    'Receipt URL' => optional($contract->payments->first())->receipt_url,
                ];
            });
    }

    public function headings(): array
    {
        return [
            'Contract ID',
            'Member',
            'Sales Agent',
            'Amount',
            'Payment Method',
            'Status',
            'Created At',
            'Receipt URL',
        ];
    }
}
