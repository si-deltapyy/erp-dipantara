<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Grader extends Model
{
    protected $fillable = [
        'user_id',
        'phone_number',
        'grader_group',
    ];

    function orders()
    {
        return $this->hasMany(Order::class, 'grader_id');
    }

    function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    function gradings()
    {
        return $this->hasMany(Grading::class, 'grader_id');
    }

    function mitraGroup()
    {
        return $this->hasMany(Mitra::class, 'grader_group');
    }

}
