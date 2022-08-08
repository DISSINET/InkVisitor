/**
 * CustomError is wrapper around generic Error object/interface, so we can implement our own logic and still use classic Error approach.
 * The changes are:
 *   - statusCode method returns static 'code' attribute from constructed class
 *   - loggable/shouldLog predicate tells the middleware if this error is significant and should be logged
 *   - title attribute is derived from the constructor attribute (static prop). Provides basic title in readable form
 */
export class CustomError extends Error {
  public static code: number = 400; // html code
  public loggable: boolean = false; // errors could be logged into console as warn messages
  public log: string = ""; // same as first constructor argument - wont be thrown in realtime, but it will be printed as warning
  public title: string = ""; // represents the error class in readable form

  // the following is commented, it should be inherited from base Error
  //public name: string = ""; // Stands for class name, replaces default 'Error' string from parent constructor
  //public message: string = ""; // this is what will be printed in output - public text, some error classes have overriden message attr

  constructor(message?: string) {
    super(message);
    this.log = message || "";
    this.name = this.constructor.name; // so the value would be taken from the constructor - not the default Error
    this.title = (this.constructor as any).title;
    if (!message) {
      this.message = (this.constructor as any).message;
    }
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
  public static title = "Bad credentials";
  public static message = "";
}

/**
 * PermissionDeniedError will be thrown if request is not authorized to request such resource
 */
class PermissionDeniedError extends CustomError {
  public static code = 403;
  public static title = "Permission denied";
  public static message = "You don't have required permissions";
}

/**
 * ModelNotValidError is thrown, when incoming raw data in the api handler cannot be assigned to known model.
 * Governed by 'class' attribute
 * @see ../../packages/server/models/factory.ts
 */
class ModelNotValidError extends CustomError {
  public static code = 400;
  public static title = "Model not valid";
  public static message = "Invalid request data";
  loggable = true;
}

/**
 * NotFound will be thrown when the api cannot handle the request - unknown route
 */
class NotFound extends CustomError {
  public static code = 404;
  public static title = "Not found";
  public static message = "Endpoint not implemented";
}

/**
 * BadParams is more generic error for bad input data
 */
class BadParams extends CustomError {
  public static code = 400;
  public static title = "Bad parameters";
  public static message = "Invalid request data";
}

/**
 * UserDoesNotExits will be thrown when attempting to remove/update the user entry, which does not exist
 */
class UserDoesNotExits extends CustomError {
  public static code = 400;
  public static title = "Missing user";
  public static message = "User $1 does not exist";

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
  public static title = "Inactive user";
  public static message = "User $1 is not active";

  constructor(m: string, userId: string) {
    super(m);
    this.message = this.message.replace("$1", userId);
  }
}

/**
 * EntityDoesNotExist will be thrown when attempting to remove/update the entity entry, which does not exist
 */
class EntityDoesNotExist extends CustomError {
  public static code = 400;
  public static title = "Missing entity";
  public static message = "Entity $1 does not exist";

  constructor(m: string, entityId: string) {
    super(m);
    this.message = this.message.replace("$1", entityId);
  }
}

/**
 * AuditsDoNotExist will be thrown when attempting to access audits entries, which do not exist
 */
class AuditsDoNotExist extends CustomError {
  public static code = 400;
  public static title = "Missing audits";
  public static message = "Audits for entity $1 do not exist";

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
  public static title = "Missing statement";
  public static message = "Statement $1 does not exist";

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
  public static title = "Missing territory";
  public static message = "Territory $1 does not exist";

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
  public static title = "Permission does not exist";
  public static message = "Permission $1 does not exist";

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
  public static title = "Territories broken";
  public static message = "Territories are broken";
}

/**
 * TerrytoryInvalidMove will be thrown during tree/id/position request, while violating some constraint
 */
class TerrytoryInvalidMove extends CustomError {
  public static code = 500;
  public static title = "Territory invalid move";
  public static message = "Move action cannot be completed";
}

/**
 * StatementInvalidMove will be thrown during territories/moveStatement request, while violating some constraint
 */
class StatementInvalidMove extends CustomError {
  public static code = 500;
  public static title = "Statement invalid move";
  public static message = "Move action cannot be completed";
}

/**
 * InternalServerError will be thrown when some unexpected error occurs
 */
class InternalServerError extends CustomError {
  public static code = 500;
  public static title = "Internal server error";
  public static message = "An unknown error occured";
  loggable = true;
}

/**
 * UnauthorizedError will be thrown during request, which does not contain authorization data (without jwt token)
 */
class UnauthorizedError extends CustomError {
  public static code = 401;
  public static title = "Unauthorized";
  public static message = "Unauthorized request";
}

/**
 * InvalidDeleteError will be thrown from model's delete method, while violating some constraint
 */
class InvalidDeleteError extends CustomError {
  public static code = 400;
  public static title = "Invalid delete";
  public static message = "Model cannot be deleted";
  loggable = true;
}

/**
 * EmailError will be thrown in case of error occured in mail module
 */
class EmailError extends CustomError {
  public static code = 500;
  public static title = "Email cannot be sent";
  public static message = "Unknow error while sending the email";
  loggable = true;

  constructor(m: string, internalMessage: string) {
    super(m);
    this.log = internalMessage;;
  }
}

/**
 * RelationDoesNotExist will be thrown when attempting to remove/update the relation entry, which does not exist
 */
class RelationDoesNotExist extends CustomError {
  public static code = 400;
  public static title = "Cannot get Relation entry";
  public static message = "Relation $1 does not exist";

  static forId(id: string): RelationDoesNotExist {
    return new RelationDoesNotExist(
      RelationDoesNotExist.message.replace("$1", id)
    );
  }
}

/**
 * UnknownError works as a backup
 */
class UnknownError extends CustomError {
  public static code = 500;
  public static title = "Unknown error";
  public static message = "Mysterious";
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
  EntityDoesNotExist,
  AuditsDoNotExist,
  StatementDoesNotExits,
  PermissionDoesNotExits,
  TerritoriesBrokenError,
  TerritoryDoesNotExits,
  TerrytoryInvalidMove,
  StatementInvalidMove,
  EmailError,
  RelationDoesNotExist,
};

export interface IErrorSignature {
  error: string; // unique error code - error's constructor
  message: string; // additional message in readable form
}

export function getErrorByCode(errSig: IErrorSignature): CustomError {
  return allErrors[errSig.error]
    ? new allErrors[errSig.error](errSig.message)
    : new UnknownError(errSig.message || "Something bad happened");
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
  EntityDoesNotExist,
  AuditsDoNotExist,
  StatementDoesNotExits,
  PermissionDoesNotExits,
  TerritoriesBrokenError,
  TerritoryDoesNotExits,
  TerrytoryInvalidMove,
  StatementInvalidMove,
  EmailError,
  RelationDoesNotExist,
};
