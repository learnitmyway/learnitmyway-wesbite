---
title: "TypeScript Crash Course - Part 1"
type: post
date: 2025-09-22T20:15:04+02:00
excerpt: article in progress
url: 
canonical: true
shareImage:
twitterLink:
extraContent:
---


In this article I cover `unknown`, `any`, `never`, when you should and shouldn't assign types, `keyof`, `typeof` and `as const`

<!--more-->
<!-- og:description -->

---
ARTICLE IN PROGRESS

---

## unknown, any, never

### unknown vs any

`unknown` is type safe, `any` has no typechecking.

```ts
const fn = (input: unknown) => {
    return input.hello
//          ^ Error: 'input' is of type 'unknown'
};

const fn2 = (input: any) => {
    return input.hello // no typechecking
};
```

### unknown vs never

Anything can be assigned to `unknown`, nothing can be assigned to `never` (except for `never`).

```ts
const fn3 = (input: unknown) => {};
fn3("hello") // all good

const fn4 = (input: never) => {};
fn4("hello")
//   ^ "hello"' is not assignable to parameter of type 'never'.
```

## Is it a good idea to assign types?

### Assigned types can deceive

`Promise<string>` and `Promise<any>` are not the same.

```ts
const f5 = async (): Promise<string> => {
  const data = fetch("...").then((res) => res.json());

  return data; // Promise<any>
};
```

`string` and `never` are not the same.

```ts
const fn6 = (): string => {
  throw new Error("oops"); // returns never
};
```

`string | number` is not the same as string.

```ts
const fn7 = (): string | number => "hello";
const hello: string | number = "hello"
```

### Reasons for and against assigning types

If you want to ensure that each branch in a function retunrs the same type, you should provide a return type.
```ts
type Fruit = "APPLE" | "BANANA";

type State = { isYellow: boolean };

const fn8 = (fruit: Fruit): State => {
  switch (fruit) {
    case "APPLE":
      return { isYellow: false };
    case "BANANA":
      return { isYellow: true };
  }
};
```
Assigned types need to be maintained. You might have to make the following function async. It's a pain to change `string` to `Promise<string>` all over your codebase.
```ts
const fn9 = (): string => "string"
```
Types can be hard to read. In the following example it's easier to read `Fruit | Vegetable` than `{ name: string; type: string; ... }[]`. 
```ts 
interface Fruit {
  name: string;
  type: "fruit";
  // a lot more properties
}

interface Vegetable {
  name: string;
  type: "vegetable";
  // a lot more properties
}

const apple: Fruit = { name: "apple", type: "fruit" }
const broccoli: Vegetable = { name: "broccoli", type: "vegetable" }

const fruitAndVeg = [apple, broccoli];
//     ^? (Fruit | Vegetable)[]
```

## keyof typeof

### keyof

If you have a object type and want a literal union of its keys.
```ts
type Obj = { name1: "Alice"; name2: "Bob" };
type Key = keyof Obj;
```

Or you have an object type and want its values.
```ts
type Obj2 = { name1: "Alice"; name2: "Bob" };
type Value = Obj2[keyof Obj2]; // "Alice" | "Bob"
```

### typeof

If you have an object and want to convert it to a type.
```ts
const obj3 = { name1: "Alice", name2: "Bob" };
type Obj3 = typeof obj3; // { name1: string; name2: string; }
```

If you have an array and want to convert it to a type.
```ts
const arr = ["Alice", "Bob"];
type Arr = typeof arr // string[]
```

### keyof typeof

If you have an object and want to know the type of each value.
```ts
const bio = {
  name: "Alice",
  age: 20,
}

type Bio = typeof bio; // { name: string; age: number; }
type bioValues = Bio[keyof Bio] // string | number
```

## as const

`as const` makes your variable readonly.
```ts
const readonlyAlice = { name: "Alice" } as const;

readonlyAlice.name = "Bob"
//    ^ Cannot assign to 'name'
```

`as const` also improves type precision. For example: "Bob" is more precise than "string".
```ts
const bob = { name: "Bob" };
type NameObj = (typeof bob) // { name: string; }
type aString = (NameObj)["name"]; // "string"

const readonlyBob = { name: "Bob" } as const;
type ReadonlyBob = typeof readonlyBob // { readonly name: "Bob"; }
type Bob = (ReadonlyBob)["name"]; // "Bob"
```
