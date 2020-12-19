import messageRepository from './messageRepository.js';


//Duomenų bazės sukūrimas ir paleidimas.
export default function makeDataAccess(mysql) {
    const con = mysql.createConnection({
      host: "localhost",
      user: "root",
      password: "",
      database: "testDb",
      port: 3306,
    });

    con.connect(function(err) {
      if (err) throw err;
      console.log("Connected!");
    });

    con.query(`CREATE TABLE IF NOT EXISTS Messages ( id int UNSIGNED AUTO_INCREMENT PRIMARY KEY, message VARCHAR(500) NOT NULL, author VARCHAR(50), date VARCHAR(20))`)
    console.log("All tables created.")

   const msgDb = messageRepository(con, mysql);
  
   return({ msgDb })

    
  
  }