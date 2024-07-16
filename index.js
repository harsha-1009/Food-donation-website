const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const app = express();
const JWT_SECRET = 'hhgzfiffaefIUZJFHCFHuHHiusfjhwufbsuiUYEuywiyriwriof';
const User = require('./Schemas/LoginSchema');
const FoodSchema = require('./Schemas/FoodSchema');
const RegisterSchema = require('./Schemas/RegisterSchema');

app.use(express.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(cors());
app.use((_req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', '*');
    next();
});
// connection to mongoose
mongoose.connect("mongodb://0.0.0.0:27017/food-donation")
    .then(() => {
        console.log("Connected to MongoDB");
    })
    .catch((e) => {
        console.log('failed' + e);
    })


//adding new User to database
app.post('/', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const saltRounds = 10;
        const salt = await bcrypt.genSalt(saltRounds);
        const hashedPassword = await bcrypt.hash(password, salt);
        const user = new User({
            name,
            email,
            password: hashedPassword
        });
        const savedUser = await user.save();
        res.send({ message: 'User registered successfully' });
    } catch (err) {
        res.status(400).send({ error: err.message });
    }
});


//login function
app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).send({ error: 'Invalid email or password' });
        }
        const passwordMatch = await bcrypt.compare(password, user.password);
        console.log(passwordMatch);
        if (!passwordMatch) {
            return res.status(401).send({ error: 'Invalid email or password' });
        }
        const jwtToken = createJwtToken(user);
        res.send({ token: jwtToken });
    } catch (err) {
        res.status(500).send({ error: err.message });
    }
});

// Helper function to create a JWT token for a user
function createJwtToken(user) {
    const jwtPayload = {
        id: user.id,
        email: user.email
    };
    const jwtOptions = {
        expiresIn: '1h'
    };
    return jwt.sign(jwtPayload, JWT_SECRET, jwtOptions);
}

//get request to send email to front end
app.get('/login/:id/email', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).send({ error: 'User not found' });
        }
        res.send({ email: user.email });
    } catch (err) {
        res.status(500).send({ error: 'Server error' });
    }
});

//logout function of a user
app.post('/logout', (req, res) => {
    res.clearCookie('jwt');
    res.send({ message: 'Logged out successfully' });
});






//adding the donated food
app.post('/donations', async (req, res) => {
    try {
        const food = new FoodSchema({
            name: req.body.name,
            contact: req.body.contact,
            items: req.body.items,
            quantity: req.body.quantity,
            address: req.body.address,
            description: req.body.description
        });
        await food.save();
        res.status(201).send('Order placed successfully');
    } catch (error) {
        console.error(error);
        res.status(500).send('Failed to place food');
    }
});

//deleteing already donated food
app.delete('/donations/:id', async (req, res) => {
    try {
        const result = await FoodSchema.deleteOne({ _id: req.params.id });
        if (result.deletedCount === 1) {
            res.send('Food donated successfully');
        } else {
            res.status(404).send('Food order not found');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Failed to retrive food order');
    }
});

//retriving donations from server
app.get('/donations', async (req, res) => {
    try {
        const donations = await FoodSchema.find();
        res.json(donations);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});



// adding trust Data
app.post('/trusts', async (req, res) => {
    const trust = new RegisterSchema(req.body);
    try {
        await trust.save();
        res.send(trust);
    } catch (error) {
        res.status(400).send(error);
    }
});

// retriving trust data from server
app.get('/trusts', async (req, res) => {
    try {
        const trusts = await RegisterSchema.find();
        res.json(trusts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

//sending an email to donator
app.post('/sendEmail', async (req, res) => {
  try {
    // Get the logged-in user's email
    const userEmail = req.user.email;

    // Create the email message with the data from the foodSchema
    const foodData = req.body;
    const message = `
      <p>Food Order Details:</p>
      <ul>
        <li>Name: ${foodData.name}</li>
        <li>Contact: ${foodData.contact}</li>
        <li>Items: ${foodData.items}</li>
        <li>Quantity: ${foodData.quantity}</li>
        <li>Address: ${foodData.address}</li>
        <li>Description: ${foodData.description}</li>
      </ul>
    `;

    // Create a nodemailer transporter object with your email service provider's SMTP details
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'fooddonation05@gmail.com',
        pass: 'food@123'
      }
    });
    // Send the email
    const mailOptions = {
      from: 'fooddonation05@gmail.com',
      to: userEmail,
      subject: 'Food Order Details',
      html: message
    };
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
        res.status(500).send({ error: 'Failed to send email' });
      } else {
        console.log('Email sent: ' + info.response);
        res.send({ message: 'Email sent successfully' });
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Failed to send email' });
  }
});




app.get('/', (req, res) => {
    res.send("hello world");
})

app.get('/donations', (req, res) => {
    res.send("donations");
})

app.listen(8000, () => {
    console.log("Connected to port 8000")
})

