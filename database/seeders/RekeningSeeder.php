<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Rekening;

class RekeningSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Rekening::create([
            'bank_name' => 'Bank BCA',
            'account_number' => '1234567890',
            'account_holder_name' => 'John Doe',
            'mitra_id' => 1,
        ]);
    }
}
