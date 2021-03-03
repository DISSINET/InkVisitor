class BadCredentialsError extends Error {
  public static code = "bad credentials";

  constructor(m: string) {
    super(m);

    // Set the prototype explicitly.
    Object.setPrototypeOf(this, BadCredentialsError.prototype);
  }

  statusCode(): number {
    return 401;
  }

  toString(): string {
    return BadCredentialsError.code;
  }
}

class NotFound extends Error {
  public static code = "resource not found";

  constructor(m: string) {
    super(m);

    // Set the prototype explicitly.
    Object.setPrototypeOf(this, NotFound.prototype);
  }

  statusCode(): number {
    return 404;
  }

  toString(): string {
    return NotFound.code;
  }
}

class BadParams extends Error {
  public static code = "bad parameters";

  constructor(m: string) {
    super(m);

    // Set the prototype explicitly.
    Object.setPrototypeOf(this, BadParams.prototype);
  }

  statusCode(): number {
    return 400;
  }

  toString(): string {
    return BadParams.code;
  }
}

class UserDoesNotExits extends Error {
  public static code = "user does not exist";

  constructor(m: string) {
    super(m);

    // Set the prototype explicitly.
    Object.setPrototypeOf(this, UserDoesNotExits.prototype);
  }

  statusCode(): number {
    return 400;
  }

  toString(): string {
    return UserDoesNotExits.code;
  }
}

class ActantDoesNotExits extends Error {
  public static code = "actant does not exist";

  constructor(m: string) {
    super(m);

    // Set the prototype explicitly.
    Object.setPrototypeOf(this, ActantDoesNotExits.prototype);
  }

  statusCode(): number {
    return 400;
  }

  toString(): string {
    return ActantDoesNotExits.code;
  }
}

class ActionDoesNotExits extends Error {
  public static code = "action does not exist";

  constructor(m: string) {
    super(m);

    // Set the prototype explicitly.
    Object.setPrototypeOf(this, ActionDoesNotExits.prototype);
  }

  statusCode(): number {
    return 400;
  }

  toString(): string {
    return ActionDoesNotExits.code;
  }
}

class StatementDoesNotExits extends Error {
  public static code = "statement does not exist";

  constructor(m: string) {
    super(m);

    // Set the prototype explicitly.
    Object.setPrototypeOf(this, StatementDoesNotExits.prototype);
  }

  statusCode(): number {
    return 400;
  }

  toString(): string {
    return StatementDoesNotExits.code;
  }
}

export interface IError extends Error {
  statusCode(): number;
}

export {
  BadCredentialsError,
  NotFound,
  BadParams,
  UserDoesNotExits,
  ActantDoesNotExits,
  ActionDoesNotExits,
  StatementDoesNotExits,
};
