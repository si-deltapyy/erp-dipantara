<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Mitra extends Model
{
    public $table = 'mitras';

    protected $fillable = [
        'name',
        'phone_number',
        'address',
        'grader_group',
    ];

    function grader()
    {
        return $this->belongsTo(Grader::class, 'grader_group');
    }
}
