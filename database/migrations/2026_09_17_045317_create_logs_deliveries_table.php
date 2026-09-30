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
        Schema::create('logs_deliveries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pre_order_id')->constrained('pre_orders')->onDelete('cascade');
            $table->foreignId('mitra_id')->constrained('mitras')->onDelete('cascade');
            $table->foreignId('grader_id')->constrained('gradings')->onDelete('cascade');
            $table->string('SAKR_number_to_buyer')->nullable();
            $table->string('SAKR_number_to_company')->nullable();
            $table->date('delivery_date');
            $table->string('car_plate_number');
            $table->enum('delivery_status', ['pending', 'delivered', 'cancelled', 'returned', 'in_transit', 'on_the_way'])->default('pending');
            $table->string('note')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('logs_deliveries');
    }
};
