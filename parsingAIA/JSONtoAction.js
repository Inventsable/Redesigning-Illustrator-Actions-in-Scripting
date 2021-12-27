class JSONtoAction {
  raw = null;
  data = null;
  schema = null;
  value = "none";
  constructor(param) {
    // Realistically I should be validating this before touching it
    if (/string/i.test(param)) {
      if (isJSON(param)) {
        this.raw = JSON.parse(param);
        this.createSchema();
      }
    } else if (/object/i.test(param)) {
      this.raw = param;
      this.createSchema();
    }
  }
  get schema() {
    return this.createSchema();
  }
  get data() {
    return this.data;
  }
  createSchema() {
    let temp = this.raw;
    console.log("Hello world!");
  }
}

function isJSON(str) {
  try {
    str = JSON.parse(str);
    return true;
  } catch (err) {
    return false;
  }
}

function asciiToHex(input) {
  var output = "";
  for (var i = 0; i < input.toString().length; i++)
    output += input.toString().charCodeAt(i).toString(16);
  return output;
}
function asciiToDecimal(input) {
  return parseInt(asciiToHex(input), 16);
}

module.exports = JSONtoAction;
