const mongoose = require("mongoose")

// Database connection function
const Connect_DB = async () => {
    try{
        await mongoose.connect(process.env.MONGO_URL);
        console.log("DATABASE CONNECTED");
    }catch(error){
        console.log(error);
    }
}

module.exports = Connect_DB;