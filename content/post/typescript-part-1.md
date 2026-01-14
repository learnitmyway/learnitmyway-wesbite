---
title: "TypeScript Fundamentals - Part 1"
type: post
date: 2025-10-05
excerpt: Master TypeScript basics including type annotations, interfaces, and type inference. This comprehensive guide covers everything you need to start writing type-safe code.
url: typescript-part-1
canonical: true
---

TypeScript has become the de facto standard for building large-scale JavaScript applications. This three-part series will take you from TypeScript fundamentals to advanced patterns used in production codebases.

## What is TypeScript?

TypeScript is a typed superset of JavaScript that compiles to plain JavaScript. It adds optional static typing, classes, and interfaces to JavaScript, helping you catch errors early and write more maintainable code.

### Why TypeScript?

**Catch Errors Early**: Type errors are caught at compile time, not runtime.

```typescript
function add(a: number, b: number): number {
  return a + b;
}

add(5, 10);        // ✓ OK
add("5", "10");    // ✗ Error: Argument of type 'string' is not assignable to parameter of type 'number'
```

**Better IDE Support**: IntelliSense, autocomplete, and refactoring tools work better with type information.

**Self-Documenting Code**: Types serve as inline documentation.

**Easier Refactoring**: The compiler helps you find all places that need updating when you change an interface.

## Setting Up TypeScript

```bash
# Install TypeScript globally
npm install -g typescript

# Check version
tsc --version

# Initialize a TypeScript project
mkdir my-ts-project && cd my-ts-project
tsc --init
```

This creates a `tsconfig.json` file with default compiler options.

## Basic Types

TypeScript provides several basic types for JavaScript values.

### Primitive Types

```typescript
// String
let name: string = "John";
name = "Jane";        // ✓ OK
// name = 42;         // ✗ Error

// Number
let age: number = 30;
age = 31;             // ✓ OK
// age = "thirty";    // ✗ Error

// Boolean
let isActive: boolean = true;
isActive = false;     // ✓ OK
// isActive = 1;      // ✗ Error

// Null and Undefined
let nothing: null = null;
let notDefined: undefined = undefined;
```

### Arrays

```typescript
// Array of numbers
let numbers: number[] = [1, 2, 3, 4, 5];
let moreNumbers: Array<number> = [6, 7, 8];

// Array of strings
let names: string[] = ["Alice", "Bob", "Charlie"];

// Mixed types (not recommended)
let mixed: any[] = [1, "two", true];
```

### Tuples

Tuples are arrays with fixed length and types.

```typescript
// Tuple: [string, number]
let person: [string, number] = ["John", 30];

console.log(person[0]); // "John"
console.log(person[1]); // 30

// person = [30, "John"];  // ✗ Error: wrong order
// person = ["John"];      // ✗ Error: missing element
```

### Enums

Enums allow you to define named constants.

```typescript
enum Color {
  Red,
  Green,
  Blue
}

let favoriteColor: Color = Color.Green;
console.log(favoriteColor); // 1

// String enums
enum Direction {
  Up = "UP",
  Down = "DOWN",
  Left = "LEFT",
  Right = "RIGHT"
}

let move: Direction = Direction.Up;
console.log(move); // "UP"
```

### Any and Unknown

```typescript
// Any: opt-out of type checking
let anything: any = 42;
anything = "string";
anything = true;

// Unknown: type-safe any
let uncertain: unknown = 42;
// uncertain.toFixed();  // ✗ Error: must type check first

if (typeof uncertain === "number") {
  uncertain.toFixed(2);  // ✓ OK
}
```

## Functions

TypeScript allows you to specify types for function parameters and return values.

### Function Declarations

```typescript
// Named function
function greet(name: string): string {
  return `Hello, ${name}!`;
}

// Arrow function
const add = (a: number, b: number): number => {
  return a + b;
};

// Implicit return type
const multiply = (a: number, b: number) => a * b;  // Returns number
```

### Optional Parameters

```typescript
function buildName(firstName: string, lastName?: string): string {
  if (lastName) {
    return `${firstName} ${lastName}`;
  }
  return firstName;
}

buildName("John");              // "John"
buildName("John", "Doe");       // "John Doe"
```

### Default Parameters

```typescript
function greet(name: string, greeting: string = "Hello"): string {
  return `${greeting}, ${name}!`;
}

greet("John");                  // "Hello, John!"
greet("John", "Hi");            // "Hi, John!"
```

### Rest Parameters

```typescript
function sum(...numbers: number[]): number {
  return numbers.reduce((total, n) => total + n, 0);
}

sum(1, 2, 3);           // 6
sum(1, 2, 3, 4, 5);     // 15
```

## Interfaces

Interfaces define the structure of objects.

### Basic Interface

```typescript
interface User {
  id: number;
  name: string;
  email: string;
}

const user: User = {
  id: 1,
  name: "John Doe",
  email: "john@example.com"
};
```

### Optional Properties

```typescript
interface User {
  id: number;
  name: string;
  email?: string;  // Optional
}

const user1: User = {
  id: 1,
  name: "John"
  // email is optional
};

const user2: User = {
  id: 2,
  name: "Jane",
  email: "jane@example.com"
};
```

### Readonly Properties

```typescript
interface Point {
  readonly x: number;
  readonly y: number;
}

const origin: Point = { x: 0, y: 0 };
// origin.x = 10;  // ✗ Error: Cannot assign to 'x' because it is a read-only property
```

