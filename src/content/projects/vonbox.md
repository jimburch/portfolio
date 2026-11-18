---
title: VonBox
# TODO(jim): confirm status
status: shipped
summary: An NFC reader that plays movies, with a parent-armed session timer run through Home Assistant.
order: 2
---

## What I wanted

An NFC reader that plays movies.

TODO(jim): who it's for and why you built it.

## How I built it

Version 2.0 added a **session timer**: a parent arms a countdown from the web app, Home Assistant owns the ticking clock, and the box shows the time left. It runs on wall-clock time, so pausing or switching movies never stops it.

When the timer hits zero the box goes into **lockout**: taps get friendly feedback instead of a movie. Lockout ends after an hour, or sooner if a parent clears it from the web app. Parents can also extend, cancel or end a session early.

TODO(jim): the hardware and software that make the box itself work.

## What broke

TODO(jim)

## How it turned out

TODO(jim)
