/**
 * CustomError is wrapper around generic Error object, so we can implement our own logic and still use classic Error interface
 * The changes are:
 *   - name attribute is set explicitly in the constructor, so its value refers to the customized error class (ie. "BadCredentialsError")
 *   - statusCode method returns static 'code' attribute from constructed class
 */
export class CustomError extends Error {
  public static code: number = 400; // html code
  public loggable: boolean = false; // errors could be logged into console as warn messages
  public log: string = ""; // same as first constructor argument - wont be thrown in realtime, but it will be printed as warning

  // the following is commented, it should be inherited from base Error
  //public message: string = ""; // this is what will be printed in output - public text, some error classes have overriden message attr

  constructor(m: string) {
    super(m);
    this.log = m;
    this.name = this.constructor.name; // so the value would be taken from the constructor - not the default Error
  }

  statusCode(): number {
    return (this.constructor as any).code;
  }

  shouldLog(): boolean {
    return this.loggable;
  }
}

/**
 * BadCredentialsError is an error associated with invalid combination of login & password credentials
 */
class BadCredentialsError extends CustomError {
  public static code = 401;
  message = "Bad credentials";
}

/**
 * PermissionDeniedError will be thrown if request is not authorized to request such resource
 */
class PermissionDeniedError extends CustomError {
  public static code = 403;

  constructor(message: string) {
    super(message);
  }
}

/**
 * ModelNotValidError is thrown, when incoming raw data in the api handler cannot be assigned to known model.
 * Governed by 'class' attribute
 * @see ../../packages/server/models/factory.ts
 */
class ModelNotValidError extends CustomError {
  public static code = 400;
  message = "Model not valid";
  loggable = true;
}

/**
 * NotFound will be thrown when the api cannot handle the request - unknown route
 */
class NotFound extends CustomError {
  public static code = 404;
  message = "Not found";
}

/**
 * BadParams is more generic error for bad input data
 */
class BadParams extends CustomError {
  public static code = 400;
  message = "Bad parameters";
}

/**
 * UserDoesNotExits will be thrown when attempting to remove/update the user entry, which does not exist
 */
class UserDoesNotExits extends CustomError {
  public static code = 400;
  message = "User $1 does not exist";

  constructor(m: string, userId: string) {
    super(m);
    this.message = this.message.replace("$1", userId);
  }
}

/**
 * UserDoesNotExits will be thrown when attempting to remove/update the user entry, which does not exist
 */
class UserNotActiveError extends CustomError {
  public static code = 405;
  public static message = "User $1 is not active";

  constructor(userId: string) {
    super(UserNotActiveError.message.replace("$1", userId));
  }
}

/**
 * EntityDoesNotExits will be thrown when attempting to remove/update the entity entry, which does not exist
 */
class EntityDoesNotExits extends CustomError {
  public static code = 400;
  message = "Entity $1 does not exist";

  constructor(m: string, entityId: string) {
    super(m);
    this.message = this.message.replace("$1", entityId);
  }
}

/**
 * StatementDoesNotExits will be thrown when attempting to remove/update the statement entry, which does not exist
 */
class StatementDoesNotExits extends CustomError {
  public static code = 400;
  message = "Statement $1 does not exist";

  constructor(m: string, statementId: string) {
    super(m);
    this.message = this.message.replace("$1", statementId);
  }
}

/**
 * TerritoryDoesNotExits will be thrown when attempting to remove/update the territory entry, which does not exist
 */
class TerritoryDoesNotExits extends CustomError {
  public static code = 400;
  message = "Territory $1 does not exist";

  constructor(m: string, territoryId: string) {
    super(m);
    this.message = this.message.replace("$1", territoryId);
  }
}

/**
 * PermissionDoesNotExits will be thrown when attempting to remove/update the permission entry which does not exist
 */
class PermissionDoesNotExits extends CustomError {
  public static code = 400;
  message = "Permission $1 does not exist";

  constructor(m: string, permissionId: string) {
    super(m);
    this.message = this.message.replace("$1", permissionId);
  }
}

/**
 * TerritoriesBrokenError is an error associated with broken tree structure (more than one root element)
 */
class TerritoriesBrokenError extends CustomError {
  public static code = 500;
  message = "Territories are broken";
}

/**
 * TerrytoryInvalidMove will be thrown during tree/moveTerritory request, while violating some constraint
 */
class TerrytoryInvalidMove extends CustomError {
  public static code = 500;
  message = "Invalid move";
}

/**
 * StatementInvalidMove will be thrown during territories/moveStatement request, while violating some constraint
 */
class StatementInvalidMove extends CustomError {
  public static code = 500;
  message = "Invalid move";
}

/**
 * InternalServerError will be thrown when some unexpected error occurs
 */
class InternalServerError extends CustomError {
  public static code = 500;
  message = "Internal server error";
  loggable = true;
}

/**
 * UnauthorizedError will be thrown during request, which does not contain authorization data (without jwt token)
 */
class UnauthorizedError extends CustomError {
  public static code = 401;
  message = "Unauthorized request";
}

/**
 * InvalidDeleteError will be thrown from model's delete method, while violating some constraint
 */
class InvalidDeleteError extends CustomError {
  public static code = 400;
  message = "Invalid delete request";
}

/**
 * UnknownError works as a backup
 */
class UnknownError extends CustomError {
  public static code = 500;
  message = "Unknown error";
}

const allErrors: Record<string, any> = {
  InvalidDeleteError,
  UnauthorizedError,
  PermissionDeniedError,
  InternalServerError,
  ModelNotValidError,
  BadCredentialsError,
  NotFound,
  BadParams,
  UserDoesNotExits,
  UserNotActiveError,
  EntityDoesNotExits,
  StatementDoesNotExits,
  PermissionDoesNotExits,
  TerritoriesBrokenError,
  TerritoryDoesNotExits,
  TerrytoryInvalidMove,
  StatementInvalidMove,
};

export function getErrorByCode(name: string): CustomError {
  return allErrors[name] ? new allErrors[name]() : new UnknownError("");
}

export {
  InvalidDeleteError,
  UnauthorizedError,
  PermissionDeniedError,
  InternalServerError,
  ModelNotValidError,
  BadCredentialsError,
  NotFound,
  BadParams,
  UserDoesNotExits,
  UserNotActiveError,
  EntityDoesNotExits,
  StatementDoesNotExits,
  PermissionDoesNotExits,
  TerritoriesBrokenError,
  TerritoryDoesNotExits,
  TerrytoryInvalidMove,
  StatementInvalidMove,
};
