#!/usr/bin/env -S deno run --allow-read
async function readApps() {
  const content = await Deno.readTextFile("apps.txt");
	return content
    .split("\n")
		.map((line) => line.trim())
    .filter(Boolean);
}
}


const a = await readApps()
console.log(a)
