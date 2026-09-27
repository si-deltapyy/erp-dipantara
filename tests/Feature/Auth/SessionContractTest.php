<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class SessionContractTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_session_is_json_and_not_cacheable(): void
    {
        $this->getJson('/auth/session')->assertOk()->assertExactJson(['user' => null])
            ->assertHeader('Cache-Control', 'no-store, private');
    }

    public function test_session_combines_multiple_roles_and_direct_permissions(): void
    {
        $user = User::factory()->create();
        $read = Permission::create(['name' => 'view reports', 'guard_name' => 'web']);
        $write = Permission::create(['name' => 'make orders', 'guard_name' => 'web']);
        $direct = Permission::create(['name' => 'manage products', 'guard_name' => 'web']);
        $grader = Role::create(['name' => 'grader', 'guard_name' => 'web']);
        $future = Role::create(['name' => 'future', 'guard_name' => 'web']);
        $grader->givePermissionTo($read);
        $future->givePermissionTo([$read, $write]);
        $user->assignRole([$grader, $future]);
        $user->givePermissionTo($direct);

        $this->actingAs($user)->getJson('/auth/session')->assertExactJson([
            'user' => [
                'id' => (string) $user->id,
                'displayName' => $user->name,
                'roles' => ['future', 'grader'],
                'permissions' => ['make orders', 'manage products', 'view reports'],
            ],
        ]);
        $future->revokePermissionTo($write);
        $user->revokePermissionTo($direct);
        $user->unsetRelation('roles')->unsetRelation('permissions');
        $this->getJson('/auth/session')->assertJsonPath('user.permissions', ['view reports']);
    }

    public function test_json_login_and_logout_share_the_web_session(): void
    {
        $user = User::factory()->create();
        $this->postJson('/login', ['email' => $user->email, 'password' => 'password'])
            ->assertOk()->assertJsonPath('user.id', (string) $user->id)
            ->assertJsonPath('user.roles', [])->assertJsonPath('user.permissions', [])
            ->assertJsonMissingPath('user.password')->assertJsonMissingPath('user.remember_token');
        $this->assertAuthenticatedAs($user);
        $this->getJson('/auth/session')->assertJsonPath('user.id', (string) $user->id);
        $this->postJson('/logout')->assertNoContent();
        $this->assertGuest();
        $this->getJson('/auth/session')->assertExactJson(['user' => null]);
    }

    public function test_invalid_login_and_lockout_remain_validation_responses(): void
    {
        $user = User::factory()->create();
        for ($attempt = 0; $attempt < 5; $attempt++) {
            $this->postJson('/login', ['email' => $user->email, 'password' => 'invalid'])
                ->assertUnprocessable()->assertJsonValidationErrors('email');
        }
        $this->postJson('/login', ['email' => $user->email, 'password' => 'password'])
            ->assertUnprocessable()->assertJsonValidationErrors('email');
        $this->assertGuest();
    }

    public function test_missing_login_fields_are_reported_and_guest_logout_is_unauthorized(): void
    {
        $this->postJson('/login', [])->assertUnprocessable()
            ->assertJsonValidationErrors(['email', 'password']);
        $this->postJson('/logout')->assertUnauthorized();
    }
}
