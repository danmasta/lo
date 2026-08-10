---
slug: /
sidebar_position: 1
sidebar_label: Welcome
---
# Welcome

Lo is a lightweight, modern utility library for **node**, **browser**, and **quickjs**, built on a small, fast nominal type system at its core

:::info
This site is currently under development, the API is not fully documented yet
:::

## Highlights

- **Unified iteration for every type** - One set of iteration interfaces spanning every JavaScript type (both sync and async, not just arrays and plain objects)
- **Batteries included** - Beyond identity, capabilities, and iteration, Lo ships common application-level helpers (env vars, argv parsing, LRU, string formatting, and more), which runtimes like quickjs don't provide out of the box
- **Comprehensive nominal typing** - A single nominal type system, with first-class support for every built-in type, that every other feature builds on
- **Runs everywhere, identically** - Every feature behaves the same across node, browser, and quickjs. The same architecture extends to other modern runtimes too: anything running standard ESM can use the node or browser build, and new targets only need their own platform bindings

To learn more about the design philosophy, see [About](./about.md)
