<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Transaction extends Model
{
    protected $fillable = [
        'pre_order_id',
        'order_id',
        'log_payment_id',
        'status_payment',
        'note',
    ];

    function preOrder()
    {
        return $this->belongsTo(PreOrders::class, 'pre_order_id');
    }

    function order()
    {
        return $this->belongsTo(Order::class, 'order_id');
    }

    function logPayments()
    {
        return $this->belongsTo(LogsPayment::class, 'log_payment_id');
    }
}
