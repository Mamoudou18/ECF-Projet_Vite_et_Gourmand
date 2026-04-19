<?php

require_once __DIR__ . '/../models/Contact.php';
require_once __DIR__ . '/../mails/ContactMail.php';
require_once __DIR__ . '/../utils/ValidationService.php';
require_once __DIR__ . '/../utils/ResponseService.php';

class ContactController
{
    private Contact $contact;
    private ValidationService $validator;
    private ResponseService $response;

    public function __construct()
    {
        $this->contact      = new Contact();
        $this->validator    = new ValidationService();
        $this->response     = new ResponseService();
    }

    // POST :api/contact/demande-create
    public function creerDemande(): void
    {
        $data = json_decode(file_get_contents('php://input'), true);

        $errors = $this->validator->validateDemandes($data);
        if (!empty($errors)) {
            $this->response->error('Données invalides', 400, $errors);
            return;
        }

        $id = $this->contact->creerDemande([
            'email'       => $data['email'],
            'titre'       => $data['titre'],
            'description' => $data['description']
        ]);

        ContactMail::send($data['email'], $data['titre'], $data['description']);

        $this->response->success(['message' => 'Demande enregistrée', 'id' => $id], 201);
    }
}
