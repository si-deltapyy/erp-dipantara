<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    protected $fillable = [
        'order_number',
        'buyer_id',
        'product_id',
        'quantity',
        'total_price',
        'status',
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
}
