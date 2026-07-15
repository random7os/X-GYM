<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::create('target_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sales_agent_id')->constrained('users');
            $table->string('target_month');
            $table->decimal('target_amount', 12, 2);
            $table->decimal('achieved_amount', 12, 2)->default(0);
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('target_logs');
    }
};
