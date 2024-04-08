# valtio-yjs-read-only 💊🚀

[![npm](https://img.shields.io/npm/v/valtio-yjs-read-only)](https://www.npmjs.com/package/valtio-yjs-read-only)
[![size](https://img.shields.io/bundlephobia/minzip/valtio-yjs-read-only)](https://bundlephobia.com/result?p=valtio-yjs-read-only)

valtio-yjs-read-only makes yjs states reading easy. 

## What is this

- [valtio](https://github.com/pmndrs/valtio) is
a proxy state library for ReactJS and VanillaJS.
- [yjs](https://github.com/yjs/yjs) is
an implementation of CRDT algorithm
(which allows to merge client data without server coordination).
- [valtio-yjs](https://github.com/valtiojs/valtio-yjs) is a two-way binding to bridge them.

valtio-yjs-read-only is a fork of valtio-yjs that makes the yjs documents read only.

## Project status

Please, check the original [valtio-yjs](https://github.com/valtiojs/valtio-yjs) project. 

We are following their versions and making them read only 🧐

## Install


```bash
npm install valtio-yjs-read-only valtio yjs
```
```bash
yarn add valtio-yjs-read-only valtio yjs
```
```bash
pnpm install valtio-yjs-read-only valtio yjs
```

## How to use it

```js
import * as Y from 'yjs';
import { proxy } from 'valtio';
import { bind } from 'valtio-yjs-read-only';

// create a new Y doc
const ydoc = new Y.Doc();

// create a Y map
const ymap = ydoc.getMap('mymap');

// create a valtio state
const state = proxy({});

// bind them
const unbind = bind(state, ymap);

// mutate the Y map
ymap.set('foo', 'bar');

// state is reactive to any mutations to "ymap"
console.log(state); // {foo: 'bar'}

// unbind them by calling the result
unbind();
```

## Demos

Take a look at how we are doing at the [Qwikens free Planning Poker](https://github.com/qwikens/planning-poker).
