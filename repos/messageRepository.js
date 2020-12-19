
export default function messageRepository(con, mysql) {
    return Object.freeze({
      getAll,
      addMessage,
    });
      function getAll() {
          return new Promise(function (resolve, reject) {
              con.query(mysql.format("SELECT * from Messages"), (err, res) => {
              if (err) {
                reject(err);
              } else {
                resolve(res)
              }
            })
          });
        }
  
      function addMessage(msg) {
          return new Promise(function (resolve, reject) {
            con.query(mysql.format(`INSERT INTO Messages (message,author,date) VALUES (?,?,?)`, [msg.message, msg.author, msg.date]), (err, res) => {
              if (err) {
                reject(err);
              } else {
                  //grazina id.
                con.query(mysql.format("SELECT LAST_INSERT_ID() as id"), (erro, resp) => {
                  if (!erro && resp.length > 0) {
                    resolve(resp[0].id)
                  } else {
                    reject(erro);
                  }
                })
              }
            })
          });
        }
  
  }