<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Rekening extends Model
{
    protected $fillable = [
        'bank_name',
        'account_number',
        'account_holder_name',
    ];

    function transactions()
    {
        return $this->hasMany(Transaction::class);
    }

    function invoices()
    {
        return $this->hasMany(Invoice::class);
    }
}
