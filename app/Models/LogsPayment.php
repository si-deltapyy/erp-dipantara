<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LogsPayment extends Model
{
    public $table = 'logs_payments';

    protected $fillable = [
        'pre_order_id',
        'order_id',
        'mitra_id',
        'buyer_payment_termin',
        'mitra_payment_termin',
        'payment_status',
        'payment_amount',
        'payment_proff',
        'payment_date',
        'payment_due_date',
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

    function logOrder()
    {
        return $this->belongsTo(LogsOrder::class, 'log_order_id');
    }
    
}
