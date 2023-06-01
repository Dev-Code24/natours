/* eslint-disable no-console */
const mongoose = require('mongoose');
const dotenv = require('dotenv');

//////
process.on('uncaughtException', (err) => {
  console.log(`UNCAUGHT EXCEPTION ....SHUTTING DOWN THE SERVER!!`);

  console.log(err);
  console.log(err.name, err.message);
  process.exit(1);
});
//////

dotenv.config({ path: './config.env' });
const app = require('./app');

const DB = process.env.DB.replace('<PASSWORD>', process.env.DB_PASSWORD);

mongoose
  .connect(DB, {
    useCreateIndex: true,
    useFindAndModify: true,
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log(`DB connected successfully`));

const port = process.env.PORT || 3000;

const server = app.listen(port, () => {
  console.log(`Running on ${port}..`);
});

process.on('unhandledRejection', (err) => {
  console.log(`UNHANDLED REJECTION....SHUTTING DOWN THE SERVER!!`);

  console.log(err.name, err.message);

  server.close(() => {
    process.exit(1);
  });
});
