# MVP Builder Landing Page — Copy Draft v1

---

## HERO SECTION

[Dark background, clean sans-serif font. Minimal layout — headline, subhead, CTA, nothing else competing for attention. This section should feel confident and sparse, like a developer's portfolio, not a marketing agency. Consider a subtle grid or code-editor-inspired background texture, but keep it understated.]

**Headline:**
Your MVP needs to survive success.

**Subhead:**
I build production-ready MVPs for founders — clean code, real security, scalable architecture. No hourly rate. I take equity, because I only build things I believe in.

**CTA Button:**
Let's talk about your idea →

[Below the CTA, a single trust line in smaller text:]
React · Node · PostgreSQL · 5+ years building production software

---

## SECTION 1: THE PROBLEM

[Transition to a slightly lighter background. Each of the three risks gets its own block/card. Use a red or amber accent color sparingly to signal "warning" without being aggressive. Small icons for each risk — a shield/lock for security, a chart trending up then crashing for scaling, a tangled knot or broken chain for technical debt.]

**Section Header:**
Vibe coding gets you a demo. It doesn't get you a product.

**Section Subhead:**
AI tools can generate a working app in minutes. But "working" and "ready for real users" are two very different things. Here's what happens when founders ship vibe-coded MVPs.

---

### Risk 1: Your users' data is exposed and you don't know it

[Shield/lock icon]

In July 2025, the Tea dating app — built to protect women's safety — leaked 72,000 private images and 13,000 government IDs because its Firebase database had zero authentication. The breach was traced back to AI-generated code that was never reviewed for security.

That's not an isolated case. Security researchers at Escape analyzed over 5,600 vibe-coded apps and found more than 2,000 vulnerabilities, 400+ exposed secrets, and 175 instances of leaked personal data including medical records and bank account numbers.

AI code generators don't think about security. They produce code that works, not code that's safe. Hardcoded API keys, missing input validation, broken auth — these are the defaults, not the exceptions.

**Pullquote / Callout:**
"45% of AI-generated code contains an OWASP Top 10 vulnerability." — Veracode, 2025

---

### Risk 2: It breaks the moment it succeeds

[Chart/crash icon]

The worst time for your app to fail is when people start using it. But that's exactly what happens with vibe-coded MVPs that weren't built to handle real traffic.

One startup went from Vercel's $20/month Pro plan to a $700+ bill in a single month after a traffic spike — because AI-generated code wasn't optimized for serverless cost and Vercel doesn't hard-cap overages. Another founder watched their entire production database get deleted by their own AI coding assistant in Replit, which decided the database "needed a cleanup" — overriding a direct instruction not to modify anything.

AI doesn't understand your infrastructure. It generates code that runs, not code that scales. Unoptimized database queries, missing caching, bloated API calls — they're invisible at 10 users and catastrophic at 10,000.

**Pullquote / Callout:**
"It worked for a small dataset, but as soon as real-world traffic hit, the system slowed to a crawl." — CTO quoted in Addy Osmani's analysis of vibe coding failures

---

### Risk 3: Your first hire will want to rewrite everything

[Tangled knot icon]

Let's say your MVP works. Users love it. You raise a seed round. You hire your first engineer. They open the codebase and find:

- No consistent file structure
- Business logic scattered across components
- Hardcoded values everywhere
- No tests
- No documentation
- Dependencies that conflict with each other

That engineer is either going to quit or tell you they need 3 months to rewrite before they can ship a single feature. Your runway just got shorter.

One developer described their vibe-coded full-stack app as "held together with hard-coded duct tape" — pieces they couldn't extend and features they couldn't add without breaking everything. That's not a foundation. That's a liability.

**Pullquote / Callout:**
"Vibe coding creates an illusion of success — until the system begins to wobble under workloads." — Engineering leader quoted in Medium

---

## SECTION 2: THE SOLUTION

[Clean background shift — white or very light gray. This is the "relief" after the problem section. Your photo or a simple avatar could go here next to the text to make it personal. Keep it conversational.]

**Section Header:**
I build MVPs that your future team can actually work in.

**Body Copy:**

I'm a software engineer with 5+ years of experience building production applications in React, Node.js, and PostgreSQL. I've worked on teams, I've freelanced, and I know what it takes to build something that doesn't fall apart when real users show up.

Here's what I deliver:

**Clean, modular architecture** — Component structure, API design, and database schemas that make sense to the next developer who touches the code. No spaghetti, no duct tape.

**Security from day one** — Proper authentication, input validation, environment-based secrets management, and role-based access control. Not afterthoughts — defaults.

**Built to scale** — Optimized queries, proper caching strategies, and infrastructure choices that won't bankrupt you when traffic spikes. I've seen the Vercel horror stories. You won't be one of them.

**Tested and documented** — Enough test coverage and documentation that your first hire can onboard in days, not weeks.

---

## SECTION 3: THE EQUITY MODEL

[Same clean background. Maybe a simple two-column layout — the "how it works" on one side and a short FAQ-style list on the other.]

**Section Header:**
No invoices. No hourly rates. Aligned incentives.

**Body Copy:**

Instead of charging you money you probably don't have, I take a small equity stake — typically 5-10% depending on scope. That means:

**I only take on projects I believe in.** If I don't think your idea has legs, I'll tell you honestly and we'll part ways. No hard feelings.

**My incentives are aligned with yours.** I don't win unless you win. I'm not billing hours — I'm investing my time because I think what you're building matters.

**You keep your cash for what matters.** Spend your money on marketing, customers, and growth — not on dev invoices before you've made a dollar.

---

### Quick answers to what you're probably thinking:

**"10% is a lot."**
It might be, depending on scope. That's why it's a range — a weekend prototype is different from a 6-week build. We'll agree on terms that reflect the actual work.

**"What's included?"**
A working MVP with the features we agree on, deployed and ready for real users. We define scope together before anything starts.

**"What about ongoing work after launch?"**
The equity covers the initial build. If you need continued development after launch and before you can pay, we'll figure that out together — I'm flexible. Once revenue or funding comes in, we can talk about a paid engagement.

**"How is the equity structured?"**
Vesting schedule with a cliff, documented in a standard agreement. I'm not trying to surprise anyone — clean terms, just like the code.

---

## SECTION 4: THE INVESTOR ANGLE

[Subtle background shift — maybe a very light accent color block. Keep this section short. Could include a simple comparison visual: two side-by-side mockups of a pitch deck slide — one saying "Built on Lovable" and one saying "Technical co-founder, production codebase, CI/CD pipeline" — to make the point visually.]

**Section Header:**
Investors notice what's under the hood.

**Body Copy:**

When you sit down with a pre-seed or seed investor, one of the first questions is "who's building this?" A Lovable URL and a Cursor-generated codebase doesn't inspire confidence.

Having a technical partner on your cap table — someone who built a real product with proper architecture, security, and test coverage — signals that you're serious. It tells investors the product can scale, that you can hire engineers on top of it, and that the technical risk is managed.

I'm not just building your MVP. I'm giving you a technical story you can tell with confidence.

---

## SECTION 5: HOW IT WORKS

[Simple numbered steps — could be a horizontal timeline or vertical cards. Keep it visual but minimal. Each step gets a number, a short title, and one or two sentences.]

**Section Header:**
From idea to working product in four steps.

**Step 1: You pitch me your idea.**
Tell me what you're building and why. I want to understand the problem, the market, and why you're the right person to solve it.

**Step 2: I decide if I'm in.**
I'm selective — I take on 2-3 projects at a time. If I believe in what you're building, we move forward. If not, I'll be honest about why.

**Step 3: We define scope and terms.**
We agree on what the MVP includes, the equity split, vesting terms, and a timeline. Everything documented, nothing ambiguous.

**Step 4: I build. You launch.**
I deliver a working, deployed product with clean code, proper security, and documentation. You take it to users, investors, or both.

---

## FINAL CTA SECTION

[Dark background again to bookend with the hero. Same confident, minimal feel. Centered text, single CTA button, contact info below.]

**Headline:**
Ready to build something real?

**Subhead:**
I take on a handful of projects at a time. If you've got an idea worth building, let's talk.

**CTA Button:**
Let's talk about your idea →

[Below the button:]
Or email me directly: [your email]
[Optional: link to your GitHub, LinkedIn, or portfolio]

---

## DESIGN NOTES (General)

- **Overall feel:** Dark, minimal, developer-credible. Think Linear or Vercel's own marketing site (ironic, I know) — not a typical SaaS landing page with stock photos and gradient blobs. The design itself should signal "a real engineer made this."
- **Typography:** One clean sans-serif. Inter, Geist, or similar. Large headlines, comfortable body text size, generous line height.
- **Color palette:** Dark background (near-black or very dark navy), white text, one accent color for CTAs and highlights (a muted blue or green — nothing neon).
- **No stock photos.** If you use images at all, use screenshots of real code, architecture diagrams, or simple custom illustrations.
- **Motion:** Subtle fade-in-on-scroll for sections. Nothing flashy. The animations should feel like they're there for readability, not for show.
- **Mobile:** Single column, generous padding, sticky CTA button at bottom of viewport.
- **Social proof:** If you have testimonials or past project logos, add a small strip between the problem and solution sections. If not, skip it entirely — empty social proof is worse than none.