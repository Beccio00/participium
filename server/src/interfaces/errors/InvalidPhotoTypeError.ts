export class InvalidPhotoTypeError extends Error {
  constructor(message = "Invalid photo type") {
    super(message);
    this.name = "InvalidPhotoTypeError";
  }
}