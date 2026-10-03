<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Rekening extends Model
{
    public $table = 'rekenings';

    protected $fillable = [
        'bank_name',
        'account_number',
        'account_holder_name',
        'mitra_id',
    ];

    function transactions()
    {
        return $this->hasMany(Transaction::class);
    }

    function invoices()
    {
        return $this->hasMany(Invoice::class);
    }

    function mitra()
    {
        return $this->belongsTo(Mitra::class, 'mitra_id');
    }
}
