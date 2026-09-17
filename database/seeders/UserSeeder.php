<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        \App\Models\User::create([
            'name' => 'Admin',
            'email' => 'admin@mail.com',
            'password' => bcrypt('password'),
        ])->assignRole('admin');

        \App\Models\User::create([
            'name' => 'User',
            'email' => 'user@mail.com',
            'password' => bcrypt('password'),
        ])->assignRole('user');

        \App\Models\User::create([
            'name' => 'Grader',
            'email' => 'grader@mail.com',
            'password' => bcrypt('password'),
        ])->assignRole('grader');

        \App\Models\User::create([
            'name' => 'Maker',
            'email' => 'maker@mail.com',
            'password' => bcrypt('password'),
        ])->assignRole('maker');

        \App\Models\User::create([
            'name' => 'Supervisor',
            'email' => 'spv@mail.com',
            'password' => bcrypt('password'),
        ])->assignRole('supervisor');
    }
}
