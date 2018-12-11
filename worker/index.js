const keys = require("./keys");
const redis = require("redis");

const redisClient = redis.createClient({
  host: keys.redisHost,
  port: keys.redisPort,
  retry_strategy: () => 1000,
  // if this client looses connection to redis then retry connecting once every 1 second
});

// sub stands for subscription
const sub = redisClient.duplicate();

function fib(index) {
  if (index < 2) return 1;
  return fib(index - 1) + fib(index - 2);
}

// anytime a new value shows up in Redis, we are going to calculate a new Fibonacci value
// then insert that into a hash called values, with the 'key' being the index value submitted by the user
// and value is the fibonacci value for that index
sub.on("message", (channel, message) => {
  redisClient.hset("values", message, fib(parseInt(message)));
});

// subscribe to anytime anyone adds a new value to Redis
sub.subscribe("insert");
