var dao = require('./dao/db.js');
var bodyParser = require("body-parser");
var express = require('express');
var app = express();
var path = require('path');

const superagent = require('superagent');
var cheerio = require('cheerio');

app.all('*', function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Content-Type,Content-Length, Authorization, Accept,X-Requested-With");
  res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
  res.header("X-Powered-By", ' 3.2.1')
  next();
});

var router = express.Router({
  mergeParams: true, // 父级路由合并到子级路由
  caseSensitive: true, // 区分子路由中的大小写
  strict: true // 区分 /mnemonic, /mnemonic/
});
app.use(express.static(path.join(__dirname, 'assets')));

app.use(router);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

let $urlhaolaiwu = "https://www.iqiyi.com/dianying_new/i_list_haolaiwu.html";
// var html = "";
// router.get('/', (req, res, next) => {
//   res.render('idenx', {title: '简单的爬虫'});
//   next();
// })

router.get('/add', (req, res) => {
  // res.json('12');
  // return;
  superagent.get($urlhaolaiwu).end(function (err, html) {
    if (err) {
      return console.error(err);
    }

    let $ = cheerio.load(html.text);
    let movieArr = [], movieDetailArr = [], promiseArr = [], id = 0;
    dao.MAXID(function (__id) {
      id = __id;
      $('.site-piclist > li').each(function (idx, element) {
        let $pic = $(element).find('.site-piclist_pic');
        let $info = $(element).find('.site-piclist_info');
        var movieSrc = $pic.find('img').attr('src');
        var movieTitle = $info.find('.site-title_score').find('.title').find('.site-piclist_info_title').find('a').text().trim();
        var movieUrl = $pic.find('a').attr('href');
        var movieScore = $info.find('.site-title_score > .score').text().trim();
        id++;
        (function (_id) {
          let p = new Promise((resolve, reject) => {
            superagent.get(movieUrl).end(function (err1, html1) {
              if (err1) {
                ;
              } else {
                let arrDetail = [];
                let $$ = cheerio.load(html1.text);
                let $block = $$('#block-L');
                let $lis = $block.find('.qy-play-side-introduction').find('.vInfoSide_cTop').find('ul').find('li');

                let o = { '导演：': '', '地区：': '', '类型：': '', '首映：': '' };
                let $lis1 = $$($lis[1]), $lis2 = $$($lis[2]), $lis3 = $$($lis[3]), $lis4 = $$($lis[4]);
                if ($lis1) o[$lis1.find('em').text()] = $lis1.find('span').text().trim();
                if ($lis2) o[$lis2.find('em').text()] = $lis2.find('span').text().trim();
                if ($lis3) o[$lis3.find('em').text()] = $lis3.find('span').text().trim();
                if ($lis4) o[$lis4.find('em').text()] = $lis4.find('span').text().trim();

                // 主演
                let star = $$('#block-F').attr('cast-list').trim();

                // 获取电影简介
                let introduceDom = $block.find('.vInfoSide_bot').find('.videoInfo_jj').find('div')[1];
                let introduce = $$(introduceDom).text().trim();
                // res.send(html1.text);
                // res.render($article);
                arrDetail.push(_id);
                arrDetail.push(o['导演：']);
                arrDetail.push(o['地区：']);
                arrDetail.push(o['类型：']);
                arrDetail.push(o['首映：']);
                arrDetail.push(star);
                arrDetail.push(introduce);

                movieDetailArr.push(arrDetail);
                resolve(movieDetailArr);
              }
            })
          })
          promiseArr.push(p);

        })(id);
        let arr = [];
        arr.push(id);
        arr.push(movieSrc);
        arr.push(movieTitle);
        arr.push(movieScore);
        arr.push(movieUrl);
        movieArr.push(arr);

      })
      dao.add('INSERT INTO info(id,imgUrl,title,score,vodUrl) VALUES ?', movieArr, (data) => {
        // res.json(data);
      });
      Promise.all(promiseArr).then(res2 => {
        dao.add('INSERT INTO detail(infoId,director,region,type,premiere,star,introduce) VALUES ?', movieDetailArr, (data) => {
          res.json(data);
        });
      })
    });

  })
})

// router.get('/addTest', (req, res) => {
//   var page = require('webpage').create();
//   phantom.outputEncoding = "gbk";//指定编码方式
//   page.open($urlhaolaiwu, function (status) {
//     if (status === "success") {
//       console.log(page.body);//输出网页
//     } else {
//       console.log("网页加载失败");
//     }
//     phantom.exit(0);//退出系统
//   });
// })

router.get('/getList', (req, res) => {
  // "SELECT COUNT(*) FROM movieInfo; SELECT * FROM movieInfo limit 0, 20",
  dao.select(req.query.page || 1, req.query.pagesize || 20, data => {
    res.json(data);
  })
})

router.get('/detail', (req, res) => {
  if (!req.query.id) {
    res.json({ code: '400' });
    return;
  }
  dao.detail(req.query.id, data => {
    res.json(data);
  })
})


app.listen(9090, function () {
  console.log('服务启动成功 - 9090');
})
