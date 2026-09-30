<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PreOrders extends Model
{
    protected $fillable = [
        "pre_order_number",
        "pre_order_date",
        "pre_order_closing_date",
        "product_id",
        "buyer_id",
        "quantity",
        "total_price",
        "note",
        "pre_order_status",
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
        return $this->hasMany(LogsOrder::class, 'pre_order_id');
    }

    function logsPayments()
    {
        return $this->hasMany(LogsPayment::class, 'pre_order_id');
    }

    function orders()
    {
        return $this->hasMany(Order::class, 'pre_order_id');
    }
}
