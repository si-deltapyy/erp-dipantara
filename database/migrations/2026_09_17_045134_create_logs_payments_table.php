<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('logs_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pre_order_id')->constrained('pre_orders')->onDelete('cascade');
            $table->foreignId('buyer_id')->constrained('buyers')->onDelete('cascade');
            $table->foreignId('mitra_id')->constrained('mitras')->onDelete('cascade');
            $table->enum('buyer_payment_termin', ['termin_1', 'termin_2', 'termin_3'])->default('termin_1');
            $table->enum('mitra_payment_termin', ['termin_1', 'termin_2', 'termin_3'])->default('termin_1');
            $table->enum('payment_status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->integer('payment_amount')->unsigned();  
            $table->string('payment_proof')->nullable();
            $table->date('payment_date');
            $table->date('payment_due_date');
            $table->string('note')->nullable();
            $table->timestamps();

            
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('logs_payments');
    }
};
