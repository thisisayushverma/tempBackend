const http = require('http')
const fs = require('fs')

const server = http.createServer((req,res)=>{

    console.log("hello server",req.url);

    
    if(req.url == "/temp"){
        const file  = fs.readFileSync("./samay.m4a")
        res.writeHead(200,{'content-type':"audio/mpeg"})
        res.end(file)
        // return res.render
    }

    if(req.url == "/chunk"){
        const file =  fs.createReadStream('textfl.txt')
        // res.writeHead(200,{'content-type':"audio/mpeg"})
        file.pipe(res)
    }
})

const PORT =5000
server.listen(PORT,()=> console.log("Server is running at 5000"))