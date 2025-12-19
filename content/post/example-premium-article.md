---
title: "TypeScript Generics and Advanced Types - Part 2"
type: post
date: 2025-10-05
excerpt: Learn TypeScript generics, advanced type manipulation, utility types, and type guards. Build reusable, type-safe components and APIs.
url: typescript-part-2
canonical: true
premium: true
---

Welcome to Part 2 of our TypeScript series! In [Part 1](/typescript-part-1), we covered the fundamentals. Now we'll explore TypeScript's powerful advanced features that enable you to write truly reusable, type-safe code.

<div class="premium-content">

## Generics

Generics allow you to create reusable components that work with multiple types while maintaining type safety.

### Why Generics?

Without generics:

```typescript
function identity(arg: any): any {
  return arg;
}

let output = identity("hello");  // Type is 'any' - we lost type information
```

With generics:

```typescript
function identity<T>(arg: T): T {
  return arg;
}

let output = identity<string>("hello");  // Type is 'string'
let num = identity<number>(42);          // Type is 'number'

// Type inference
let auto = identity("hello");  // TypeScript infers type as 'string'
```

### Generic Functions

```typescript
function firstElement<T>(arr: T[]): T | undefined {
  return arr[0];
}

const numbers = [1, 2, 3];
const first = firstElement(numbers);  // Type is 'number | undefined'

const strings = ["a", "b", "c"];
const firstStr = firstElement(strings);  // Type is 'string | undefined'
```

### Multiple Type Parameters

```typescript
function pair<T, U>(first: T, second: U): [T, U] {
  return [first, second];
}

const result = pair("hello", 42);  // Type is [string, number]
const another = pair(true, "world");  // Type is [boolean, string]
```

### Generic Constraints

Restrict what types can be used with a generic.

```typescript
interface HasLength {
  length: number;
}

function logLength<T extends HasLength>(arg: T): T {
  console.log(arg.length);
  return arg;
}

logLength("hello");        // ✓ OK: string has length
logLength([1, 2, 3]);      // ✓ OK: array has length
// logLength(42);          // ✗ Error: number doesn't have length
```

### Using Type Parameters in Constraints

```typescript
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

const person = {
  name: "John",
  age: 30
};

const name = getProperty(person, "name");  // Type is 'string'
const age = getProperty(person, "age");    // Type is 'number'
// getProperty(person, "email");           // ✗ Error: "email" doesn't exist
```

### Generic Classes

```typescript
class Box<T> {
  private value: T;

  constructor(value: T) {
    this.value = value;
  }

  getValue(): T {
    return this.value;
  }

  setValue(value: T): void {
    this.value = value;
  }
}

const stringBox = new Box<string>("hello");
console.log(stringBox.getValue());  // "hello"

const numberBox = new Box<number>(42);
console.log(numberBox.getValue());  // 42
```

### Generic Interfaces

```typescript
interface Repository<T> {
  getById(id: string): T | undefined;
  getAll(): T[];
  create(item: T): T;
  update(id: string, item: T): T;
  delete(id: string): boolean;
}

interface User {
  id: string;
  name: string;
  email: string;
}

class UserRepository implements Repository<User> {
  private users: User[] = [];

  getById(id: string): User | undefined {
    return this.users.find(u => u.id === id);
  }

  getAll(): User[] {
    return this.users;
  }

  create(user: User): User {
    this.users.push(user);
    return user;
  }

  update(id: string, user: User): User {
    const index = this.users.findIndex(u => u.id === id);
    if (index >= 0) {
      this.users[index] = user;
    }
    return user;
  }

  delete(id: string): boolean {
    const index = this.users.findIndex(u => u.id === id);
    if (index >= 0) {
      this.users.splice(index, 1);
      return true;
    }
    return false;
  }
}
```

## Utility Types

TypeScript provides built-in utility types for common type transformations.

### Partial<T>

Makes all properties optional.

```typescript
interface User {
  id: number;
  name: string;
  email: string;
}

function updateUser(id: number, updates: Partial<User>) {
  // Can update any subset of properties
}

updateUser(1, { name: "John" });                    // ✓ OK
updateUser(2, { email: "john@example.com" });       // ✓ OK
updateUser(3, { name: "Jane", email: "jane@..." }); // ✓ OK
```

### Required<T>

Makes all properties required.

