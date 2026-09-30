<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LogsOrder extends Model
{
    public $table = 'logs_orders';

    protected $fillable = [
        'order_id',
        'pre_order_id',
        'log_payment_id',
    ];

    function order()
    {
        return $this->belongsTo(Order::class, 'order_id');
    }

    function preOrder()
    {
        return $this->belongsTo(PreOrders::class, 'pre_order_id');
    }

    function logPayment()
    {
        return $this->belongsTo(LogsPayment::class, 'log_payment_id');
    }
}
