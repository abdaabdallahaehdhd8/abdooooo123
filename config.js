require("dotenv").config();

module.exports = {
    PASSWORD_MIN_LENGTH: 8,
    JWT_SECRET: process.env.JWT_SECRET || "your_jwt_secret",
    MONGO_URI: process.env.MONGO_URI || "mongodb://localhost:27017/YOUR_DATABASE"
};
