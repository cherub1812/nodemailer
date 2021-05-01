const mongoose = require('mongoose')
const config = require('config')
const db = config.get('mongoURI')

//mongooose.connect(db) will return promise

const connectDB = async () => {
    try {
        await mongoose.connect(db, {
            useUnifiedTopology: true,
            useNewUrlParser: true,
            useCreateIndex: true,
            useFindAndModify: false
        })

        console.log("Mongodb connected..")
    } catch (err) {
        console.error(err.message)
        // exit process with failure
        process.exit(1)
    }
}

module.exports = connectDB