import {
  IUser,
  IUserOptions,
  IBookmarkFolder,
  IStoredTerritory,
  IUserRight,
} from "@inkvisitor/shared/types";
import { Conn, Db, WriteResult, storage } from "@service/storage";
import { IDbModel, fillArray, fillFlatObject } from "@models/common";
import { EntityEnums, UserEnums } from "@inkvisitor/shared/enums";
import { ModelNotValidError } from "@inkvisitor/shared/types/errors";
import { generateUuid, hashPassword } from "@common/auth";
import { generatePassword } from "@common/functions";
import { nonenumerable } from "@common/decorators";
import { DbHandle } from "@service/dbHandle";
import { cache } from "@service/ttlCache";

// No TTL: invalidation is fully owned by the changefeed listener in
// service/changefeedInvalidator.ts plus the explicit cache.delete calls
// in User.update / User.delete.
export const USER_CACHE_KEY_PREFIX = "user:byId:";
export const userCacheKey = (id: string): string => `${USER_CACHE_KEY_PREFIX}${id}`;

export class UserRight implements IUserRight {
  territory = "";
  mode: UserEnums.RoleMode = UserEnums.RoleMode.Read;

  constructor(data: IUserRight) {
    this.territory = data.territory;
    this.mode = data.mode;
  }

  isValid(): boolean {
    return !!this.territory;
  }
}

export class UserOptions implements IUserOptions {
  defaultTerritory = "";
  defaultStatementLanguage: EntityEnums.Language = EntityEnums.Language.Empty;
  defaultLanguage: EntityEnums.Language = EntityEnums.Language.Empty;
  searchLanguages: EntityEnums.Language[] = [];
  workingLanguages: EntityEnums.Language[] = [];
  hideStatementElementsOrderTable?: boolean = false;
  askBeforePropDelete?: boolean = true;

  constructor(data: Partial<IUserOptions>) {
    fillFlatObject(this, data);
    fillArray(this.searchLanguages, String, data?.searchLanguages || []);
    fillArray(this.workingLanguages, String, data?.workingLanguages || []);
  }

  isValid(): boolean {
    if (this.searchLanguages.find((lang) => !lang)) {
      return false;
    }

    if (this.workingLanguages.find((lang) => !lang)) {
      return false;
    }

    return true;
  }
}

export class BookmarkFolder implements IBookmarkFolder {
  id = "";
  name = "";
  entityIds: string[] = [];

  constructor(data: Partial<IBookmarkFolder>) {
    fillFlatObject(this, data);
    fillArray(this.entityIds, String, data.entityIds);
  }

  isValid(): boolean {
    if (!this.id) {
      return false;
    }

    if (!this.name) {
      return false;
    }

    if (this.entityIds.find((a) => !a)) {
      return false;
    }

    return true;
  }

  /**
   * Shorthand for removing entity id from array of ids
   * @param entityId
   */
  removeEntity(entityId: string) {
    this.entityIds = this.entityIds.filter((id) => id != entityId);
  }
}

export class StoredTerritory implements IStoredTerritory {
  territoryId: string;

  constructor(data: Partial<IStoredTerritory>) {
    this.territoryId = data.territoryId as string;
  }

  isValid(): boolean {
    return !!this.territoryId;
  }
}

export default class User implements IUser, IDbModel {
  id = "";
  email = "";

  @nonenumerable
  password = "";

  name = "";
  role: UserEnums.Role = UserEnums.Role.Viewer;
  active = false;
  verified = false;
  options: UserOptions = new UserOptions({});
  bookmarks: BookmarkFolder[] = [];
  storedTerritories: StoredTerritory[] = [];
  rights: UserRight[] = [];

  hash?: string = "";

  deletedAt?: Date;

  static table = "users";

  constructor(data: Partial<IUser>) {
    fillFlatObject(this, data);
    this.options = new UserOptions(data.options as IUserOptions);
    fillArray<IBookmarkFolder>(this.bookmarks, BookmarkFolder, data.bookmarks);
    fillArray(this.storedTerritories, StoredTerritory, data.storedTerritories);
    fillArray<IUserRight>(this.rights, UserRight, data.rights);
  }

