import { Request, Response } from "express";

import { getFile } from "@/util/getFile";
import { Octokit } from "@octokit/core";
import { restEndpointMethods } from "@octokit/plugin-rest-endpoint-methods";

export default class downloadRoute {
	async index(req: Request, res: Response): Promise<void> {
		const notFound = (): void => {
			return res
				.status(404)
				.json({
					success: false,
					message: "Release not found."
				})
				.end();
		};

		if (!req.params.codename || !req.params.version || !req.params.type) {
			return res
				.status(403)
				.json({
					success: false,
					error: "No information provided."
				})
				.end();
		}

		const codename = req.params.codename,
			MyOctokit = Octokit.plugin(restEndpointMethods),
			octokit = new MyOctokit(),
			deviceData = await getFile("devices", `${codename}.json`);

		if (req.params.version === "latest") {
			const latestVersion = deviceData.latestVersion;
			req.params.version = latestVersion;
		}

		try {
			const response = await octokit.rest.repos.getReleaseByTag({
				owner: "dotOS-downloads",
				repo: codename.toLowerCase(),
				tag: req.params.version
			});

			if (req.query.debug === "dev" && process.env.NODE_ENV === "development")
				return res.json(response).end();

			switch (req.params.type) {
				case "vanilla":
					{
						const file = response.data.assets.find(asset =>
							asset.name.includes("OFFICIAL")
						);
						if (!file) return notFound();

						return res.redirect(file.browser_download_url);
					}
					break;
				case "gapps":
					{
						const file = response.data.assets.find(asset =>
							asset.name.includes("GAPPS")
						);
						if (!file) return notFound();

						return res.redirect(file.browser_download_url);
					}
					break;
				case "boot":
					{
						const file = response.data.assets.find(
							asset =>
								asset.name.includes("boot") && asset.name.includes(".img")
						);
						if (!file) return notFound();

						return res.redirect(file.browser_download_url);
					}
					break;
				case "recovery":
					{
						const file = response.data.assets.find(
							asset =>
								asset.name.includes("recovery") && asset.name.includes(".img")
						);
						if (!file) return notFound();

						return res.redirect(file.browser_download_url);
					}
					break;
				default:
					{
						return notFound();
					}
					break;
			}
		} catch (e) {
			return notFound();
		}
	}
}

export const downloadRouter = new downloadRoute();
