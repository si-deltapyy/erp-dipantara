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
            'approve orders',
            'reject orders',
            'view users',
            'manage products',
            'manage mitras',
            'manage graders',
            'manage rekenings',
            'manage pre-orders',
            'manage orders',
            'manage gradings',
            'manage logs payments',
            'manage logs orders',
            'approve payments',
            'reject payments',
            'approve gradings',
            'reject gradings',
            'make payments',
            'view reports',
            'make invoices',
            'make transactions',
            'make grading reports',
            'make orders',
            'make gradings',
        ];

        foreach ($permissions as $permission) {
            Permission::create(['name' => $permission]);
        }

        // 2. Buat Role dan Tempelkan Permission
        $adminRole = Role::create(['name' => 'admin']);
        $adminRole->givePermissionTo(Permission::all());

        $userRole = Role::create(['name' => 'user']);
        $userRole->givePermissionTo([
            'make payments',
            'make orders',
        ]);

        $graderRole = Role::create(['name' => 'grader']);
        $graderRole->givePermissionTo([
            'make gradings',
            'view reports',
            'make grading reports',
        ]);

        $makerRole = Role::create(['name' => 'maker']);
        $makerRole->givePermissionTo([
            'make orders',
            'make invoices',
            'make transactions',
        ]);

        $supervisorRole = Role::create(['name' => 'supervisor']);
        $supervisorRole->givePermissionTo([
            'approve orders',
            'reject orders',
            'approve payments',
            'reject payments',
            'approve gradings',
            'reject gradings',
        ]);
    }
}