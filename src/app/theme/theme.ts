import { definePreset } from "@primeuix/themes";
import Aura from "@primeuix/themes/aura";

export const theme = definePreset(Aura, {
	semantic: {
		primary: {
			50: "{lime.50}",
			100: "{lime.100}",
			200: "{lime.200}",
			300: "{lime.300}",
			400: "{lime.400}",
			500: "{lime.500}",
			600: "{lime.600}",
			700: "{lime.700}",
			800: "{lime.800}",
			900: "{lime.900}",
			950: "{lime.950}",
		},
	},
	components: {
		card: {
			root: {
				shadow: "2px 2px 6px 0 rgba(0, 0, 0, 0.2)",
			},
		},
	},
});
