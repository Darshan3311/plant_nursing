module.exports = {
    PORT: process.env.PORT || 3000,
    MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/plant-nursery',
    JWT_SECRET: process.env.JWT_SECRET || 'your_jwt_secret',
    CLOUDINARY_URL: process.env.CLOUDINARY_URL || 'your_cloudinary_url',
    NODE_ENV: process.env.NODE_ENV || 'development'
};