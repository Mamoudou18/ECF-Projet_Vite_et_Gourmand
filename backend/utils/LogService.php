<?php

class LogService
{
    public function loginFailed(string $email, string $reason): void
    {
        $this->write('FAILED LOGIN', $email, $reason);
    }

    public function loginSuccess(string $email): void
    {
        $this->write('SUCCESSFUL LOGIN', $email);
    }

    private function write(string $type, string $email, string $reason = ''): void
    {
        error_log(sprintf(
            "[%s] Email: %s | %s IP: %s | Date: %s",
            $type,
            $email,
            $reason ? "Reason: $reason | " : '',
            $_SERVER['REMOTE_ADDR'] ?? 'Unknown',
            date('Y-m-d H:i:s')
        ));
    }

    public function error(string $message): void
    {
        $this->write('LOGIN ERROR', 'N/A', $message);
    }

}
