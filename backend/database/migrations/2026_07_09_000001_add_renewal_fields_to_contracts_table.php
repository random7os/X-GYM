<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::table('contracts', function (Blueprint $table) {
            $table->string('renewal_type')->nullable()->after('amount');
            $table->foreignId('previous_contract_id')->nullable()->constrained('contracts')->after('renewal_type');
        });
    }

    public function down()
    {
        Schema::table('contracts', function (Blueprint $table) {
            $table->dropForeign(['previous_contract_id']);
            $table->dropColumn(['renewal_type', 'previous_contract_id']);
        });
    }
};
