var http = require('http')
var fs = require('fs')
var url = require('url')
var port = process.argv[2]

if (!port) {
    console.log('似不似傻？\nnode server.js 8080 不会吗')
    process.exit(1)
}

var server = http.createServer(function (req, res) {
    var pathWithQuery = req.url
    var parseUrl = url.parse(req.url, true)
    var queryString = ''
    if (pathWithQuery.indexOf('?') !== -1) {
        queryString = pathWithQuery.substring(pathWithQuery.indexOf('?'))
    }
    var method = req.method
    var path = parseUrl.pathname
    var query = parseUrl.query
    console.log('http请求方法', method)
    console.log('http请求路径', path)
    console.log('http请求参数', query)
    console.log('http请求路径?解析出来的参数', queryString)
    switch (path) {
        case '/':
        case '/index.html':
            var string = fs.readFileSync('./index.html', 'utf-8')
            var cookies = (req.headers.cookie || '').split(';')
            var hash = {}
            for (var i = 0; i < cookies.length; i++) {
                var parts = cookies[i].split('=')
                var key = parts[0]
                var value = parts[1]
                hash[key] = value
            }
            var email = hash.sign_in_email || ''
            var users = JSON.parse(fs.readFileSync('./db/users', 'utf-8'))
            var foundUser
            for (var i = 0; i < users.length; i++) {
                if (users[i].email === email) {
                    foundUser = users[i]
                    break
                }
            }
            if (foundUser) {
                string = string.replace('__password__', foundUser.password)
                string = string.replace('__display__', 'block')
            } else {
                string = string.replace('__password__', '我不知道呢')
                string = string.replace('__display__', 'none')
            }
            res.statusCode = 200
            res.setHeader('Content-Type', 'text/html;charset=utf-8')
            res.write(string)
            res.end()
            break
        case '/sign_up':
            if (method === 'GET') {
                var string = fs.readFileSync('./sign_up.html', 'utf-8')
                res.statusCode = 200
                res.setHeader('Content-Type', 'text/html;charset=utf-8')
                res.write(string)
                res.end()
            } else if (method === 'POST') {
                console.log('注册提交数据')
                readBody(req).then((body) => {
                    var data = body.split('&')
                    console.log(data)
                    var hash = createHash(data)
                    var {
                        email,
                        password,
                        password_confirmation
                    } = hash
                    console.log('hash--')
                    console.log(hash)
                    console.log('参数--')
                    console.log(email,password,password_confirmation)
                    if (email.indexOf('@') === -1) {
                        console.log('邮箱地址不合格')
                        res.statusCode = 400
                        res.setHeader('Content-Type', 'application/json;charset=utf-8')
                        res.write(`{
                            "errors": {
                                "email": "email address is invalid"
                            }
                        }`)
                        res.end()
                    }
                    if (password !== password_confirmation) {
                        console.log('密码不一致')
                        res.statusCode = 400
                        res.setHeader('Content-Type', 'application/json;charset=utf-8')
                        res.write({
                            "errors": {
                                "password": "password and password_conformation not equal!"
                            }
                        })
                        res.end()
                    }
                    var users = JSON.parse(fs.readFileSync('./db/users', 'utf-8')) || []
                    var inUse = false
                    console.log('数据库用户--')
                    console.log(users)
                    for (var i = 0; i < users.length; i++) {
                        if (users[i].email === email) {
                            inUse = true
                            break
                        }
                    }
                    if (inUse) {
                        console.log('邮箱已经被占用')
                        res.statusCode = 400
                        res.setHeader('Content-Type', 'application/json;charset=utf-8')
                        res.write(`{
                            "errors": {
                                "email": "${email} has been used"
                            }
                        }`)
                        res.end()
                    } else {
                        console.log('邮箱可以注册')
                        users.push({
                            email: email,
                            password: password
                        })
                        var newUsers = JSON.stringify(users)
                        fs.writeFileSync('./db/users', newUsers)
                        res.statusCode = 200
                        res.write(`{
                            "text": "Success!"
                        }`)
                        res.end()
                    }
                })
            }
            break;
        case '/sign_in':
            if (method === 'GET') {
                var string = fs.readFileSync('./sign_in.html', 'utf-8')
                res.statusCode = 200
                res.setHeader('Content-Type', 'text/html;charset=utf-8')
                res.write(string)
                res.end()
            } else if (method === 'POST') {
                readBody(req).then((body) => {
                    var data = body.split('&')
                    var hash = createHash(data)
                    var {
                        email,
                        password
                    } = hash
                    var users = JSON.parse(fs.readFileSync('./db/users', 'utf8')) || []
                    var found = false
                    console.log('参数--')
                    console.log(email,password)
                    console.log('用户--')
                    console.log(users)
                    for (var i = 0; i < users.length; i++) {
                        if (users[i].email === email && users[i].password === password) {
                            found = true
                            break
                        }
                    }
                    if (found) {
                        res.statusCode = 200
                        res.setHeader('Set-Cookie', `sign_in_email=${email}`)
                        res.end()
                    } else {
                        res.statusCode = 401
                        res.setHeader('Content-Type', 'application/json;charset=utf-8')
                        res.write(`{
                            "errors": {
                                "error": "signUp has been failed"
                            }
                        }`)
                        res.end()
                    }
                })
            }
            break
        case '/story.json':
            res.statusCode = 200
            res.setHeader('Content-Type', 'application/json;charset=utf-8')
            res.setHeader('Access-Control-Allow-Origin', '*')
            res.write(`{
                "heading": "我是故事标题",
                "chapterUrls": [
                        "http://localhost:8888/test1.json",
                        "http://localhost:8888/test2.json",
                        "http://localhost:8888/test3.json"
                ],
                "grid": {
                    "left": "3%",
                    "right": "4%",
                    "bottom": "5%",
                    "containLabel": true
                }
            }`)
            res.end()
            break
        case '/test1.json':
            res.statusCode = 200
            res.setHeader('Content-Type', 'application/json;charset=utf-8')
            res.setHeader('Access-Control-Allow-Origin', '*')
            res.write(`{
                "object": {
                    "data": "商博良？女人愣了一下，立刻回复了满是媚意春情的笑容，我们这里来来往往都是客人，风尘女子，恩客薄情，都是叫张公子李公子，有几个告诉我们真名哟？客人，你还真有意思，到楼子里来，不搂姑娘，却问个男人的名字。女人偎在我的身边，用丰腴松软的胸脯按摩着我的胳膊，拈起桌上的一枚葡萄放在我嘴边。我凝视着她指尖的豆蔻，艳得单薄而脆弱，像是随时都会剥落的旧漆皮。"
                }
            }`)
            res.end()
            break
        case '/test2.json':
            res.statusCode = 200
            res.setHeader('Content-Type', 'application/json;charset=utf-8')
            res.setHeader('Access-Control-Allow-Origin', '*')
            res.write(`{
                "object": {
                    "data": "雨，已经下了半个月，天像是漏了。高大的乔木在半空里支起深墨色的荫云，荫云外更是低压压的天空。雨滴噼里啪啦打在树叶上、附近的小池塘上，乱得让人心烦。偶尔传来啾啾的鸟叫，顺着看过去，会有一只全身翠绿的鸟儿展开双翅，悄无声息地滑翔进林间的黑暗。天地间唯一的光亮是那堆篝火，马帮的小伙子在篝火边拨弄着他的七弦琴。这样的天气，弦总是湿透的，弹起来嘣嘣作响，倒像是敲着一块中空的朽木。小伙子弹得是云州的调子，荒凉幽寒，丝丝缕缕的颤音。离得很远，一个年轻人坐在雨蓬下，抱着膝盖静静地听，雨蓬上的水滴打在他的睫毛上，他微微闭上眼睛，久久也不睁开。来一口？有人在一旁把烟锅递过去给他。年轻人睁开眼，看见那张焦黄的老脸。他认识那是马帮的帮副祁烈，一个宛州的行商。年轻人笑着摇了摇头：我不抽烟草。走云荒，不靠这口顶着，没准将来有湿病，祁烈也不再劝，自己盘腿坐在了年轻人的身边。"
                }
            }`)
            res.end()
            break
        case '/test3.json':
            res.statusCode = 200
            res.setHeader('Content-Type', 'application/json;charset=utf-8')
            res.setHeader('Access-Control-Allow-Origin', '*')
            res.write(`{
                "object": {
                    "data": "“嘿哟嘿，走山趟海光脚板嘞，遇山踩个山窟窿嘞，遇水就当洗泥脚嘞，撞到天顶不回头嘞！嘿哟嘿！”小黑嘹亮的歌声响彻云霄。马帮中的每个人都面带喜气。本以为这场大雨要下透整个雨季了，谁知道昨夜入睡时还是浓云满天，今天一早起来就看见万道阳光金线般的从云缝中透了下来。天晴是个好兆头，走得不会太辛苦，更不容易迷路。过了这片林子就到了黑泽，黑泽上唯一的村落是黑水铺，是虎山峒的村子，云荒路上的第一站。宛州的行商喜欢和黑水铺的巫民打交道，因为黑水铺算是深入云荒的必经之路，巫民见外人见得多了，也就开化一些，颇有几个会说东陆官话的人。"
                }
            }`)
            res.end()
            break
        default:
            var string = fs.readFileSync('./default.html', 'utf-8')
            res.statusCode = 404
            res.setHeader('Content-Type', 'text/html;charset=utf-8')
            res.write(string)
            res.end()
            break
    }
})
server.listen(port)
console.log('监听 ' + port + ' 成功\n请用在空中转体720度然后用电饭煲打开 http://localhost:' + port)

function readBody(req) {
    return new Promise((resolve, reject) => {
        var body = []
        req.on('data', (chunk) => {
            body.push(chunk)
        }).on('end', () => {
            body = Buffer.concat(body).toString()
            resolve(body)
        })
    })
}

function createHash(array) {
    var obj = {}
    array.forEach((item) => {
        var parts = item.split('=')
        var key = parts[0]
        var value = parts[1]
        obj[key] = decodeURIComponent(value)
    })
    return obj
}