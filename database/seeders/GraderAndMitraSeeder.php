<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Grader;
use App\Models\Mitra;

class GraderAndMitraSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Grader::create([
            'user_id' => 3,
            'phone_number' => '081234567890',
            'grader_group' => '33001',
        ]);

        Mitra::create([
            'name' => 'Mitra 1',
            'phone_number' => '081234567891',
            'address' => 'Jl. Contoh Alamat No. 2, Kota Contoh, Provinsi Contoh',
            'grader_group' => '33001',
        ]);
    }
}