  /**
   * Stores the user in the db
   * @param db db connection
   * @returns Promise<boolean> to indicate result of the operation
   */
  async save(dbInstance: Conn | undefined): Promise<boolean> {
    const result = await storage.users.insert(dbInstance as Conn, {
      ...this,
      id: this.id || undefined,
    });

    if (result.generated_keys) {
      this.id = result.generated_keys[0];
    }

    return result.inserted === 1;
  }

  async update(
    dbInstance: Conn | undefined,
    updateData: Record<string, unknown>
  ): Promise<WriteResult> {
    const snapshot = new User({
      ...JSON.parse(JSON.stringify(this)),
      ...updateData,
    });

    if (!snapshot.isValid()) {
      throw new ModelNotValidError("model not valid");
    }

    const result = await storage.users.update(dbInstance as Conn, this.id, updateData);
    cache.delete(userCacheKey(this.id));
    return result;
  }

  /**
   * Soft delete operation - set deletedAt to current date, value indicated deleted user
   * @param dbInstance
   * @returns
   */
  async delete(dbInstance: Conn): Promise<WriteResult> {
    const result = await storage.users.update(dbInstance, this.id, {
      deletedAt: new Date(),
    });
    cache.delete(userCacheKey(this.id));
    return result;
  }

  isValid(): boolean {
    if (this.email == "") {
      return false;
    }

    if (
      !this.options.isValid() ||
      !!this.bookmarks.find((b) => !b.isValid()) ||
      !!this.storedTerritories.find((t) => !t.isValid()) ||
      !!this.rights.find((t) => !t.isValid())
    ) {
      return false;
    }

    return true;
  }

  canBeCreatedByUser(user: User): boolean {
    return user.hasRole([UserEnums.Role.Owner, UserEnums.Role.Admin]);
  }

  canBeEditedByUser(user: User): boolean {
    return user.hasRole([UserEnums.Role.Owner, UserEnums.Role.Admin]) || user.id == this.id;
  }

  canBeDeletedByUser(user: User): boolean {
    return user.hasRole([UserEnums.Role.Owner, UserEnums.Role.Admin]);
  }

  generatePassword(): string {
    const raw = generatePassword(12);
    return this.setPassword(raw);
  }

  setPassword(raw: string): string {
    this.password = hashPassword(raw);
    return raw;
  }

  generateHash(): string {
    // should be unique - time based uuid
    this.hash = generateUuid();
    return this.hash;
  }

  /**
   * Finds user by 'id' field
   * Ignores thrashed entries
   * @param dbInstance
   * @param id
   * @returns
   */
  static async findUserById(dbInstance: Conn | undefined, id: string): Promise<User | null> {
    const key = userCacheKey(id);
    // Snapshot before the DB read; trySet below refuses if a writer
    // invalidated the key meanwhile.
    const version = cache.snapshot(key);
    const cached = cache.get<IUser>(key);
    if (cached) {
      return new User(cached);
    }

    const data = await storage.users.get(dbInstance as Conn, id);
    if (!data || data.deletedAt) {
      return null;
    }

    // Cache the full row including the password hash, consistent with
    // findUserByLogin / getUserByHash / getUserByEmail (none of which
    // strip). Password is marked @nonenumerable on the User class so it
    // does not appear in JSON serializations of returned User instances,
    // and the cache is invalidated whenever User.update fires - which
    // includes every password-change path.
    cache.trySet(key, data as IUser, undefined, version);
    return new User(data);
  }

  /**
   * Returns first owner-role based user or null
   * @param dbInstance
   * @returns
   */
  static async getOwner(dbInstance: Conn | undefined): Promise<User | null> {
    const data = await storage.users.owner(dbInstance as Conn);
    return data ? new User(data) : null;
  }

  /**
   * Finds user identified by 'email' field
   * Ignores thrashed entries
   * @param dbInstance
   * @param email
   * @returns
   */
  static async getUserByEmail(
    dbInstance: Conn | undefined,
    email: string
  ): Promise<User | null> {
    const data = await storage.users.byEmail(dbInstance as Conn, email);
    return data ? new User(data) : null;
  }

