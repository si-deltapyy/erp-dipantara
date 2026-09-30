<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Buyer extends Model
{
    protected $fillable = [
        'company_name',
        'pic_name',
        'phone_number',
        'address',
    ];

    function preOrders()
    {
        return $this->hasMany(PreOrders::class, 'buyer_id');
    }

    function orders()
    {
        return $this->hasMany(Order::class, 'buyer_id');
    }

    function invoices()
    {
        return $this->hasMany(Invoice::class, 'buyer_id');
    }

    function logsPayments()
    {
        return $this->hasMany(LogsPayment::class, 'buyer_id');
    }

    function logsOrders()
    {
        return $this->hasMany(LogsOrder::class, 'buyer_id');
    }
    
}
