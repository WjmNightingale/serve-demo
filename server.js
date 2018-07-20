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
            var string = fs.readFileSync('./index.html', 'utf-8')
            var cookies = req.headers.cookie.split(';')
            var hash = {}
            for (var i = 0; i < cookies.length; i++) {
                var parts = cookies[i].split('=')
                var key = parts[0]
                var value = parts[1]
                hash[key] = value
            }
            var email = hash.sign_in_email || ''
            var users = JSON.parse(fs.readFileSync('./db/users','utf-8'))
            var foundUser
            for (var i = 0;i < users.length;i++) {
                if (users[i].email === email) {
                    foundUser = users[i]
                    break
                }
            }
            if (foundUser) {
                string = string.replace('__password__',foundUser.password)
            } else {
                string = string.replace('__password__','我不知道呢')
            }
            res.statusCode = 200
            res.setHeader('Content-Type','text/html;charset=utf-8')
            res.write(string)
            res.end()
            break
        case '/sign_up':
            if (method === 'GET') {
                var string = fs.readFileSync('./sign_up.html','utf-8')
                res.statusCode = 200
                res.setHeader('Content-Type','text/html;charset=utf-8')
                res.write(string)
                res.end()
            } else if (method === 'POST') {
                readBody(req).then((body) => {
                    var data = body.split('&')
                    var hash = createHash(data)
                    var {email,password,password_confirmation} = hash
                    if (email.indexOf('@') === -1) {
                        res.statusCode = 400
                        res.setHeader('Content-Type','application/json;charset=utf-8')
                        res.write(`{
                            "errors": {
                                "email": "email address is invalid"
                            }
                        }`)
                        res.end()
                    }
                    if (password !== password_confirmation) {
                        res.statusCode = 400
                        res.setHeader('Content-Type','application/json;charset=utf-8')
                        res.write({
                            "errors": {
                                "password": "password and password_conformation not equal!"
                            }
                        })
                        res.end()
                    }
                    var users = JSON.parse(fs.readFileSync('./db/users','utf-8')) || []
                    var inUse = false
                    for (var i = 0;i < users.length;i++) {
                        if (users[i].email = email) {
                            inUse = true
                            break
                        }
                        if (inUse) {
                            res.statusCode = 400
                            res.setHeader('Content-Type','application/json;charset=utf-8')
                            res.write(`{
                                "errors": {
                                    "email": "${email} has been used"
                                }
                            }`)
                            res.end()
                        } else {
                            users.push({
                                email: email,
                                password: password
                            })
                            var newUsers = JSON.stringify(users)
                            fs.writeFileSync('./db/users',newUsers)
                            res.statusCode = 200
                            res.end() 
                        }
                    }
                })
            }
            break
        case '/sign_in':
            if (method === 'GET') {
                var string = fs.readFileSync('./sign_in.html','utf-8')
                res.statusCode = 200
                res.setHeader('Content-Type','text/html;charset=utf-8')
                res.write(string)
                res.end()
            } else if (method === 'POST') {
                readBody(req).then((body) => {
                    var data = body.split('&')
                    var hash = createHash(data)
                    var {email,password} = hash
                    var users = JSON.parse(fs.readFileSync('./db/users','utf8')) || []
                    var found = false
                    for (var i = 0;i < user.length;i++) {
                        if (users[i].email === email && user[i].password === password) {
                            found = true
                            break
                        }
                    }
                    if (found) {
                        res.statusCode = 200
                        res.setHeader('Set-Cookie',`sign_in_email=${email}`)
                        res.end()
                    } else {
                        res.statusCode = 401
                        res.setHeader('Content-Type','application/json;charset=utf-8')
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
            res.setHeader('Content-Type','application/json;charset=utf-8')
            res.setHeader('Access-Control-Allow-Origin','http://10.8.8.42:8080')
            res.write(`{
                "title": {
                    "text": "折线图堆叠"
                },
                "tooltip": {
                    "trigger": "axis"
                },
                "legend": {
                    "data": ["http://localhost:8080/test.json","联盟广告","视频广告"]
                },
                "grid": {
                    "left": "3%",
                    "right": "4%",
                    "bottom": "5%",
                    "containLabel": true
                }
            }`)
            res.end()
            break
        case '/test.json':
            res.statusCode = 200
            res.setHeader('Content-Type','application/json;charset=utf-8')
            res.setHeader('Access-Control-Allow-Origin','http://10.8.8.42:8080')
            res.write(`{
                "object": {
                    "data": ["1","232","456"]
                }
            }`)
            res.end()
            break
        default:
            var string = fs.readFileSync('./default.html','utf-8')
            res.statusCode = 404
            res.setHeader('Content-Type','text/html;charset=utf-8')
            res.write(string)
            res.end()
            break
    }
})
server.listen(port)
console.log('监听 ' + port + ' 成功\n请用在空中转体720度然后用电饭煲打开 http://localhost:' + port)

function readBody(req) {
    return new Promise((resolve,reject) => {
        var body = []
        req.on('data',(chunk) => {
            body.push(chunk)
        }).on('end',() => {
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