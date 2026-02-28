import { defineConfig } from "vite";
import path from "node:path";

const r = (p: string) => path.resolve(__dirname, p);

export default defineConfig({
  root: "demo",
  resolve: {
    alias: [
      { find: /^@ficazam31\/pendulum$/, replacement: r("src/index.ts") },
      {
        find: "@ficazam31/pendulum/jsx-runtime",
        replacement: r("src/jsx-runtime.ts"),
      },
      {
        find: "@ficazam31/pendulum/jsx-dev-runtime",
        replacement: r("src/jsx-dev-runtime.ts"),
      },
    ],
  },
});
