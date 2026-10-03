<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    protected $fillable = [
        'pre_order_id',
        'order_number',
        'order_date',
        'mitra_id',
        'grader_id',
        'grader_buyer_name',
        'grader_buyer_phone_number',
        'note',
    ];

    function buyer()
    {
        return $this->belongsTo(Buyer::class, 'buyer_id');
    }

    function product()
    {
        return $this->belongsTo(Product::class, 'product_id');
    }

    function logsOrders()
    {
        return $this->hasMany(LogsOrder::class, 'order_id');
    }

    function logsPayments()
    {
        return $this->hasMany(LogsPayment::class, 'order_id');
    }

    function preOrder()
    {
        return $this->belongsTo(PreOrders::class, 'pre_order_id');
    }

    function mitra()
    {
        return $this->belongsTo(Mitra::class, 'mitra_id');
    }

    function grader()
    {
        return $this->belongsTo(Grader::class, 'grader_id');
    }

}