```typescript
interface Config {
  host?: string;
  port?: number;
}

const config: Required<Config> = {
  host: "localhost",  // Required now
  port: 3000          // Required now
};
```

### Readonly<T>

Makes all properties readonly.

```typescript
interface User {
  id: number;
  name: string;
}

const user: Readonly<User> = {
  id: 1,
  name: "John"
};

// user.name = "Jane";  // ✗ Error: readonly
```

### Pick<T, K>

Creates a type with only selected properties.

```typescript
interface User {
  id: number;
  name: string;
  email: string;
  password: string;
}

type UserPreview = Pick<User, "id" | "name">;
// Equivalent to: { id: number; name: string; }

const preview: UserPreview = {
  id: 1,
  name: "John"
};
```

### Omit<T, K>

Creates a type excluding specified properties.

```typescript
type UserWithoutPassword = Omit<User, "password">;
// Equivalent to: { id: number; name: string; email: string; }

const safeUser: UserWithoutPassword = {
  id: 1,
  name: "John",
  email: "john@example.com"
};
```

### Record<K, T>

Creates an object type with keys K and values T.

```typescript
type Role = "admin" | "user" | "guest";

type Permissions = Record<Role, string[]>;
// Equivalent to:
// {
//   admin: string[];
//   user: string[];
//   guest: string[];
// }

const permissions: Permissions = {
  admin: ["read", "write", "delete"],
  user: ["read", "write"],
  guest: ["read"]
};
```

### ReturnType<T>

Extracts the return type of a function.

```typescript
function getUser() {
  return {
    id: 1,
    name: "John",
    email: "john@example.com"
  };
}

type User = ReturnType<typeof getUser>;
// Type is: { id: number; name: string; email: string; }
```

### Parameters<T>

Extracts parameter types as a tuple.

```typescript
function createUser(name: string, age: number, email: string) {
  return { name, age, email };
}

type CreateUserParams = Parameters<typeof createUser>;
// Type is: [name: string, age: number, email: string]

const params: CreateUserParams = ["John", 30, "john@example.com"];
createUser(...params);
```

## Type Guards

Type guards help narrow down types within conditional blocks.

### typeof Guards

```typescript
function padLeft(value: string, padding: string | number) {
  if (typeof padding === "number") {
    return " ".repeat(padding) + value;
  }
  return padding + value;
}

padLeft("Hello", 4);      // "    Hello"
padLeft("Hello", ">>> "); // ">>> Hello"
```

### instanceof Guards

```typescript
class Dog {
  bark() {
    console.log("Woof!");
  }
}

class Cat {
  meow() {
    console.log("Meow!");
  }
}

function makeSound(animal: Dog | Cat) {
  if (animal instanceof Dog) {
    animal.bark();  // TypeScript knows it's a Dog
  } else {
    animal.meow();  // TypeScript knows it's a Cat
  }
}
```

### Custom Type Guards

```typescript
interface Fish {
  swim(): void;
}

interface Bird {
  fly(): void;
}

function isFish(animal: Fish | Bird): animal is Fish {
  return (animal as Fish).swim !== undefined;
}

function move(animal: Fish | Bird) {
  if (isFish(animal)) {
    animal.swim();  // TypeScript knows it's Fish
  } else {
    animal.fly();   // TypeScript knows it's Bird
  }
}
```

### Discriminated Unions

Use a common property to distinguish between types.

```typescript
interface Square {
  kind: "square";
  size: number;
}

interface Rectangle {
  kind: "rectangle";
  width: number;
  height: number;
}

interface Circle {
  kind: "circle";
  radius: number;
}

type Shape = Square | Rectangle | Circle;

function getArea(shape: Shape): number {
  switch (shape.kind) {
    case "square":
      return shape.size ** 2;  // TypeScript knows it's Square
    case "rectangle":
      return shape.width * shape.height;  // Rectangle
    case "circle":
      return Math.PI * shape.radius ** 2;  // Circle
  }
}
```

## Mapped Types

Create new types by transforming properties of existing types.

### Basic Mapped Type

```typescript
type Readonly<T> = {
  readonly [P in keyof T]: T[P];
};

type Optional<T> = {
  [P in keyof T]?: T[P];
};

interface User {
  id: number;
  name: string;
}

type ReadonlyUser = Readonly<User>;
// { readonly id: number; readonly name: string; }

type OptionalUser = Optional<User>;
// { id?: number; name?: string; }
```

