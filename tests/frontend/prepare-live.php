<?php

use App\Models\User;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

require __DIR__.'/../../vendor/autoload.php';
$app = require __DIR__.'/../../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();
$database = config('database.connections.sqlite.database');
if (! app()->environment('testing') || config('database.default') !== 'sqlite'
    || ! str_starts_with(basename($database), 'woodflow-e2e-')
    || realpath(dirname($database)) !== realpath(sys_get_temp_dir())
    || ! getenv('E2E_AUTH_PASSWORD')) {
    throw new RuntimeException('An isolated browser test database is required.');
}
Artisan::call('migrate', ['--force' => true]);
$permission = Permission::create(['name' => 'view reports', 'guard_name' => 'web']);
$role = Role::create(['name' => 'future', 'guard_name' => 'web']);
$role->givePermissionTo($permission);
$user = User::factory()->create([
    'name' => 'Browser Test User',
    'email' => 'browser@woodflow.test',
    'password' => Hash::make(getenv('E2E_AUTH_PASSWORD')),
]);
$user->assignRole($role);
