const express = require('express')
const dotenv = require('dotenv')
const mongoose = require('mongoose')
const multer = require('multer')
const bcrypt = require('bcrypt')
const FileModel = require('./Models/FileModel')

dotenv.config()
var app = express()
app.use(express.urlencoded({extended : true})) // to parse the form data submitted by HTML form

mongoose.connect(process.env.DB_URL,{
    useNewUrlParser:true, 
    useUnifiedTopology: true
}).then(()=>console.log("DB connected successfully"))
.catch(err=>console.log(err))

app.set("view engine", "ejs")

app.get("/", (req,res)=>{
    res.render("index");
})

const upload = multer({dest : "uploads"})

app.post("/upload", upload.single("file"), async(req,res)=>{
    const fileData= {
        path : req.file.path,
        originalName : req.file.originalname
    }
    if(req.body.password != null && req.body.password !==''){
        fileData.password = await bcrypt.hash(req.body.password,10)
    }

    const file = await FileModel.create(fileData)
    res.render('index', {fileLink : `${req.headers.origin}/file/${file.id}`})
})

app.route("/file/:id").get(handleDownload).post(handleDownload)

async function handleDownload (req,res) {
    const file = await FileModel.findById(req.params.id)

    if(file.password != null){
        if(req.body.password == null){
            res.render('password')
            return
        }

        if(!( await bcrypt.compare(req.body.password, file.password)))
        {
            res.render('password',{error: true})
            return 
        }
    }
    file.downloadCount++
    await file.save()
    res.download(file.path, file.originalName)
}



app.listen(process.env.PORT, ()=>{
    console.log(`Server running on port ${process.env.PORT}`)
})