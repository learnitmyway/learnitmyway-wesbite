# Learn it my way

[![Netlify Status](https://api.netlify.com/api/v1/badges/1bd82c76-3450-45aa-b7b4-cf16ea67e647/deploy-status)](https://app.netlify.com/sites/learnitmyway/deploys)

[![Front‑End_Checklist followed](https://img.shields.io/badge/Front‑End_Checklist-followed-brightgreen.svg)](https://github.com/thedaviddias/Front-End-Checklist/)

This is the source code for [my website](https://www.learnitmyway.com).
[Hugo](https://gohugo.io/) is used as a static site generator and it is hosted by [Netlify](https://www.netlify.com/).
The layout and styles originate from the [Ananke](https://github.com/budparr/gohugo-theme-ananke) theme.

Have a look at [How I release updates to my personal website](https://www.learnitmyway.com/how-i-release-updates-to-my-personal-website/) for more information on the tools, processes and practices I use for releasing updates to this website.

## Local development

- `mise install`
- `brew install hugo` (ideally in sync with netlify.toml)
- `npm install`
- `make start`

### set up netlify

- `npm install -g netlify-cli`
- `netlify login`
- `netlify link`

### test netlify functions locally

- `netlify dev` starts the dev server
- `curl -v --data '' http://localhost:8888/.netlify/functions/...` 

## Stripe

- [Test cards](https://docs.stripe.com/testing#use-test-cards)

## Useful commands

- `hugo new post/my-first-post.md` adds a new post
- `make imagemin` minifies all images

## Content License

[CC BY-SA](http://creativecommons.org/licenses/by-sa/4.0/)

## Software License

[MIT](https://opensource.org/licenses/MIT)

## Disclaimers

- Licenses for Software that has been dealt in can be found in the Licenses directory