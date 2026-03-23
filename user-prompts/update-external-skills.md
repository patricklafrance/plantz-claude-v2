Somehow, `pnpx skills update` only updates the global agent skills... so run those commands to update this project local skills...

pnpx skills add https://github.com/workleap/wl-web-configs --skill workleap-web-configs -a claude-code --full-depth -y
pnpx skills add https://github.com/workleap/wl-squide --skill workleap-squide -a claude-code --full-depth -y
pnpx skills add https://github.com/workleap/wl-web-configs --skill workleap-react-best-practices -a claude-code --full-depth -y
pnpx skills add https://github.com/addyosmani/web-quality-skills --skill accessibility -a claude-code -y
pnpx skills add https://github.com/antfu/skills --skill vitest -a claude-code -y
pnpx skills add https://github.com/antfu/skills --skill pnpm -a claude-code -y
pnpx skills add https://github.com/vercel/turborepo --skill turborepo -a claude-code -y
pnpx skills add https://github.com/anthropics/skills --skill frontend-design -a claude-code -y
pnpx skills add https://github.com/shadcn/ui --skill shadcn -a codex claude-code -y
pnpx skills add https://github.com/netlify/context-and-tools --skill netlify-cli-and-deploy -a codex claude-code -y
pnpx skills add https://github.com/antfu/skills --skill vite -a codex claude-code -y

pnpx skills add https://github.com/workleap/wl-web-configs --skill workleap-chromatic-best-practices -a codex --full-depth -y
pnpx skills add https://github.com/addyosmani/web-quality-skills --skill best-practices -a codex -y
pnpx skills add https://github.com/github/awesome-copilot --skill git-commit -a codex -y
pnpx skills add https://github.com/vercel-labs/agent-browser --skill agent-browser -a codex -y
