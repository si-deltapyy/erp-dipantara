<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class BankAccountSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        \App\Models\BankAccountNumber::create([
            'bank_name' => 'Bank BCA',
            'account_number' => '1234567890',
            'account_holder_name' => 'John Doe',
        ]);

        \App\Models\BankAccountNumber::create([
            'bank_name' => 'Bank BNI',
            'account_number' => '0987654321',
            'account_holder_name' => 'Jane Smith',
        ]);
    }
}
