const express=require('express');
const cors=require('cors');
const MongoClient = require('mongodb').MongoClient;
const objectID=require('mongodb').ObjectId;
const app=express();
const jwt = require('jsonwebtoken');
require('dotenv').config();
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.lwdhb.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

app.use(cors());
app.use(express.json());

client.connect(err => {
    const blogsCollection = client.db("dailyblogsbd").collection("blogs");
    const adminsCollection = client.db("dailyblogsbd").collection("admins");
    if(err){
        console.log(err);
    }else{
        console.log('database connected');
    }
    app.get('/',(req,res)=>{
        res.send("Api is Working");
    })

    app.get('/blogs',(req,res)=>{
        blogsCollection.find({})
        .toArray((error,documents)=>{
            res.send(documents);
        })
    })

    app.post('/addblog',(req,res)=>{
        const blogData = req.body;
        blogsCollection.insertOne(blogData)
        .then(result=>res.send(result.insertedCount>0));
    })

    app.get('/blog/:id',(req,res)=>{
        const blogId = req.params.id;
        blogsCollection.find({_id:objectID(blogId)})
        .toArray((error,documents)=>{
            res.send(documents[0]);
        })
    })

    app.post('/updateblog',(req,res)=>{
        const updateData = req.body;
        blogsCollection.updateMany({_id:objectID(updateData._id)},{$set:{title:updateData.title,content:updateData.content,coverImg:updateData.coverImg}})
        .then(result=>res.send(result.modifiedCount > 0))
    })

    app.delete('/deleteblog/:id',(req,res)=>{
        const blogId=req.params.id;
        blogsCollection.deleteOne({_id:objectID(blogId)})
        .then(result=>res.send(result.deletedCount>0));
    })

    app.post('/login',(req,res)=>{
        const userData = req.body;
        adminsCollection.find({email:userData.email})
        .toArray((error,documents) => {
            if(documents[0]){
                const token = jwt.sign(userData,process.env.JWT_SECRET_KEY);
                res.send({authentication:true,jwtToken:token});
            }else{
                res.send({authentication:false,error:'something is wrong, Please Try Again.'})
            }
        })        
    })

    app.get('/verifyadmin',(req,res) => {
        const authentication = jwt.verify(req.headers.authorization,process.env.JWT_SECRET_KEY);
        adminsCollection.find({email:authentication.email})
        .toArray((error,documents) => {
            if(documents[0] && (documents[0].password === authentication.password)){
                res.send({authentication:true});
            }else{
                res.send({authentication:false})
            }
        })
    })

});


app.listen(process.env.PORT || 3001);
