const express = require('express')
const cookieParser = require('cookie-parser')
const bodyparser=require('body-parser')
const cloudinary = require('cloudinary')
const fileUpload=require('express-fileupload')

const connectDB = require('./config/db')
const errorMiddleware=require('./middlewares/errors')


// connect database
connectDB();

const dotenv = require('dotenv')

//handle uncaught exceptions
process.on('uncaughtException',err =>{
    console.log(`ERROR: ${err.message}`);
    console.log('Shutting down the server due to uncaught Exception')
    process.exit(1)
})

//setting up config file
dotenv.config({ path: 'config/config.env' })

const app = express();

app.use(express.json({ extended: false }))
app.use(bodyparser.urlencoded({extended:true}))
app.use(cookieParser());
app.use(fileUpload())


app.get('/', (req,res) => res.send('API Runnning'))
// Define Route
app.use('/api/products', require('./routes/api/product'))
app.use('/api/auth', require('./routes/api/auth'))
app.use('/api/order', require('./routes/api/order'))

app.use(errorMiddleware)

// setting up cloudinary configuration
cloudinary.config({
    cloud_name : process.env.CLOUDINARY_CLOUD_NAME,
    api_key :  process.env.CLOUDINARY_API_KEY,
    api_secret :process.env.CLOUDINARY_API_SECRET
})

const PORT = process.env.PORT

const server = app.listen(PORT, () => console.log(`Server started on port ${PORT} in ${process.env.NODE_ENV} MODE.`))

//handle unhandled promise rejection
process.on('unhandledRejection',err =>{
    console.log(`ERROR: ${err.message}`);
    console.log('Shutting down the server due to Unhandled promise rejection')
    server.close(()=>{
        process.exit(1)
    })
})