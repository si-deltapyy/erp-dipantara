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
            $table->bigInteger('pre_order_id')->unsigned();
            $table->bigInteger('mitra_id')->unsigned();
            $table->bigInteger('grader_id')->unsigned();
            $table->string('SAKR_number_to_buyer')->nullable();
            $table->string('SAKR_number_to_company')->nullable();
            $table->date('delivery_date');
            $table->string('car_plate_number');
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
