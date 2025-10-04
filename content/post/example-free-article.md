---
title: "Example Free Article"
type: post
date: 2025-10-03
excerpt: This is a free article to show how the paywall system works.
url: example-free-article
canonical: true
courseId: "example-course"
isPremium: false
---

This is a completely free article. You can read all of it without any payment.

<!--more-->

## Full Content Available

This article demonstrates how non-premium content works in the paywall system.

### Features

- No paywall
- Full content visible
- No purchase required

You can create as many free articles as you want by setting `isPremium: false` or omitting it entirely.

## How to Create Premium Content

To make an article premium, add these fields to the front matter:

```yaml
isPremium: true
courseId: "your-course-id"
priceUSD: 29
```

That's it! The paywall will automatically appear for premium content.
