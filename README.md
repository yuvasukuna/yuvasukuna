# YuvaSukuna · SaaS Explainer Motion Designer Portfolio

A premium, high-fidelity portfolio website built for **YuvaSukuna**, a freelance SaaS explainer motion designer.

## Tech Stack
* **Core**: HTML5, Vanilla JavaScript, CSS3
* **Background**: Interactive HTML5 Canvas space particle system with scroll parallax and mouse deflection forces
* **Configuration**: `vercel.json` optimized for Vercel deployment with security and media caching rules

## Key Features
* **Hover-to-Play Demos**: All SaaS explainer video previews auto-play on mouse hover and allow full unmuting with native controls on click.
* **Click-to-Burst Particles**: Satisfying interactive glass shapes on the Hero section trigger colorful particle explosions on the background canvas.
* **Responsive Design**: Designed using SF Pro typography with complete support for mobile, tablet, and desktop viewports.

## Deployment on Vercel
This repository is pre-configured and ready to be deployed on Vercel:
1. Go to [Vercel](https://vercel.com).
2. Click **Add New** > **Project**.
3. Import this GitHub repository.
4. Click **Deploy**. Vercel will automatically serve the static `index.html` at the root.

## Local Development
Since the project is built with static files, you can serve it locally using any static web server:
* **Ruby (macOS default)**: `ruby -r webrick -e "WEBrick::HTTPServer.new(:Port => 3000, :DocumentRoot => '.').start"`
* **Python**: `python3 -m http.server 3000`
* **Node.js**: `npx serve`
