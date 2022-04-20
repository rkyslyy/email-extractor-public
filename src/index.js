const Express = require("express");
const BodyParser = require("body-parser");
const Miner = require("./miner");

const miner = new Miner();

miner.initialize().then(() => {
  console.log("Initialized browser.");
});

const app = Express();

app.use(BodyParser());

app.post("/mine-email", async (req, res) => {
  if (!miner.isReady) {
    res.send("Broser not ready");
    return;
  }

  const { linkedInUrl } = req.body;

  const email = await miner.mineEmailFromLinkedIn(linkedInUrl);

  res.send({ personalEmail: email });
});

app.post("/verify-account", async (req, res) => {
  const { verificationCode } = req.body;

  const result = await miner.verifyAccount(verificationCode);

  res.send({
    result,
  });
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Server is up, waiting for broser initialization...`);
});
