import mysql2 from 'mysql2'

const db= mysql2.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database : "blogproj"
});
export default db;