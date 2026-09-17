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
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pre_order_id')->constrained('pre_orders')->onDelete('cascade');
            $table->string('order_number');
            $table->date('order_date');
            $table->foreignId('mitra_id')->constrained('mitras')->onDelete('cascade');
            $table->foreignId('grader_id')->constrained('graders')->onDelete('cascade');
            $table->string('grader_buyer_name');
            $table->string('grader_buyer_phone_number');
            $table->string('note')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
