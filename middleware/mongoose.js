import mongoose from "mongoose";

const connectDb = handler => async (req, res) => {
    if (mongoose.connections[0].readyState) {
        return handler(req, res);
    }
    
    // Use strictQuery false for Mongoose 7+ to suppress warnings
    mongoose.set("strictQuery", false);
    
    await mongoose.connect(process.env.MONGO_URI);
    return handler(req, res);
}

export default connectDb;