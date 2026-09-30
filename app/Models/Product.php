<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    public $table = 'products';

    protected $fillable = [
        'name',
        'type',
        'dimension_length',
        'dimension_width',
        'dimension_height',
        'dimension_diameter',
        'volume',
        'grade',
        'price',
    ];

    function preOrders()
    {
        return $this->hasMany(PreOrders::class, 'product_id');
    }

    function orders()
    {
        return $this->hasMany(Order::class, 'product_id');
    }

    function grader()
    {
        return $this->belongsTo(Grader::class, 'grade');
    }
}
