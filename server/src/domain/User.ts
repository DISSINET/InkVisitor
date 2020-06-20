
export enum Role {
    Admin,
    Standard,
}

export type Id = number;
export type Name = string;
export type Email = string;
export type Password = string;

export interface IUser {
    id: Id;
    role: Role;
    name: Name;
    email: Email;
    password: string;

}

export class User implements IUser {
    public id: Id;
    public name: Name;
    public email: Email;
    public role: Role;
    public password: Password;

    constructor(
        id: Id,
        name: Name,
        email: Email,
        role: Role,
        password: Password,
    ) {
        this.name = name;
        this.email = email;
        this.role = role;
        this.password = password;
        this.id = id;
    }
}

export interface IUserRepository {
    getOne: (email: string) => Promise<IUser | null>;
    getAll: () => Promise<IUser[]>;
    create: (user: IUser) => Promise<void>;
    update: (user: IUser) => Promise<void>;
    delete: (id: number) => Promise<void>;
}