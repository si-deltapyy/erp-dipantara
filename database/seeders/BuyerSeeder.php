<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class BuyerSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        \App\Models\Buyer::create([
            'company_name' => 'Company 1',
            'pic_name' => 'John Doe',
            'phone_number' => '081234567890',
            'address' => 'Jl. Contoh Alamat No. 1, Kota Contoh, Provinsi Contoh',
        ]);
    }
}