  /**
   * Finds user identified by 'hash' field
   * Ignores thrashed entries
   * @param dbInstance
   * @param hash
   * @returns
   */
  static async getUserByHash(
    dbInstance: Conn | undefined,
    hash: string
  ): Promise<User | null> {
    const data = await storage.users.byHash(dbInstance as Conn, hash);
    return data ? new User(data) : null;
  }

  /**
   * Returns all users
   * Ignores thrashed entries
   * @param dbInstance
   * @returns
   */
  static async findAllUsers(dbInstance: Conn | undefined): Promise<User[]> {
    const data = await storage.users.allActive(dbInstance as Conn);
    return data.map((d) => new User(d));
  }

  /**
   * Method searches for user by email or username (login).
   * Optionally includes also thrashed entries (for keeping uniqueness across emails/logins)
   * @param dbInstance
   * @param label
   * @param includeThrashed
   * @returns
   */
  static async findUserByLogin(
    dbInstance: Db | DbHandle,
    login: string,
    includeThrashed: boolean
  ): Promise<User | null> {
    const data = await storage.users.byLogin(dbInstance.connection, login, includeThrashed);

    return data ? new User(data) : null;
  }

  /**
   * Returns users by cleaned label (for name / email).
   * Does not return thrashed users.
   * @param dbInstance
   * @param label
   * @returns
   */
  static async findUsersByLabel(
    dbInstance: Conn | undefined,
    label: string
  ): Promise<User[]> {
    const data = await storage.users.all(dbInstance as Conn);
    return data.map((d) => new User(d));
  }

  /**
   * Searches for users associated with bookmarked entity
   * Returns also thrashed users
   * @param db
   * @param entityId
   * @returns array of IUser interfaces
   */
  static async findByBookmarkedEntity(db: Conn, entityId: string): Promise<IUser[]> {
    return storage.users.byBookmarkedEntity(db, entityId);
  }

  /**
   * Searches for users associated with stored territory
   * Returns also thrashed users
   * @param db
   * @param territoryId
   * @returns array of IUser interfaces
   */
  static async findByStoredTerritory(db: Conn, territoryId: string): Promise<IUser[]> {
    return storage.users.byStoredTerritory(db, territoryId);
  }

  /**
   * Removed bookmarks with entityId from all users
   * Uses findByBookmarkedEntity which returns also thrashed users
   * @param db
   * @param entityId
   */
  static async removeBookmarkedEntity(db: Conn, entityId: string): Promise<void> {
    const userEntries = await User.findByBookmarkedEntity(db, entityId);
    for (const userData of userEntries) {
      const userModel = new User(userData);
      userModel.bookmarks.forEach((b) => b.removeEntity(entityId));
      await userModel.update(db, { bookmarks: userModel.bookmarks });
    }
  }

  /**
   * Removed stored territory with territoryId from all users
   * Uses findByStoredTerritory which returns also thrashed users
   * @param db
   * @param territoryId
   */
  static async removeStoredTerritory(db: Conn, territoryId: string): Promise<void> {
    const userEntries = await User.findByStoredTerritory(db, territoryId);
    for (const userData of userEntries) {
      const userModel = new User(userData);
      userModel.storedTerritories = userModel.storedTerritories.filter(
        (s) => s.territoryId !== territoryId
      );
      await userModel.update(db, {
        storedTerritories: userModel.storedTerritories,
      });
    }
  }

  hasRole(allowed: UserEnums.Role[]): boolean {
    return allowed.indexOf(this.role) !== -1;
  }

  /**
   * Resource entity ids the user is assigned to annotate. Stored as rights
   * entries with mode === Annotate, where the `territory` field reuses to
   * carry the Resource id (see UserEnums.RoleMode.Annotate).
   */
  getAnnotateResourceIds(): string[] {
    return this.rights
      .filter((r) => r.mode === UserEnums.RoleMode.Annotate)
      .map((r) => r.territory);
  }

  /**
   * Whether the user is assigned to annotate/edit the given Resource entity.
   */
  hasAnnotateRightForResource(resourceId: string): boolean {
    return this.getAnnotateResourceIds().includes(resourceId);
  }
}
