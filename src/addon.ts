import {config} from "../package.json";
import hooks from "./hooks";
import {createZToolkit} from "./utils/ztoolkit";

class Addon {
	public data: {
		alive: boolean;
		config: typeof config;
		env: "development" | "production";
		initialized?: boolean;
		ztoolkit: ZToolkit;
		/** Fluent bundle over the plugin's FTL file (set by initLocale()). */
		locale?: {
			current: Localization;
		};
	};
	public hooks: typeof hooks;

	constructor() {
		this.data = {
			alive: true,
			config,
			env: __env__,
			initialized: false,
			ztoolkit: createZToolkit(),
		};
		this.hooks = hooks;
	}
}

export default Addon;
