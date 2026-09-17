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
        Schema::create('pre_orders', function (Blueprint $table) {
            $table->id();
            $table->string('pre_order_number');
            $table->date('pre_order_date');
            $table->date('pre_order_closing_date');
            $table->bigInteger('product_id')->unsigned();
            $table->bigInteger('buyer_id')->unsigned();
            $table->integer('quantity');
            $table->integer('total_price')->nullable();
            $table->string('note')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pre_orders');
    }
};
