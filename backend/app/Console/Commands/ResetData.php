<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class ResetData extends Command
{
    protected $signature = 'db:reset-data';
    protected $description = 'Truncate all data tables to start fresh';

    public function handle()
    {
        DB::statement('PRAGMA foreign_keys = OFF');

        DB::table('pt_sessions')->truncate();
        DB::table('payments')->truncate();
        DB::table('contracts')->truncate();
        DB::table('members')->truncate();
        DB::table('target_logs')->truncate();
        DB::table('admin_notifications')->truncate();

        DB::statement('PRAGMA foreign_keys = ON');

        $this->info('All data tables have been reset to zero.');
        return Command::SUCCESS;
    }
}
