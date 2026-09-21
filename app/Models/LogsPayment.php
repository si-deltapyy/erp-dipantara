<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LogsPayment extends Model
{
    public $table = 'logs_payments';

    function preOrder()
    {
        return $this->belongsTo(PreOrders::class, 'pre_order_id');
    }
}
