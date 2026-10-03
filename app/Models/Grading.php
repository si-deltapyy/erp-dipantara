<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Grading extends Model
{
    protected $fillable = [
        'pre_order_id',
        'mitra_id',
        'grader_id',
        'product_id',
        'grading_date',
        'note',
    ];

    function preOrder()
    {
        return $this->belongsTo(PreOrders::class, 'pre_order_id');
    }

    function grader()
    {
        return $this->belongsTo(Grader::class, 'grader_id');
    }
    function mitra()
    {
        return $this->belongsTo(Mitra::class, 'mitra_id');
    }

    function product()
    {
        return $this->belongsTo(Product::class, 'product_id');
    }
}
