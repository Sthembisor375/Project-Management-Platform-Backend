const mongoose = require("mongoose");

const connectDb = async () => {
  try {
    console.log("🔌 Attempting to connect to MongoDB...");
    console.log(
      "📡 Connection string:",
      process.env.CONNECTION_STRING ? "Configured" : "Missing"
    );

    if (!process.env.CONNECTION_STRING) {
      throw new Error("MongoDB connection string is not configured");
    }

    const connect = await mongoose.connect(process.env.CONNECTION_STRING, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log("✅ Database connected successfully!");
    console.log("🏠 Host:", connect.connection.host);
    console.log("📊 Database:", connect.connection.name);
    console.log("🔗 Ready state:", connect.connection.readyState);

    // Monitor connection events
    mongoose.connection.on("error", (err) => {
      console.error("💥 MongoDB connection error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("⚠️ MongoDB disconnected");
    });

    mongoose.connection.on("reconnected", () => {
      console.log("🔄 MongoDB reconnected");
    });
  } catch (err) {
    console.error("💥 Failed to connect to MongoDB:", {
      message: err.message,
      name: err.name,
      code: err.code,
      stack: err.stack,
    });

    if (err.name === "MongoNetworkError") {
      console.error(
        "🌐 Network error - Check your internet connection and MongoDB server status"
      );
    } else if (err.name === "MongoServerSelectionError") {
      console.error(
        "🎯 Server selection error - MongoDB server might be down or unreachable"
      );
    } else if (err.message.includes("ECONNREFUSED")) {
      console.error(
        "🚫 Connection refused - MongoDB server is not running or port is blocked"
      );
    }

    process.exit(1);
  }
};

module.exports = connectDb;
