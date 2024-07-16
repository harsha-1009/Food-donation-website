const express=require('express');
const cors=require("cors");
const bodyParser=require("body-parser");
const mongoose=require('mongoose');
mongoose.set('strictQuery', false);
//const userRoute =require("./routes/User_route");


const app=express();
//middleware
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(bodyParser.json({limit:"30mb",extended :true}));
app.use(bodyParser.urlencoded({limit:"30mb",extended :true}));
app.use(cors());

//initialise db

require('./initDB')();


////////////////
const ProductRoute =require('./routes/product_route')
const recordRoute =require("./routes/RecordRoute")
app.use('/products',ProductRoute);
app.use('/records',recordRoute)



// app.post('/api/search', async (req, res) => {
//   const { name } = req.body;

//   const results = await Product.find({ name: { $regex: name, $options: 'i' } });

//   res.send(results);
// });
////////////////////////////////////////////////


const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: true,
    default:"https://pixlok.com/wp-content/uploads/2021/03/default-user-profile-picture.jpg"
  },
  address: {
    type: String,
    default:""
  },
  bio: {
    type: String,
    default:""
  },
  age: {
    type: String,
    default:""
  },
  about: {
    type: String,
    default:""
  },
  insta: {
    type: String,
    default:""
  },
  linkedin: {
    type: String,
    default:""
  },
  twitter: {
    type: String,
    default:""
  }
})

const User = new mongoose.model("User", userSchema)

//Routes
app.post("/login", (req, res)=> {
  const { email, password} = req.body
  User.findOne({ email: email}, (err, user) => {
      if(user){
          if(password === user.password ) {
              res.send({message: "Login Successfull", user: user})
          } else {
              res.send({ message: "Password didn't match"})
          }
      } else {
          res.send({message: "User not registered"})
      }
  })
}) 

app.post("/register", (req, res)=> {
  const { name, email, password,image} = req.body
  User.findOne({email: email}, (err, user) => {
      if(user){
          res.send({message: "User already registerd",flag:true})
      } else {
          const user = new User({
              name,
              email,
              password,
              image
              // address,
              // bio,
              // age,
              // about,
              // insta,
              // linkedin,
              // twitter            
          })
          user.save(err => {
              if(err) {
                  res.send(err)
              } else {
                  res.send({ message: "Successfully Registered, Please login now.",flag:true });
              }
          })
      }
  })
  
}) 
app.get("/register",async(req,res,next)=>{

  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
},)

app.get('/register/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    res.json(user);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.status(500).send('Server Error');
  }
});
app.get("/mailtoid/:email", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email });
    res.send(user._id);
  } catch (e) {
    res.status(400).send(e);
  }
});

//app.patch('/register/:id', async (req, res) => {
  
  //const updates = Object.keys(req.body);
  //'name', 'email', 'password','image',
  // const allowedUpdates = [ 'name','image','address','bio','age','about','insta','linkedin','twitter'];
  // const isValidOperation = updates.every((update) =>
  //   allowedUpdates.includes(update)
  // );

  // if (!isValidOperation) {
  //   return res.status(400).send({ error: 'Invalid updates!' });
  // }

  // try {
  //   const user = await User.findByIdAndUpdate(
  //     req.params.id,
  //     req.body,
  //     {
  //       new: true,
  //       runValidators: true,
  //     }
  //   );
    
  //   if (!user) {
  //     return res.status(404).send();
  //   }

  //   res.send(user);
  // } catch (e) {
  //   res.status(400).send(e);
  // }
//   try{
//     const id=req.params.id;
//     const updates=req.body
    

//     const result=await User.findByIdAndUpdate(id,updates);
//     if (!result) {
//           return res.status(404).send();
//         }
//    res.send(result);
//    return
//   }catch(error){
//     console.log(error.message)
//   }
// });


app.patch('/register/:id', async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ['name', 'email', 'password','image', 'address','bio','age','about','insta','linkedin','twitter'];
  const isValidOperation = updates.every((update) =>
    allowedUpdates.includes(update)
  );

  if (!isValidOperation) {
    return res.status(400).send({ error: 'Invalid updates!' });
  }

  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!user) {
      return res.status(404).send();
    }

    res.send(user);
  } catch (e) {
    res.status(400).send(e);
  }
});


app.use((req,res,next)=>{
  const err=new Error("Not Found");
  err.status=404
  next(err)
});
app.use((err,req,res,next)=>{
  res.status(err.status||500)
  res.send({
    error:{
      status:err.status|| 500,
      message:err.message
    }
  })
})

app.listen(5000,()=>{
console.log('server is started on port 5000....');
});