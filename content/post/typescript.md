---
title: "(Almost) everything I know about TypeScript"
type: post
date: 2025-09-22T20:15:04+02:00
excerpt: article in progress
url: 
canonical: true
shareImage:
twitterLink:
extraContent:
---


In this article I cover `unknown`, `any`, `never`, `keyof`, `typeof`, `as const`, TODO:

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
//   Error: ^ "hello"' is not assignable to parameter of type 'never'.
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
//    ^ Error: Cannot assign to 'name'
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

## satisfies

`satisfies` ensures an expression matches a type, but still has more specific type inference:

Example 1: The return type is inferred as `{ readonly fristName: "Alice"; }`, but there is a typo in `fristName`

```ts
const fn = () => {
  return { fristName: "Alice" } as const;
};
```

Example 2: The return type is not inferred, but the typo is caught. `firstName: string` is less precise than `firstName: "Alice"`

```ts
type MyType = { firstName: string }
const fn2 = (): MyType => {
  return { fristName: "Alice" } as const;
//          ^ Error: 'fristName' does not exist in type 'MyType'
};

const fn2NoTypo = (): MyType => {
  return { firstName: "Alice" } as const;
};

fn2NoTypo().firstName === "Bob" // compiler doesn't catch anything 🙁
```

Example 3: The return type is inferred with more precision than `MyType` _and_ the typo is caught

```ts
const fn3 = () => {
  return { fristName: "Alice" } as const satisfies MyType;
//          ^ Error: 'fristName' does not exist in type 'MyType'
};

// return type is inferred as `{ readonly firstName: "Alice"; }` 🎉
const fn3NoTypo = () => {
  return { firstName: "Alice" } as const satisfies MyType;
};

fn3NoTypo().firstName === "Bob" 
// ^ Error: '"Alice"' and '"Bob"' have no overlap
```

## Is it a good idea to assign types?

### Assigned types can deceive

`Promise<string>` and `Promise<any>` are not the same.

```ts
const fn = async (): Promise<string> => {
  const data = fetch("...").then((res) => res.json());

  return data; // Promise<any>
};
```

`string` and `never` are not the same.

```ts
const fn2 = (): string => {
  throw new Error("oops"); // returns never
};
```

`string | number` is not the same as string.

```ts
const fn3 = (): string | number => "hello";
const hello: string | number = "hello"
```

### Reasons for and against assigning types

If you want to ensure that each branch in a function returns the same type, you should provide a return type.

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
const fn4 = (): string => "string"
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

Assigning types prevent type inference which can lead to your types being less precise. (See [satisfies](#satisfies) above)

## Enums

Enums seem to have been a historical mistake and might be deprecated in the future.

TypeScript types are typically stripped away after it is compiled to JavaScript. This is not quite the case for enums.

```ts
// typescript
export enum AvailabilityEnum {
  AVAILABLE = "AVAILABLE",
  UNAVAILABLE = "UNAVAILABLE",
} 

// javascript
export var AvailabilityEnum;
(function (AvailabilityEnum) {
    AvailabilityEnum["AVAILABLE"] = "AVAILABLE";
    AvailabilityEnum["UNAVAILABLE"] = "UNAVAILABLE";
})(AvailabilityEnum || (AvailabilityEnum = {}));
```

There are better alternatives:

```ts
const availability = {
  AVAILABLE: "AVAILABLE",
  UNAVAILABLE: "UNAVAILABLE",
} as const 
```

or even simpler, which is also type safe and has auto completion:

```ts
type Availability = "AVAILABLE" | "UNAVAILABLE"
```

## Type narrowing in different scopes

In the following example, function 1 is not able to infer the type properly, but the second function is just fine.

```ts
const users = [{ name: "Alice" }, { name: "Bob" }];

const findUser = (searchParams: { name?: string }) => {
  if (searchParams.name) {
    return users.find((user) => {
      return user.name.includes(searchParams.name); 
//                               ^ Error: 'string | undefined' is not assignable to parameter of type 'string'
    })
  }
  return
};

const findUser2 = (searchParams: { name?: string }) => {
  return users.find((user) => searchParams.name && user.name.includes(searchParams.name))
};
```

The reason there is no type error in the second function is because the scope has changed to be within `find`.

## Additional properties are sometimes ok

TypeScript doesn't always throw an error if additional properties are passed to an object. If you wan to be sure that TypeScript checks for additional properties you have the following possibilities:

```ts
type Props = { a: string; b: number };

const fn = (props: Props) => {
  console.log(props)
};

// additional properties are allowed
const newLocal = { a: "hello", b: 1, c: "no error" };
fn(newLocal);

// props are inlined
fn({ a: "hello", b: 1, c: "error" });
//                     ^ Error: Object literal may only specify known properties

// props is assigned to Props
const props: Props = { a: "hello", b: 1, c: "error" };
//                                       ^ Error: Object literal may only specify known properties

// satisfies key word
const props2 = { a: "hello", b: 1, c: "error" } satisfies Props;
//                                    ^ Error: Object literal may only specify known properties
```

## Function overloads

The following function can be overloaded to allow/restrict certain arguments.

```ts
function greet(nameOrNames: string | string[], lastName?: string): string {
  if (Array.isArray(nameOrNames)) {
    return `Hello, ${nameOrNames.join(' and ')}!`;
  } else if (lastName) {
    return `Hello, ${nameOrNames} ${lastName}!`;
  } else {
    return `Hello, ${nameOrNames}!`;
  }
}

const names = greet(["Alice", "Bob", "Charlie"]);
const john = greet("John", "Doe");
const alice = greet("Alice");
const shouldBeInvalid = greet(["Alice", "Bob"], "Smith");
```

```ts
function greet(names: string[]): string;
function greet(firstName: string, lastName: string): string;
function greet(name: string): string;
function greet(nameOrNames: string | string[], lastName?: string): string {
  ...
}
```

One thing to watch out for: The implementation signature is not visible from the outside.

```ts
function fn(x: string): void;

function fn() {}

fn(); // Expected 1 arguments, but got 0
```

Solution: add another signature.

```ts
function fn2(x: string): void;
function fn2(): void;

function fn2() {}

fn2(); // ✅
```

## More resources

- [Utility Types](https://www.typescriptlang.org/docs/handbook/utility-types.html)
  - It's a good idea to get familiar with these








