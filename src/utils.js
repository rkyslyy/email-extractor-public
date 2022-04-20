const waitABit = (delay) =>
  new Promise((res) => {
    setTimeout(() => {
      res();
    }, delay || 5000);
  });

module.exports = { waitABit };
