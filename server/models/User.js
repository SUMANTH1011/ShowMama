import db from "../configs/db.js";

export const createUserTable=()=>{
    const query=`CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        image TEXT NOT NULL
    )`;
    db.run(query,(err)=>{
        if(err){
            console.error("Error creating users table",err.message);
        }else{
            console.log("Users table created or already exists");
        }
    });
}

export const createUser = (userData) => {
  const { id, name, email, image } = userData;

  const query = `
    INSERT OR IGNORE INTO users (id, name, email, image)
    VALUES (?, ?, ?, ?)
  `;

  return new Promise((resolve, reject) => {
    db.run(query, [id, name, email, image], function (err) {
      if (err) reject(err);
      else resolve({ id });
    });
  });
};
export const deleteUserById = (id) => {
  const query = `DELETE FROM users WHERE id = ?`;

  return new Promise((resolve, reject) => {
    db.run(query, [id], function (err) {
      if (err) reject(err);
      else resolve({ deletedRows: this.changes });
    });
  });
};
export const updateUserById = (id, updateData) => {
  const { name, email, image } = updateData;

  const query = `
    UPDATE users
    SET
      name = COALESCE(?, name),
      email = COALESCE(?, email),
      image = COALESCE(?, image)
    WHERE id = ?
  `;

  return new Promise((resolve, reject) => {
    db.run(query, [name, email, image, id], function (err) {
      if (err) reject(err);
      else resolve({ updatedRows: this.changes });
    });
  });
};
