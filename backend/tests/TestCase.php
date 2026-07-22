<?php

namespace Tests;

use Illuminate\Foundation\Testing\DatabaseMigrations;
use Illuminate\Foundation\Testing\DatabaseTruncation;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use RuntimeException;

abstract class TestCase extends BaseTestCase
{
    protected function setUpTraits()
    {
        $uses = array_flip(class_uses_recursive(static::class));

        if (
            isset($uses[RefreshDatabase::class])
            || isset($uses[DatabaseMigrations::class])
            || isset($uses[DatabaseTruncation::class])
        ) {
            $this->guardTestingDatabase();
        }

        return parent::setUpTraits();
    }

    private function guardTestingDatabase(): void
    {
        if (!$this->app->environment('testing')) {
            throw new RuntimeException('Refusing to refresh a database outside APP_ENV=testing.');
        }

        $connection = config('database.default');
        $database = config("database.connections.{$connection}.database");

        if (!is_string($database) || !str_ends_with($database, '_testing')) {
            throw new RuntimeException("Refusing to refresh non-test database [{$database}]. Test database names must end with _testing.");
        }
    }
}
