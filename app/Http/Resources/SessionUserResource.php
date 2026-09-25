<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SessionUserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->getKey(),
            'displayName' => $this->name,
            'roles' => $this->getRoleNames()->sort()->values()->all(),
            'permissions' => $this->getAllPermissions()->pluck('name')->unique()->sort()->values()->all(),
        ];
    }
}
