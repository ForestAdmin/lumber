CREATE TABLE addresses (
	user_id int NOT NULL PRIMARY KEY,
	street varchar(30) NOT NULL,
	city varchar(30) NOT NULL,
	state varchar(30) NOT NULL,
	CONSTRAINT fk_user_id FOREIGN KEY (user_id) REFERENCES users (id)
);