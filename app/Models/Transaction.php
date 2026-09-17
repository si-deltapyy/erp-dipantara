<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Transaction extends Model
{
    protected $fillable = [
        'buyer_id',
        'invoice_id',
        'rekening_id',
        'bank_account_number_id',
        'amount',
        'status',
    ];

    function buyer()
    {
        return $this->belongsTo(Buyer::class);
    }

    function invoice()
    {
        return $this->belongsTo(Invoice::class);
    }

    function rekening()
    {
        return $this->belongsTo(Rekening::class);
    }

    function bankAccountNumber()
    {
        return $this->belongsTo(BankAccountNumber::class);
    }
}
