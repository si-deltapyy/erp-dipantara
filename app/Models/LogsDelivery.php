<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LogsDelivery extends Model
{
    public $table = 'logs_deliveries';

    protected $fillable = [
        'pre_order_id',
        'mitra_id',
        'grader_id',
        'SAKR_number_to_buyer',
        'SAKR_number_to_company',
        'delivery_date',
        'car_plate_number',
        'delivery_status',
        'note',
    ];

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
