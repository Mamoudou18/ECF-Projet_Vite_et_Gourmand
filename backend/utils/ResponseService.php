<?php

class ResponseService
{
    public function success(array $data = [], int $code = 200): void
    {
        $this->send(array_merge(['success' => true], $data), $code);
    }

    public function error(string $message, int $statusCode = 400, array $errors = []): void
    {
        http_response_code($statusCode);
        header('Content-Type: application/json');
        
        $response = [
            'success' => false,
            'message' => $message,
        ];

        if (!empty($errors)) {
            $response['errors'] = $errors;
        }

        echo json_encode($response, JSON_UNESCAPED_UNICODE);
        exit;
    }


    public function validationError(array $errors, int $code = 422): void
    {
        $this->send([
            'success' => false,
            'errors'  => $errors
        ], $code);
    }

    private function send(array $data, int $code): void
    {
        http_response_code($code);
        header('Content-Type: application/json');
        echo json_encode($data, JSON_UNESCAPED_UNICODE);
        exit;
    }
}
