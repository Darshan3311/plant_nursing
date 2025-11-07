# Plant Nursery Backend

This project is a backend application for managing a plant nursery. It provides functionalities for user authentication, booking management, expense tracking, notifications, asset management, and nutrient logging.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [API Endpoints](#api-endpoints)
- [Environment Variables](#environment-variables)
- [Contributing](#contributing)
- [License](#license)

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/plant-nursery-backend.git
   ```

2. Navigate to the project directory:
   ```
   cd plant-nursery-backend
   ```

3. Install the dependencies:
   ```
   npm install
   ```

4. Set up your environment variables in a `.env` file based on the `.env.example` provided.

## Usage

To start the server, run:
```
npm start
```

The server will run on `http://localhost:3000` by default.

## API Endpoints

The following are the main API endpoints available in the application:

- **Authentication**
  - `POST /api/auth/login` - Login a user
  - `POST /api/auth/register` - Register a new user

- **User Management**
  - `GET /api/users` - Retrieve all users
  - `GET /api/users/:id` - Retrieve a user by ID

- **Booking Management**
  - `POST /api/bookings` - Create a new booking
  - `GET /api/bookings/:id` - Retrieve a booking by ID

- **Expense Management**
  - `POST /api/expenses` - Add a new expense
  - `GET /api/expenses` - Retrieve all expenses

- **Notification Management**
  - `POST /api/notifications` - Send a notification
  - `GET /api/notifications` - Retrieve all notifications

- **Asset Management**
  - `POST /api/assets` - Add a new asset
  - `GET /api/assets` - Retrieve all assets

- **Nutrient Management**
  - `POST /api/nutrients` - Log nutrient data
  - `GET /api/nutrients` - Retrieve nutrient logs

## Environment Variables

The following environment variables are required:

- `MONGODB_URI` - MongoDB connection string
- `CLOUDINARY_URL` - Cloudinary configuration (if using)
- `PORT` - Port for the server to run on (default is 3000)

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

This project is licensed under the MIT License. See the LICENSE file for details.