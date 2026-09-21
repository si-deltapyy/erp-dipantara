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
        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('transaction_id')->constrained('transactions')->onDelete('cascade');
            $table->string('invoice_number');
            $table->date('invoice_date');
            $table->enum('type_invoice', ['invoice_in', 'invoice_outstanding'])->default('invoice_in');
            $table->foreignId('rekening_id')->constrained('rekenings')->onDelete('cascade');
            $table->foreignId('bank_account_number_id')->constrained('bank_account_numbers')->onDelete('cascade')->nullable();
            $table->string('proff_of_payment')->nullable();
            $table->text('note')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('invoices');
    }
};
