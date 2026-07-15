<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Exports\FinancialExport;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;

class ExportController extends Controller
{
    public function financialExport(Request $request)
    {
        $params = $request->only(['from', 'to', 'agent_id', 'payment_method']);
        $filename = 'x-financial-export-' . now()->format('YmdHis') . '.xlsx';

        return Excel::download(new FinancialExport($params), $filename);
    }
}