### Adding Modifiers

```typescript
type Mutable<T> = {
  -readonly [P in keyof T]: T[P];
};

type Required<T> = {
  [P in keyof T]-?: T[P];
};
```

### Key Remapping

```typescript
type Getters<T> = {
  [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K];
};

interface Person {
  name: string;
  age: number;
}

type PersonGetters = Getters<Person>;
// {
//   getName: () => string;
//   getAge: () => number;
// }
```

## Conditional Types

Types that depend on a condition.

### Basic Conditional Type

```typescript
type IsString<T> = T extends string ? true : false;

type A = IsString<string>;  // true
type B = IsString<number>;  // false
```

### Nested Conditional Types

```typescript
type TypeName<T> =
  T extends string ? "string" :
  T extends number ? "number" :
  T extends boolean ? "boolean" :
  T extends undefined ? "undefined" :
  T extends Function ? "function" :
  "object";

type T0 = TypeName<string>;    // "string"
type T1 = TypeName<42>;        // "number"
type T2 = TypeName<true>;      // "boolean"
type T3 = TypeName<() => void>; // "function"
```

### Distributive Conditional Types

```typescript
type ToArray<T> = T extends any ? T[] : never;

type StrOrNum = string | number;
type Arrays = ToArray<StrOrNum>;  // string[] | number[]
```

### infer Keyword

Extract types from other types.

```typescript
type ReturnType<T> = T extends (...args: any[]) => infer R ? R : never;

function getUser() {
  return { id: 1, name: "John" };
}

type User = ReturnType<typeof getUser>;  // { id: number; name: string; }
```

## Practical Example: Type-Safe API Client

Let's build a type-safe API client using advanced TypeScript features.

```typescript
// Define API endpoints
interface Endpoints {
  "/users": {
    GET: { response: User[] };
    POST: { body: CreateUserDto; response: User };
  };
  "/users/:id": {
    GET: { response: User };
    PUT: { body: UpdateUserDto; response: User };
    DELETE: { response: void };
  };
  "/posts": {
    GET: { response: Post[] };
    POST: { body: CreatePostDto; response: Post };
  };
}

// Extract HTTP methods for a path
type Methods<Path extends keyof Endpoints> = keyof Endpoints[Path];

// Extract request body type
type RequestBody<
  Path extends keyof Endpoints,
  Method extends Methods<Path>
> = Endpoints[Path][Method] extends { body: infer B } ? B : never;

// Extract response type
type ResponseType<
  Path extends keyof Endpoints,
  Method extends Methods<Path>
> = Endpoints[Path][Method] extends { response: infer R } ? R : never;

// Type-safe API client
class ApiClient {
  async request<
    Path extends keyof Endpoints,
    Method extends Methods<Path>
  >(
    path: Path,
    method: Method,
    ...[body]: RequestBody<Path, Method> extends never 
      ? []
      : [RequestBody<Path, Method>]
  ): Promise<ResponseType<Path, Method>> {
    // Implementation
    return {} as any;
  }
}

// Usage is fully type-safe!
const client = new ApiClient();

// GET /users
const users = await client.request("/users", "GET");
// Type is User[]

// POST /users
const newUser = await client.request("/users", "POST", {
  name: "John",
  email: "john@example.com"
});
// Type is User

// Body is required and type-checked!
```

## Next Steps

In Part 3, we'll cover:
- Advanced patterns (Builder, Factory, etc.)
- TypeScript with React
- Performance optimization
- Best practices and common pitfalls

## Summary

You've learned:
- ✅ Generics for reusable type-safe code
- ✅ Built-in utility types (Partial, Pick, Omit, etc.)
- ✅ Type guards and narrowing
- ✅ Mapped and conditional types
- ✅ Building type-safe APIs

These advanced features enable you to build robust, maintainable applications with excellent type safety.

## Resources

- [TypeScript Handbook - Generics](https://www.typescriptlang.org/docs/handbook/2/generics.html)
- [TypeScript Handbook - Utility Types](https://www.typescriptlang.org/docs/handbook/utility-types.html)
- [Type Challenges](https://github.com/type-challenges/type-challenges)

← [Part 1: Fundamentals](/typescript-part-1) | Continue to [Part 3: Advanced Patterns →](/typescript-part-3)

</div>
