export class CustomError extends Error {
  name = ""; //  identifier - class name, ie. "BadParams"
  message = ""; // customized message - details about the error detail create in constructor, ie. "Lable not provided"

  public static code: number = 400;

  constructor(m: string) {
    super(m);
    this.message = m;
    this.name = this.constructor.name;
  }

  statusCode(): number {
    return (this.constructor as any).code;
  }
}

class BadCredentialsError extends CustomError {
  public static code = 401;
}

class ModelNotValidError extends CustomError {
  public static code = 400;
}

class NotFound extends CustomError {
  public static code = 404;
}

class BadParams extends CustomError {
  public static code = 400;
}

class UserDoesNotExits extends CustomError {
  public static code = 400;
}

class ActantDoesNotExits extends CustomError {
  public static code = 400;
}

class ActionDoesNotExits extends CustomError {
  public static code = 400;
}

class StatementDoesNotExits extends CustomError {
  public static code = 400;
}

class TerritoryDoesNotExits extends CustomError {
  public static code = 400;
}

class TerritoriesBrokenError extends CustomError {
  public static code = 500;
}

class TerrytoryInvalidMove extends CustomError {
  public static code = 500;
}

class StatementInvalidMove extends CustomError {
  public static code = 500;
}

class InternalServerError extends CustomError {
  public static code = 500;
}

class UnauthorizedError extends CustomError {
  public static code = 401;
}

class InvalidDeleteError extends CustomError {
  public static code = 400;
}

/*
type filterMap = Record<string, new (description: string) => IError>;

const errors: filterMap = {
  ModelNotValidError,
  BadCredentialsError,
  NotFound,
  BadParams,
  UserDoesNotExits,
  ActantDoesNotExits,
  ActionDoesNotExits,
  StatementDoesNotExits,
  TerritoriesBrokenError,
  TerritoryDoesNotExits,
  TerrytoryInvalidMove,
  StatementInvalidMove,
};

export default errors;
*/

export {
  InvalidDeleteError,
  UnauthorizedError,
  InternalServerError,
  ModelNotValidError,
  BadCredentialsError,
  NotFound,
  BadParams,
  UserDoesNotExits,
  ActantDoesNotExits,
  ActionDoesNotExits,
  StatementDoesNotExits,
  TerritoriesBrokenError,
  TerritoryDoesNotExits,
  TerrytoryInvalidMove,
  StatementInvalidMove,
};
