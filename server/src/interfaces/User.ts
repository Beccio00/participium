// Public DTO: no password information
export class PublicUser {
	email: string;
	firstName: string;
	lastName: string;
	role: string;

	constructor(email: string, firstName: string, lastName: string, role: string) {
		this.email = email;
		this.firstName = firstName;
		this.lastName = lastName;
		this.role = role;
	}
}

// Private user stored in DB (includes hashed password + salt)
export class PrivateUser {
	id: number;
	email: string;
	firstName: string;
	lastName: string;
	password: string; // hashed password
	salt: string;
	role: string;

	constructor(id: number, email: string, firstName: string, lastName: string, password: string, salt: string, role: string) {
		this.id = id;
		this.email = email;
		this.firstName = firstName;
		this.lastName = lastName;
		this.password = password;
		this.salt = salt;
		this.role = role;
	}
}


