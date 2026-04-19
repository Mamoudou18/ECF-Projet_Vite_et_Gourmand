<?php

class RateLimitService
{
    private const MAX_ATTEMPTS   = 5;
    private const WINDOW_SECONDS = 900; // 15 minutes

    public function check(string $key): bool
    {
        $file     = $this->getCacheFile($key);
        $attempts = $this->getAttempts($file);

        if ($attempts === null) {
            return true;
        }

        $elapsed = time() - $attempts['first_attempt'];

        if ($elapsed > self::WINDOW_SECONDS) {
            unlink($file);
            return true;
        }

        return $attempts['count'] < self::MAX_ATTEMPTS;
    }

    public function increment(string $key): void
    {
        $file     = $this->getCacheFile($key);
        $attempts = $this->getAttempts($file);

        if ($attempts === null) {
            $this->writeAttempt($file, 1);
            return;
        }

        $elapsed = time() - $attempts['first_attempt'];

        if ($elapsed > self::WINDOW_SECONDS) {
            unlink($file);
            $this->writeAttempt($file, 1);
            return;
        }

        $attempts['count']++;
        $attempts['last_attempt'] = time();
        file_put_contents($file, json_encode($attempts));
    }

    public function reset(string $key): void
    {
        $file = $this->getCacheFile($key);
        if (file_exists($file)) {
            unlink($file);
        }
    }

    private function getAttempts(string $file): ?array
    {
        if (!file_exists($file)) {
            return null;
        }

        return json_decode(file_get_contents($file), true);
    }

    private function getCacheFile(string $key): string
    {
        return sys_get_temp_dir() . '/login_attempts_' . md5($key);
    }

    private function writeAttempt(string $file, int $count): void
    {
        file_put_contents($file, json_encode([
            'count'         => $count,
            'first_attempt' => time(),
            'last_attempt'  => time()
        ]));
    }
}
