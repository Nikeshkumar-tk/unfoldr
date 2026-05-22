export class HttpError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, HttpError.prototype);
  }
}

export class BadRequestError extends HttpError {
  constructor(message: string) {
    super(400, message);
    Object.setPrototypeOf(this, BadRequestError.prototype);
  }
}

export class UnauthorizedError extends HttpError {
  constructor(message = "Unauthorized") {
    super(401, message);
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}

export class ForbiddenError extends HttpError {
  constructor(message = "Forbidden") {
    super(403, message);
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}

export class NotFoundError extends HttpError {
  constructor(message: string) {
    super(404, message);
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

export class ConflictError extends HttpError {
  constructor(message: string) {
    super(409, message);
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}
