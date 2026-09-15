<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

class RoleAndPermissionSeeder extends Seeder
{
    public function run(): void
    {
        // Reset cache permission
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        // 1. Buat Daftar Permission
        $permissions = [
            'view users',
            'create users',
            'edit users',
            'delete users',
            'manage posts',
        ];

        foreach ($permissions as $permission) {
            Permission::create(['name' => $permission]);
        }

        // 2. Buat Role dan Tempelkan Permission
        $adminRole = Role::create(['name' => 'admin']);
        $adminRole->givePermissionTo(Permission::all());

        $userRole = Role::create(['name' => 'user']);
        $userRole->givePermissionTo(['view users']);
    }
}