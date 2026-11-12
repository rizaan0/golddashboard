import fs from "node:fs";

const raw = fs.readFileSync(
  "C:/Users/moham/.cursor/projects/c-CODES-GOLD-SHOP/agent-tools/83fa5fcd-a59b-418d-bba2-cca9cce5a44f.txt",
  "utf8",
);
const tree = JSON.parse(raw).tree.map((entry) => entry.path);
console.log(tree.filter((path) => path.startsWith("src/")).join("\n"));
