import type { NextConfig } from "next";
import { execSync } from "child_process";

let gitHash = "dev";
let repoUrl = "";
try {
  gitHash = execSync("git rev-parse --short HEAD").toString().trim();
  const remote = execSync("git remote get-url origin").toString().trim();
  repoUrl = remote.replace(/\.git$/, "");
} catch {}

const nextConfig: NextConfig = {
  output: "export",
  env: {
    NEXT_PUBLIC_GIT_HASH: gitHash,
    NEXT_PUBLIC_REPO_URL: repoUrl,
    NEXT_PUBLIC_BUILD_TIME: new Date().toISOString().slice(0, 10).replace(/-/g, ""),
  },
};

export default nextConfig;
