/**
 * CustomError is wrapper around generic Error object, so we can implement our own logic and still use classic Error interface
 * The changes are:
 *   - name attribute is set explicitly in the constructor, so its value refers to the customized error class (ie. "BadCredentialsError")
 *   - statusCode method returns static 'code' attribute from constructed class
 */
export class CustomError extends Error {
  public static code: number = 400;

  constructor(m: string) {
    super(m);
    this.name = this.constructor.name; // so the value would be taken from the constructor - not the default Error
  }

  statusCode(): number {
    return (this.constructor as any).code;
  }
}

/**
 * BadCredentialsError is an error associated with invalid combination of login & password credentials
 */
class BadCredentialsError extends CustomError {
  public static code = 401;
}

/**
 * ModelNotValidError is thrown, when incoming raw data in the api handler cannot be assigned to known model.
 * Governed by 'class' attribute
 * @see ../../packages/server/models/factory.ts
 */
class ModelNotValidError extends CustomError {
  public static code = 400;
}

/**
 * NotFound will be thrown when the api cannot handle the request - unknown route
 */
class NotFound extends CustomError {
  public static code = 404;
}

/**
 * BadParams is more generic error for bad input data
 */
class BadParams extends CustomError {
  public static code = 400;
}

/**
 * UserDoesNotExits will be thrown when attempting to remove/update the user entry, which does not exist
 */
class UserDoesNotExits extends CustomError {
  public static code = 400;
}

/**
 * ActantDoesNotExits will be thrown when attempting to remove/update the actant entry, which does not exist
 */
class ActantDoesNotExits extends CustomError {
  public static code = 400;
}

/**
 * ActionDoesNotExits will be thrown when attempting to remove/update the action entry, which does not exist
 */
class ActionDoesNotExits extends CustomError {
  public static code = 400;
}

/**
 * StatementDoesNotExits will be thrown when attempting to remove/update the statement entry, which does not exist
 */
class StatementDoesNotExits extends CustomError {
  public static code = 400;
}

/**
 * TerritoryDoesNotExits will be thrown when attempting to remove/update the territory entry, which does not exist
 */
class TerritoryDoesNotExits extends CustomError {
  public static code = 400;
}

/**
 * TerritoriesBrokenError is an error associated with broken tree structure (more than one root element)
 */
class TerritoriesBrokenError extends CustomError {
  public static code = 500;
}

/**
 * TerrytoryInvalidMove will be thrown during tree/moveTerritory request, while violating some constraint
 */
class TerrytoryInvalidMove extends CustomError {
  public static code = 500;
}

/**
 * StatementInvalidMove will be thrown during territories/moveStatement request, while violating some constraint
 */
class StatementInvalidMove extends CustomError {
  public static code = 500;
}

/**
 * InternalServerError will be thrown when some unexpected error occurs
 */
class InternalServerError extends CustomError {
  public static code = 500;
}

/**
 * UnauthorizedError will be thrown during request, which does not contain authorization data (without jwt token)
 */
class UnauthorizedError extends CustomError {
  public static code = 401;
}

/**
 * InvalidDeleteError will be thrown from model's delete method, while violating some constraint
 */
class InvalidDeleteError extends CustomError {
  public static code = 400;
}

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
