const path = require("path");
const fs = require("fs");
const ActionToJSON = require("./actionToJSON");
const JSONtoAction = require("./jsonToAction");

async function test() {
  let actionPath = path.resolve("./parsing/actionToJSON/input.aia");
  let actionData = await readFile(actionPath);

  // Test and write from AIA to JSON:
  let result = new ActionToJSON(actionData);
  makeFile(
    path.resolve("./parsing/actionToJSON/schemaInput.json"),
    JSON.stringify(result.data, null, 2)
  );
  makeFile(
    path.resolve("./parsing/actionToJSON/schemaOutput.json"),
    JSON.stringify(result.schema, null, 2)
  );
  makeFile(
    path.resolve("./parsing/actionToJSON/output.json"),
    JSON.stringify(result.value, null, 2)
  );

  // Test newly created JSON back to AIA:
  let aiaText = new JSONtoAction(JSON.stringify(result.value));
  makeFile(path.resolve("./parsing/jsonToAction/output.aia"), aiaText.value);
}
test();
console.log("Done");

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
