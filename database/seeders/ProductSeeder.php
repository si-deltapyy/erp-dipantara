<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Product;

class ProductSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Product::create([
            'name' => 'Product 1',
            'type' => 'Type A',
            'dimension_length' => 10.5,
            'dimension_width' => 5.2,
            'dimension_height' => 2.8,
            'dimension_diameter' => 0.0,
            'volume' => 0.0,
            'grade' => 'A',
            'price' => 1000000,
        ]);
    }
}
