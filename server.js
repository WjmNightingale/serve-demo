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
            let string = fs.readFileSync('./index.html', 'utf-8')
            let cookies = req.headers.cookie.split(';')
            let hash = {}
            for (let i = 0; i < cookies.length; i++) {
                let parts = cookies[i].split('=')
                let key = parts[0]
                let value = parts[1]
                hash[key] = value
            }
            let email = hash.sign_in_email || ''
            let users = JSON.parse(fs.readFileSync('./db/users','utf-8'))
            let foundUser
            for (let i = 0;i < users.length;i++) {
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
                let string = fs.readFileSync('./sign_up.html','utf-8')
                res.statusCode = 200
                res.setHeader('Content-Type','text/html;charset=utf-8')
                res.write(string)
                res.end()
            } else if (method === 'POST') {
                readBody(req).then((body) => {
                    let data = body.split('&')
                    let hash = createHash(data)
                    let {email,password,password_confirmation} = hash
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
                    let users = JSON.parse(fs.readFileSync('./db/users','utf-8')) || []
                    let inUse = false
                    for (let i = 0;i < users.length;i++) {
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
                            let newUsers = JSON.stringify(users)
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
                let string = fs.readFileSync('./sign_in.html','utf-8')
                res.statusCode = 200
                res.setHeader('Content-Type','text/html;charset=utf-8')
                res.write(string)
                res.end()
            } else if (method === 'POST') {
                readBody(req).then((body) => {
                    let data = body.split('&')
                    let hash = createHash(data)
                    let {email,password} = hash
                    let users = JSON.parse(fs.readFileSync('./db/users','utf8')) || []
                    let found = false
                    for (let i = 0;i < user.length;i++) {
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
            res.setHeader('Content-Type','text/json;charset=utf-8')
            res.write(`{
                "story": {
                    "chapter": {
                        "title": [
                            'title1',
                            'title2',
                            'title3'
                        ],
                        "chapterUrls": [
                            'http://story.pro/story/chapter1',
                            'http://story.pro/story/chapter2',
                            'http://story.pro/story/chapter3',
                        ]
                    }
                }
            }`)
            res.end()
            break
        default:
            break
    }
})

function readBody(req) {
    return new Promise((resolve,reject) => {
        let body = []
        req.on('data',(chunk) => {
            body.push(chunk)
        }).on('end',() => {
            body = Buffer.concat(body).toString()
            resolve(body)
        })
    })
}

function createHash(array) {
    let obj = {}
    array.forEach((item) => {
        let parts = item.split('=')
        let key = parts[0]
        let value = parts[1]
        obj[key] = decodeURIComponent(value)
    })
    return obj
}