### Function Types

```typescript
interface SearchFunc {
  (source: string, subString: string): boolean;
}

const search: SearchFunc = (source, sub) => {
  return source.includes(sub);
};

search("Hello World", "World");  // true
```

### Extending Interfaces

```typescript
interface Person {
  name: string;
  age: number;
}

interface Employee extends Person {
  employeeId: number;
  department: string;
}

const employee: Employee = {
  name: "John",
  age: 30,
  employeeId: 12345,
  department: "Engineering"
};
```

## Type Aliases

Type aliases create a new name for a type.

```typescript
type ID = string | number;

let userId: ID = "abc123";
userId = 12345;  // ✓ OK

// Object type
type User = {
  id: ID;
  name: string;
  email?: string;
};

const user: User = {
  id: 1,
  name: "John"
};
```

### Union Types

```typescript
type Status = "pending" | "approved" | "rejected";

let orderStatus: Status = "pending";
orderStatus = "approved";  // ✓ OK
// orderStatus = "cancelled";  // ✗ Error
```

### Intersection Types

```typescript
type Person = {
  name: string;
  age: number;
};

type Employee = {
  employeeId: number;
  department: string;
};

type EmployeePerson = Person & Employee;

const employee: EmployeePerson = {
  name: "John",
  age: 30,
  employeeId: 12345,
  department: "Engineering"
};
```

## Type Inference

TypeScript can infer types from context.

```typescript
// Type inferred as number
let count = 0;

// Type inferred as string
let message = "Hello";

// Type inferred as (a: number, b: number) => number
const add = (a: number, b: number) => a + b;

// Array type inferred as number[]
let numbers = [1, 2, 3, 4, 5];
```

## Type Assertions

Sometimes you know more about a type than TypeScript does.

```typescript
// Angle bracket syntax
let someValue: any = "this is a string";
let strLength: number = (<string>someValue).length;

// As syntax (preferred in TSX)
let anotherValue: any = "another string";
let anotherLength: number = (anotherValue as string).length;
```

## Classes

TypeScript adds types and access modifiers to ES6 classes.

### Basic Class

```typescript
class Person {
  name: string;
  age: number;

  constructor(name: string, age: number) {
    this.name = name;
    this.age = age;
  }

  greet(): string {
    return `Hi, I'm ${this.name}`;
  }
}

const person = new Person("John", 30);
console.log(person.greet());  // "Hi, I'm John"
```

### Access Modifiers

```typescript
class BankAccount {
  public accountNumber: string;
  private balance: number;
  protected owner: string;

  constructor(accountNumber: string, owner: string) {
    this.accountNumber = accountNumber;
    this.balance = 0;
    this.owner = owner;
  }

  public deposit(amount: number): void {
    this.balance += amount;
  }

  public getBalance(): number {
    return this.balance;
  }
}

const account = new BankAccount("123456", "John");
account.deposit(1000);
console.log(account.accountNumber);  // ✓ OK: public
// console.log(account.balance);     // ✗ Error: private
```

### Readonly Modifier

```typescript
class Point {
  readonly x: number;
  readonly y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
}

const point = new Point(10, 20);
// point.x = 15;  // ✗ Error: readonly
```

### Parameter Properties

Shorthand for declaring and initializing properties.

```typescript
class Person {
  constructor(
    public name: string,
    private age: number
  ) {}

  getAge(): number {
    return this.age;
  }
}

const person = new Person("John", 30);
console.log(person.name);      // ✓ OK
// console.log(person.age);    // ✗ Error: private
console.log(person.getAge());  // 30
```

## Working with null and undefined

TypeScript's `strictNullChecks` option helps prevent null reference errors.

```typescript
// With strictNullChecks: true

let name: string = "John";
// name = null;  // ✗ Error

let nullableName: string | null = "Jane";
nullableName = null;  // ✓ OK

// Null checking
function getLength(str: string | null): number {
  if (str === null) {
    return 0;
  }
  return str.length;
}
```

### Non-null Assertion Operator

```typescript
function processUser(user: User | null) {
  // I know user is not null here
  console.log(user!.name);
}
```

### Optional Chaining

```typescript
interface User {
  name: string;
  address?: {
    street: string;
    city: string;
  };
}

const user: User = { name: "John" };

// Safe property access
console.log(user.address?.city);  // undefined (no error)
```

### Nullish Coalescing

```typescript
const count: number | null = null;
const defaultCount = count ?? 10;  // 10

const zero = 0;
const value = zero ?? 10;  // 0 (not 10!)
```

## Next Steps

In Part 2, we'll cover:
- Generics and reusable type-safe code
- Advanced type manipulation
- Utility types
- Type guards and narrowing

## Summary

You've learned:
- ✅ Basic TypeScript types (string, number, boolean, etc.)
- ✅ Functions with type annotations
- ✅ Interfaces and type aliases
- ✅ Classes with access modifiers
- ✅ Handling null and undefined safely

TypeScript's type system helps you write more reliable code by catching errors at compile time. In the next article, we'll explore more advanced features that make TypeScript truly powerful.

## Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [TypeScript Playground](https://www.typescriptlang.org/play)
- [DefinitelyTyped](https://github.com/DefinitelyTyped/DefinitelyTyped) - Type definitions for JavaScript libraries

Continue to [Part 2: Generics and Advanced Types →](/typescript-part-2)
