import crypto from "node:crypto";
import readline from "node:readline";

const email = "dadifirmansyah8572@gmail.com";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const password = await new Promise(resolve =>
  rl.question("Rakaputra05@", resolve)
);

rl.close();

const salt = crypto.randomUUID();

const hash = crypto.pbkdf2Sync(
  password,
  salt,
  120000,
  32,
  "sha256"
).toString("hex");

console.log("\nEMAIL:");
console.log(email);
console.log("\nSALT:");
console.log(salt);
console.log("\nHASH:");
console.log(hash);