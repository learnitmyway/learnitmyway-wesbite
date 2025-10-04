---
title: "TypeScript Advanced Patterns"
type: post
date: 2025-10-04
excerpt: Learn advanced TypeScript patterns including conditional types, mapped types, and template literal types. This comprehensive guide covers real-world use cases.
url: typescript-premium
canonical: true
courseId: "typescript-advanced"
isPremium: true
---

TypeScript has evolved significantly, offering powerful type system features that can help you write safer, more maintainable code. This guide introduces advanced patterns used in production codebases.

In this article, you'll learn:
- Conditional types and how to use them
- Mapped types for transforming existing types
- Template literal types for string manipulation
- Practical examples from real projects

<!--more-->

## Conditional Types

Conditional types allow you to create types that depend on a condition. They follow the pattern `T extends U ? X : Y`.

### Basic Example

```typescript
type IsString<T> = T extends string ? true : false;

type A = IsString<string>;  // true
type B = IsString<number>;  // false
```

### Real-World Use Case: Extract Return Type

```typescript
type ReturnTypeOf<T> = T extends (...args: any[]) => infer R ? R : never;

function getUser() {
  return { id: 1, name: "John" };
}

type User = ReturnTypeOf<typeof getUser>;  // { id: number; name: string }
```

## Mapped Types

Mapped types allow you to transform properties of existing types.

### Making All Properties Optional

```typescript
type Partial<T> = {
  [P in keyof T]?: T[P];
};

interface User {
  id: number;
  name: string;
  email: string;
}

type PartialUser = Partial<User>;
// { id?: number; name?: string; email?: string; }
```

### Creating Read-Only Versions

```typescript
type Readonly<T> = {
  readonly [P in keyof T]: T[P];
};

const user: Readonly<User> = {
  id: 1,
  name: "John",
  email: "john@example.com"
};

// user.id = 2; // Error: Cannot assign to 'id' because it is a read-only property
```

## Template Literal Types

TypeScript 4.1+ supports template literal types for string manipulation at the type level.

### Basic String Manipulation

```typescript
type Greeting = `Hello ${string}`;

const a: Greeting = "Hello World";  // ✓
const b: Greeting = "Hi World";     // ✗ Error
```

### Building API Route Types

```typescript
type HTTPMethod = "GET" | "POST" | "PUT" | "DELETE";
type Route = `/api/${string}`;

type APIEndpoint = `${HTTPMethod} ${Route}`;

const endpoint: APIEndpoint = "GET /api/users";  // ✓
```

### Real-World Example: CSS Properties

```typescript
type CSSProperty = 
  | "color"
  | "background-color"
  | "font-size"
  | "margin"
  | "padding";

type CSSVariableName = `--${CSSProperty}`;

const primaryColor: CSSVariableName = "--color";  // ✓
const bgColor: CSSVariableName = "--background-color";  // ✓
```

## Combining Patterns

The real power comes from combining these patterns together.

### Type-Safe Event Emitter

```typescript
type EventMap = {
  'user:login': { userId: string; timestamp: number };
  'user:logout': { userId: string };
  'data:update': { data: unknown };
};

type EventName = keyof EventMap;

class TypedEventEmitter {
  private listeners: {
    [K in EventName]?: Array<(data: EventMap[K]) => void>;
  } = {};

  on<K extends EventName>(
    event: K,
    callback: (data: EventMap[K]) => void
  ): void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event]!.push(callback);
  }

  emit<K extends EventName>(event: K, data: EventMap[K]): void {
    this.listeners[event]?.forEach(callback => callback(data));
  }
}

// Usage
const emitter = new TypedEventEmitter();

emitter.on('user:login', (data) => {
  console.log(data.userId);     // ✓ Type-safe!
  console.log(data.timestamp);  // ✓ Type-safe!
});

emitter.emit('user:login', {
  userId: "123",
  timestamp: Date.now()
});
```

### Building a Type-Safe Router

```typescript
type RouteParams<T extends string> = 
  T extends `${infer _Start}:${infer Param}/${infer Rest}`
    ? { [K in Param | keyof RouteParams<Rest>]: string }
    : T extends `${infer _Start}:${infer Param}`
    ? { [K in Param]: string }
    : {};

type Route1 = RouteParams<"/users/:userId/posts/:postId">;
// { userId: string; postId: string }

type Route2 = RouteParams<"/api/:version/users/:id">;
// { version: string; id: string }
```

## Performance Considerations

While these patterns are powerful, they can impact compilation times in large codebases.

### Tips for Better Performance

1. **Avoid deeply nested conditional types** - They can cause exponential compilation time
2. **Use type aliases** - Cache complex types in type aliases
3. **Limit recursive types** - TypeScript has recursion limits
4. **Profile your builds** - Use `tsc --diagnostics` to find slow types

### Example: Caching Complex Types

```typescript
// ❌ Slow: Computing on every use
type Result = ComplexType<DeepType<NestedType<T>>>;

// ✓ Better: Cache intermediate results
type IntermediateA = NestedType<T>;
type IntermediateB = DeepType<IntermediateA>;
type Result = ComplexType<IntermediateB>;
```

## Practical Project: Form Validation

Let's build a type-safe form validation system using these patterns.

```typescript
// Define form field types
type FormField = {
  value: string;
  error?: string;
  touched: boolean;
};

// Define form structure
type FormSchema = {
  [fieldName: string]: FormField;
};

// Extract field names as union type
type FieldNames<T extends FormSchema> = keyof T;

// Extract values type
type FormValues<T extends FormSchema> = {
  [K in keyof T]: T[K]['value'];
};

// Validation function type
type Validator<T extends FormSchema> = {
  [K in keyof T]?: (value: T[K]['value']) => string | undefined;
};

// Form hook implementation
function useForm<T extends FormSchema>(
  initialValues: FormValues<T>,
  validators: Validator<T>
) {
  // Implementation here...
  return {
    values: {} as FormValues<T>,
    errors: {} as Partial<Record<keyof T, string>>,
    handleChange: (field: keyof T, value: string) => {},
    handleSubmit: () => {}
  };
}

// Usage
const form = useForm(
  {
    email: '',
    password: '',
    confirmPassword: ''
  },
  {
    email: (value) => {
      if (!value.includes('@')) return 'Invalid email';
    },
    password: (value) => {
      if (value.length < 8) return 'Password too short';
    }
  }
);

// All type-safe!
form.handleChange('email', 'test@example.com');
// form.handleChange('unknown', 'value'); // ✗ Error
```

## Conclusion

Advanced TypeScript patterns enable you to build incredibly type-safe APIs that catch errors at compile time rather than runtime. The key is understanding:

1. **When to use each pattern** - Don't over-engineer simple code
2. **How to combine them effectively** - The real power is in composition
3. **Performance implications** - Balance type safety with build times

These patterns are used extensively in popular libraries like React, Vue, and tRPC. Understanding them will help you write better TypeScript and understand library source code.

## Resources

- [TypeScript Handbook - Advanced Types](https://www.typescriptlang.org/docs/handbook/2/types-from-types.html)
- [Type Challenges](https://github.com/type-challenges/type-challenges)
- [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/)

Happy typing! 🎉
