const keys = require("./keys");

// Express App Setup
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Postgres Client Setup
const { Pool } = require("pg");
const pgClient = new Pool({
  user: keys.pgUser,
  host: keys.pgHost,
  database: keys.pgDatabase,
  password: keys.pgPort,
  port: keys.pgPort,
});
pgClient.on("error", () => console.log("Lost PG connection"));

// Working with Postgres we need to have a table, so create a new table 'values' if it doesn't exists
// name of the table is 'values' and its going have a single column
// which is the index or the submitted value from the React front-end app..1,2,3,..8,...,21
pgClient
  .query("CREATE TABLE IF NOT EXISTS values (number INT)")
  .catch((err) => console.log(err));

// Redis Client setup
const redis = require("redis");
const redisClient = redis.createClient({
  host: keys.redisHost,
  port: keys.redisPort,
  retry_strategy: () => 1000,
  // if this client looses connection to redis then retry connecting once every 1 second
});
const redisPublisher = redisClient.duplicate();

// Express route handlers
app.get("/", (req, res) => {
  res.send("Hi");
});

app.get("/values/all", async (req, res) => {
  const values = await pgClient.query("SELECT * from values");

  res.send(values.rows);
});

app.get("/values/current", async (req, res) => {
  redisClient.hgetall("values", (err, values) => {
    res.send(values);
  });
});

app.post("/values", async (req, res) => {
  const index = req.body.index;

  if (parseInt(index) > 40) {
    return res.status(422).send("Index too high");
  }

  // eventually the 'worker' will come to the hash 'values' and
  // replace "Nothing yet!" with the actual calculated Fibonacci value
  redisClient.hset("values", index, "Nothing yet!");

  // this insert event is the message that gets sent to the worker process
  // its going to wake up the worker process and its time to pull out a new value from Redis
  // for calculating Fibonacci value for it
  redisPublisher.publish("insert", index);

  // Permanently store the user submitted index in Postgres
  pgClient.query("INSERT INTO values(number) VALUES($1)", [index]);

  res.send({ working: true });
});

app.listen(5000, (err) => {
  console.log("Listening");
});
