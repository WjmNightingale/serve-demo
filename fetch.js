// Example POST method implementation
postData('http://example.com/answer',{answer: 24})
    .then((data) => { 
        // JSON from `response.json()` call
        console.log(data)
    }).catch((error) => {
        console.log(error)
    })

function postData(url,data) {
    // Default options are marked with *
    return fetch(url,{
        body: JSON.stringify(data), // must match "Content-Type" header
        cache: 'no-cache', // *default,no-cache,reload,force-cache,only-if-cached
        credentials: 'same-origin',//include,same-origin,*omit
        headers: {
            'user-agent': 'Mozilla/4.0 MDN Example',
            'content-type': 'application/json'
        },
        method: 'POST', //*GET,POST,PUT,DELETE,etc.
        mode: 'cors', //no-cors,cors,*same-origin
        redirect: 'follow', //manual,*follow,error
        referrer: 'no-referrer', // *client,no-referrer
    }).then(response => response.json()) // parse response to json 
}
