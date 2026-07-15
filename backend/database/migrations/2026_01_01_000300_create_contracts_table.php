<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::create('contracts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('member_id')->constrained('members');
            $table->foreignId('sales_agent_id')->constrained('users');
            $table->string('contract_code')->unique();
            $table->date('start_date');
            $table->date('end_date');
            $table->string('membership_type');
            $table->unsignedBigInteger('pt_package_id')->nullable();
            $table->string('payment_method');
            $table->decimal('amount', 12, 2);
            $table->enum('status', ['pending', 'approved', 'rejected', 'processed'])->default('pending');
            $table->enum('financial_status', ['awaiting_verification', 'verified', 'failed'])->default('awaiting_verification');
            $table->uuid('qr_code_token')->nullable()->unique();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('contracts');
    }
};
