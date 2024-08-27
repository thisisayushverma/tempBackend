import ffmpeg from "fluent-ffmpeg";
import { exec } from "child_process";
import ffmpegPath from "ffmpeg-static";
import path from "path";
import fs from "fs"
import { error } from "console";

ffmpeg.setFfmpegPath(ffmpegPath);

function transwav(inputfile , outputDir){
    return new Promise(function(resolve,reject){
        const inputAudioPath = inputfile.path;
        const outputSubDir = path.join(outputDir,`${inputfile.filename}`)
        console.log("output dir:-",outputSubDir);
        ffmpeg(inputAudioPath)
        .output(outputSubDir)
        .toFormat('wav')
        .on('start',()=>{
            console.log("conversion to wav is start");
        })
        .on('end',()=>{
            console.log("conversion is complete");
            const inputAud=fs.readFileSync(`wavaudio/${inputfile.filename}`);
            console.log(inputAud);
            resolve()
            // const tempfile = fs.readdirSync(`./wavaudio/`)
            // console.log(temexpfile);
        })
        .on('error',(error)=>{
            console.log("Error is:-",error);
        })
        .run()
        
       
    })
}

export {transwav};
