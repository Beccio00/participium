export class PublicUser {
	id: string;
	username: string;

	constructor(id: string, username: string) {
		this.id = id;
		this.username = username;
	}
}

export class PrivateUser {
	id: string;
	username: string;
	hashedPassword: string;
	salt: string;

	constructor(id: string, username: string, hashedPassword: string, salt: string) {
		this.id = id;
		this.username = username;
		this.hashedPassword = hashedPassword;
		this.salt = salt;
	}
}


