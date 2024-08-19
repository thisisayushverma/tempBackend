import express from "express";
import multer from "multer";
import path from "path"
import fs from "fs"
// import {fluentFfmpeg as ffmpeg} from "fluent-ffmpeg";
// import ffmpeg from "ffmpeg";
import cookieParser from "cookie-parser";
import cors from "cors"
import mongoose from "mongoose";
import {v2 as cloudinary} from "cloudinary"
import { error, log } from "console";
import { exec } from "child_process";
import { stderr, stdout } from "process";
import { transcode } from "./transcoder.js";
import { transwav } from "./transToWav.js";

const otpSchema = new mongoose.Schema({
    email:String,
    otp:Number,
    createdAt:{
        type:Date,
        default:Date.now,
        index:{expires:'30s'}
    }
})

let Otpmodel = mongoose.model('Otpmodel',otpSchema)

const app = express()

// cloudinary for file upload

cloudinary.config({ 
    cloud_name: 'dpvnvk0ps', 
    api_key: '394373873542899', 
    api_secret: 'AaxjuMOCsHrDB9XGwOJN_iUKfuk' // Click 'View Credentials' below to copy your API secret
});


const uploadfile = async (localpath)=>{
    try {
        const uploadedfile = await cloudinary.uploader.upload(localpath,{
            resource_type:"auto"
        })
        console.log("file uploaded successfully",uploadedfile);
        // fs.unlinkSync(localpath)
        return uploadedfile

    } catch (error) {
        console.log(error);
    }
}


const storage = multer.diskStorage({
    destination:function(req,file,cb){
        cb(null,"uploads")
    }
    })

const upload = multer({storage})

const db = async()=>{
    try {
        const dbconn = await mongoose.connect(`mongodb+srv://ayush:kSgrQ9MJvm8xcSAB@cluster0.3brsfrh.mongodb.net/otp`)
        
        console.log("database connection is builded");
        
    } catch (error) {
        console.log(error,"connect issue with db");
        process.exit(1)
    }
}


app.use(cors({
    origin:'*',
    credentials:true
}))
app.use(express.json({
    limit : "16kb"
}))

app.use(express.urlencoded({
    extended:true
}))
app.use(express.urlencoded({extended:false}))
app.use(cookieParser())

app.set("view engine","ejs")
app.set("views",path.resolve("./views"))
app.use('/temp', express.static(path.join(process.cwd(), 'temp')));
db()


app.get('/hell',(req,res)=>{
    console.log("hello");
    return res.render("index")
})


app.post('/uploadaudio',upload.single('audioOne'),(req,res)=>{
    // console.log(req.file.mimetype);
    console.log(req.file); 
    // let allFile = fs.readdirSync('./uploads')
    // for(let fl in allFile) console.log(allFile[fl]);
    // console.log("new One");
    // fs.readdirSync('./uploads').forEach(file => {
    //     console.log(file);
    //   });
    // console.log(req.file.path);

    // const inputAudioPath =req.file?.path;
    const outputDir = `./temp/${req.file.filename}`;
    fs.mkdirSync(outputDir);
    (async ()=>{
        const transWavPromise = await transwav(req.file,'./wavaudio/')
        console.log("transwavpromise executed");
        const tempfile = fs.readdirSync(`./wavaudio/`)
        console.log("wav audio dir:-",tempfile);
        // const inputAud=fs.readFileSync(`wavaudio/${req.file.filename}`);
        // console.log(inputAud);
        const inputAud=`./wavaudio/${req.file.filename}`;
        const transHlsPromise = await transcode(inputAud,outputDir,'64k')
        console.log("transhlspromise executed");
    })();

    // await transwav(req.file,'./wavaudio/')
    

    
    // (async ()=>{
       
    // })();
    // await transcode(inputAud,outputDir,'64k')
    return res.render("index")
})

app.get('/getfiles',(req,res)=>{
    let allFile = fs.readdirSync('./temp')
    
    for(let fl in allFile) console.log(allFile[fl]);
    res.json(allFile)
})
app.post('/sendfile',upload.single('myfile'),(req,res)=>{
    // console.log(req.body.);
    console.log(req.file.path);

    const uploadedfile = uploadfile(req.file.path)

    
    return res.render('index')  

})

// app.get('/showfile',(req,res)=>{
    
// })


app.get('/audioplay',(req,res)=>{

    return res.render('audioplay')
})

app.get('/music/:name',(req,res)=>{
    // const file = fs.createReadStream(`./temp/${req.params.name}/output_64k/index.m3u8`)
    const audUrl = `/temp/${req.params.name}/output_64k/index.m3u8`

    res.setHeader('Content-Type','application/vnd.apple.mpegurl')
    return res.json({
        url:audUrl
    })
    
})


app.get('/inpcook',(req,res)=>{
    return res.cookie("cook","auishkicookie",{
        // httpOnly:true
        secure:true
    }).render('cookieinp')
})


app.get('/getcookie',(req,res)=>{
    // console.log(res.cookie('cook'));
    
    console.log(req.cookies.cook);
    req.cookies.cook="newcookieset"
    res.cookie('cook',"newcookieset",{
        secure:true,
        httpOnly:true
    })
        
    res.send("cookies will show in terminal")
})


app.post('/forgetpass', async (req,res)=>{

   

    const {email}=req.body
    console.log(email);
    const otp = Math.floor(Math.random()*1000000)
    console.log(otp);

    const checkUser = await Otpmodel.findOne({email:email})

    if(checkUser){
        await Otpmodel.findByIdAndUpdate(checkUser._id,{ $set:{otp:otp}})
        console.log("otp updated");
    }
    else{
        await Otpmodel.create({
            email:email,
            otp:otp
        })
        console.log("otp added");
    }
    // Otpmodel=null
    return res.status(200).json({
        success:true
    })
})

app.post('/checkotp',async(req,res)=>{
    const email= req.body.email
    const otp=req.body.otp

    try {
        const checkuser = await Otpmodel.findOne({email:email})
    
        if(checkuser){
            if(checkuser.otp==otp){
                await Otpmodel.findByIdAndDelete(checkuser._id)
                return res.status(400).json({
                    success:true
                })
            }
            else{
                return res.status(400).json({
                    success:true,
                    message:"otp is not valid"
                })
            }
        }
        else return res.status(400).json({
            success:false,
            message:"invalid user"
        })
    } catch (error) {
        console.log(error,"error occur while check otp");
    }
})


app.listen(4000,()=>{
    console.log("server is running on port 4000");
})




