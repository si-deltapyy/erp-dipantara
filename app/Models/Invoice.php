<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Invoice extends Model
{
    function Transaction()
    {
        return $this->belongsTo(Transaction::class, 'transaction_id');
    }

    function Rekening()
    {
        return $this->belongsTo(Rekening::class, 'rekening_id');
    }

    function BankAccount()
    {
        return $this->belongsTo(BankAccountNumber::class, 'bank_account_id');
    }
}
