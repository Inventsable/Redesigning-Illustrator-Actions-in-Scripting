const path = require("path");
const fs = require("fs");

async function printAIA() {
  let input = path.resolve("./parsing/actionToJSON/input.aia");
  let data = await readFile(input);

  let output = path.resolve("./parsing/printed.json");
  makeFile(output, JSON.stringify(data));
  console.log("Printed to:", output);
}

printAIA();
async function readFile(targetPath, verbose = false) {
  return new Promise((resolve, reject) => {
    fs.readFile(path.resolve(targetPath), "utf-8", (err, data) => {
      if (err) reject(err);
      if (!verbose) resolve(data);
      let temp = {
        data: data,
        stats: fs.lstatSync(path.resolve(targetPath)),
      };
      resolve(temp);
    });
  });
}

function makeFile(targetPath, data, options = null) {
  return fs.writeFileSync(path.resolve(targetPath), data, options);
}
