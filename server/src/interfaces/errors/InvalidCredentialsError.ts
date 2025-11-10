// errore 401 per credenziali non valide

export class InvalidCredentialsError extends Error {
    constructor(message: string = "Invalid username or password") {
        super(message);
    }
}

export default InvalidCredentialsError;