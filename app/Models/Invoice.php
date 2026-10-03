<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Invoice extends Model
{
    protected $fillable = [
        'transaction_id',
        'invoice_number',
        'invoice_date',
        'type_invoice',
        'rekening_id',
        'bank_account_number_id',
        'proff_of_payment',
        'note',
    ];

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
        return $this->belongsTo(BankAccountNumber::class, 'bank_account_number_id');
    }
    
}
