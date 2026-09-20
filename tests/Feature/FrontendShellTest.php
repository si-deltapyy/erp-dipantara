<?php

namespace Tests\Feature;

use Tests\TestCase;

class FrontendShellTest extends TestCase
{
    public function test_shell_supports_direct_and_nested_navigation(): void
    {
        foreach (['/app', '/app/development/mock', '/app/missing/nested'] as $path) {
            $this->get($path)->assertOk()->assertViewIs('app');
        }
    }

    public function test_shell_does_not_capture_other_routes(): void
    {
        $this->get('/')->assertOk()->assertViewIs('welcome');
        $this->get('/login')->assertOk();
        $this->get('/profile')->assertRedirect('/login');
        $this->get('/dashboard')->assertRedirect('/login');
        $this->get('/app-other')->assertNotFound();
        $this->post('/app')->assertStatus(405);
    }
}
