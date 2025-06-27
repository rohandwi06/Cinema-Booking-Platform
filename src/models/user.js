
const db = require('../config/database');

const getUserById = async (id) => {
  const query = `SELECT * FROM users WHERE id = ?`;
  const user = await (await db()).get(query, [id]);
  return user;
};

const getAllUsers = async () => {
  const query = `SELECT * FROM users`;
  const users = await (await db()).all(query);
  return users;
};

module.exports = { getUserById, getAllUsers };

