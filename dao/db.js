const mysql = require('mysql');
var connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '123456',
  database: 'movie'
})

connection.connect();

/**
 * 将网络上的爱奇艺上好莱坞的菜单中的信息进行保存在自己的数据库中
 * @param {*} sql 
 * @param {*} params 
 * @param {*} cb 
 */
const add = (sql, params, cb) => {
  connection.query(sql, [params], function (err, result) {
    // console.log('INSERT ID:',result);   
    if (err) {
      cb && cb({
        code: '50000'
      });
      throw err;
    }
    cb && cb({
      code: '00000'
    });
  })
  // connection.end();
}

/**
 * 查询影片
 * @param {*} page 
 * @param {*} pagesize 
 * @param {*} cb 
 */
const select = (page, pagesize, cb) => {
  let sql1 = 'SELECT COUNT(*) FROM info';
  let sql2 = `SELECT * FROM info limit ${(page - 1) * pagesize}, ${page * pagesize}`;
  let promise1 = new Promise((resolve, reject) => {
    connection.query(sql1, function (err, result) {
      // connection.release();
      if (err) {
        cb && cb({
          code: '50000'
        });
        reject(err);
        throw err;
      }
      resolve(result[0]['COUNT(*)']);
    })
  })
  let promise2 = new Promise((resolve, reject) => {
    connection.query(sql2, (err, result) => {
      if (err) {
        reject(err);
        throw err;
      }
      resolve(result);
    })

  })

  Promise.all([promise1, promise2]).then(result => {
    cb && cb({
      code: '00000',
      data: {
        total: result[0],
        list: result[1]
      }
    });
    // connection.end();
  }, error => {
    cb && cb({
      code: '50000'
    })
    // connection.end();
  }).catch(error => {
    console.log(error);
  })
}

/**
 * 获取影片详情  1. 先去数据库中获取影片详情的html链接 2. 获取到链接之后，再去获取详情，以及播放的地址
 * @param {*} id 
 * @param {*} cb 
 */
const detail = (id, cb) => {
  let sql = 'SELECT * from detail where infoId = ?';
  connection.query(sql, [id], (err, result) => {
    if(err) {
      throw err;
    }
    cb && cb({
      code: '00000',
      data: result[0]
    });
  })
}

const MAXID = (cb) => {
  let sql = 'SELECT * FROM info ORDER BY id DESC LIMIT 0,1';
  connection.query(sql, (err, result) => {
    if(err) {
      throw err;
    }
    cb && cb(result.length ? result[0].id : 0);
    // return result[0].id;
  })
}
module.exports = {
  add,
  select,
  detail,
  MAXID
};
