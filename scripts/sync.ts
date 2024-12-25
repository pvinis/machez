#!/usr/bin/env -S deno run --allow-read --allow-env --allow-run

type AppConfig = {
	name: string
	home_paths: string[]
	xdg_config_paths: string[]
}

async function readApps() {
	const content = await Deno.readTextFile("apps.txt")
	const apps = content
		.split("\n")
		.map((line) => line.trim())
		.filter(Boolean)

	console.log({ apps })
	return apps
}

async function getConfig(app: string): Promise<AppConfig | null> {
	const configPath = `apps/${app}.json`
	if (!(await Deno.lstat(configPath))) {
		return null
	}

	try {
		const content = await Deno.readTextFile(configPath)
		return JSON.parse(content) as AppConfig
	} catch (error) {
		console.error(`Failed to parse config for ${app}:`, error)
		return null
	}
}

async function exists(path: string): Promise<boolean> {
	try {
		await Deno.lstat(path)
		return true
	} catch {
		return false
	}
}

async function addPath(path: string): Promise<void> {
	const homePath = Deno.env.get("HOME") || "~"
	const expandedPath = path.replace(/^~/, homePath)

	if (!(await exists(expandedPath))) {
		console.warn(`⚠️  Path does not exist: ${expandedPath}`)
		return
	}

	try {
		const command = new Deno.Command("chezmoi", {
			args: ["add", expandedPath],
		})

		const { success } = await command.output()

		if (success) {
			console.log(`✅ Added to chezmoi: ${expandedPath}`)
		} else {
			console.error(`❌ Failed to add: ${expandedPath}`)
		}
	} catch (error) {
		console.error(`❌ Error processing ${expandedPath}:`, error)
	}
}

async function processAppConfig(config: AppConfig): Promise<void> {
	if (!config) return

	const homePaths = config.home_paths.map((path) => `~/${path}`)
	const xdgPaths = config.xdg_config_paths.map((path) => `~/.config/${path}`)

	const allPaths = [...homePaths, ...xdgPaths]

	for (const path of allPaths) {
		await addPath(path)
	}
}

async function main() {
	const apps = await readApps()

	for (const app of apps) {
		const config = await getConfig(app)
		if (config) {
			console.log(`Processing config for ${app}...`)
			await processAppConfig(config)
		} else {
			console.warn(`No config found for ${app}`)
		}
	}
}

main()
