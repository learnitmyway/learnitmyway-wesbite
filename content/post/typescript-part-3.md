---
title: "TypeScript Advanced Patterns and Best Practices - Part 3"
type: post
date: 2025-10-05
excerpt: Master advanced TypeScript patterns, React integration, performance optimization, and production-ready best practices. Complete your TypeScript journey.
url: typescript-part-3
canonical: true
---

Welcome to the final part of our TypeScript series! In [Part 1](/typescript-part-1) and [Part 2](/typescript-part-2), we covered fundamentals and advanced types. Now we'll explore real-world patterns, React integration, and best practices for production code.

## Design Patterns in TypeScript

### Builder Pattern

Build complex objects step by step with type safety.

```typescript
class User {
  constructor(
    public name: string,
    public email: string,
    public age?: number,
    public role?: string,
    public isActive?: boolean
  ) {}
}

class UserBuilder {
  private name?: string;
  private email?: string;
  private age?: number;
  private role?: string;
  private isActive?: boolean;

  setName(name: string): this {
    this.name = name;
    return this;
  }

  setEmail(email: string): this {
    this.email = email;
    return this;
  }

  setAge(age: number): this {
    this.age = age;
    return this;
  }

  setRole(role: string): this {
    this.role = role;
    return this;
  }

  setActive(isActive: boolean): this {
    this.isActive = isActive;
    return this;
  }

  build(): User {
    if (!this.name || !this.email) {
      throw new Error("Name and email are required");
    }
    return new User(
      this.name,
      this.email,
      this.age,
      this.role,
      this.isActive
    );
  }
}

// Usage
const user = new UserBuilder()
  .setName("John Doe")
  .setEmail("john@example.com")
  .setAge(30)
  .setRole("admin")
  .build();
```

### Factory Pattern

Create objects without specifying their exact classes.

```typescript
interface Logger {
  log(message: string): void;
}

class ConsoleLogger implements Logger {
  log(message: string): void {
    console.log(`[Console] ${message}`);
  }
}

class FileLogger implements Logger {
  constructor(private filename: string) {}

  log(message: string): void {
    // Write to file
    console.log(`[File: ${this.filename}] ${message}`);
  }
}

class RemoteLogger implements Logger {
  constructor(private endpoint: string) {}

  log(message: string): void {
    // Send to remote service
    console.log(`[Remote: ${this.endpoint}] ${message}`);
  }
}

type LoggerType = "console" | "file" | "remote";

class LoggerFactory {
  static createLogger(
    type: LoggerType,
    options?: { filename?: string; endpoint?: string }
  ): Logger {
    switch (type) {
      case "console":
        return new ConsoleLogger();
      case "file":
        if (!options?.filename) {
          throw new Error("Filename required for FileLogger");
        }
        return new FileLogger(options.filename);
      case "remote":
        if (!options?.endpoint) {
          throw new Error("Endpoint required for RemoteLogger");
        }
        return new RemoteLogger(options.endpoint);
    }
  }
}

// Usage
const logger = LoggerFactory.createLogger("file", { filename: "app.log" });
logger.log("Application started");
```

### Singleton Pattern

Ensure only one instance of a class exists.

```typescript
class Database {
  private static instance: Database;
  private connected: boolean = false;

  private constructor() {
    // Private constructor prevents instantiation
  }

  static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  connect(): void {
    if (!this.connected) {
      console.log("Connecting to database...");
      this.connected = true;
    }
  }

  query(sql: string): any[] {
    if (!this.connected) {
      throw new Error("Database not connected");
    }
    console.log(`Executing: ${sql}`);
    return [];
  }
}

// Usage
const db1 = Database.getInstance();
const db2 = Database.getInstance();

console.log(db1 === db2);  // true - same instance
```

### Observer Pattern

Notify multiple objects about state changes.

```typescript
interface Observer<T> {
  update(data: T): void;
}

class Observable<T> {
  private observers: Observer<T>[] = [];

  subscribe(observer: Observer<T>): void {
    this.observers.push(observer);
  }

  unsubscribe(observer: Observer<T>): void {
    const index = this.observers.indexOf(observer);
    if (index > -1) {
      this.observers.splice(index, 1);
    }
  }

  notify(data: T): void {
    this.observers.forEach(observer => observer.update(data));
  }
}

// Example: Stock price tracker
interface StockPrice {
  symbol: string;
  price: number;
}

class StockPriceDisplay implements Observer<StockPrice> {
  update(data: StockPrice): void {
    console.log(`Display: ${data.symbol} is now $${data.price}`);
  }
}

class StockPriceAlert implements Observer<StockPrice> {
  constructor(private threshold: number) {}

  update(data: StockPrice): void {
    if (data.price > this.threshold) {
      console.log(`Alert: ${data.symbol} exceeded $${this.threshold}!`);
    }
  }
}

// Usage
const stockTracker = new Observable<StockPrice>();

const display = new StockPriceDisplay();
const alert = new StockPriceAlert(150);

stockTracker.subscribe(display);
stockTracker.subscribe(alert);

stockTracker.notify({ symbol: "AAPL", price: 155 });
// Display: AAPL is now $155
// Alert: AAPL exceeded $150!
```

## TypeScript with React

### Function Components with TypeScript

```typescript
import React, { FC, ReactNode } from 'react';

interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  children?: ReactNode;
}

const Button: FC<ButtonProps> = ({
  label,
  onClick,
  variant = 'primary',
  disabled = false,
  children
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`btn btn-${variant}`}
    >
      {label}
      {children}
    </button>
  );
};

// Usage
<Button
  label="Click me"
  onClick={() => console.log('Clicked!')}
  variant="primary"
/>
```

### Generic Components

```typescript
interface ListProps<T> {
  items: T[];
  renderItem: (item: T) => ReactNode;
  keyExtractor: (item: T) => string;
}

function List<T>({ items, renderItem, keyExtractor }: ListProps<T>) {
  return (
    <ul>
      {items.map(item => (
        <li key={keyExtractor(item)}>
          {renderItem(item)}
        </li>
      ))}
    </ul>
  );
}

// Usage
interface User {
  id: string;
  name: string;
}

const users: User[] = [
  { id: '1', name: 'John' },
  { id: '2', name: 'Jane' }
];

<List
  items={users}
  renderItem={user => <span>{user.name}</span>}
  keyExtractor={user => user.id}
/>
```

### Hooks with TypeScript

```typescript
import { useState, useEffect, useCallback, useMemo } from 'react';

// useState with explicit type
const [count, setCount] = useState<number>(0);

// useState with type inference
const [name, setName] = useState("John");  // Type is string

// useState with union type
const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

// useEffect
useEffect(() => {
  // Effect logic
  return () => {
    // Cleanup
  };
}, []);

// useCallback
const handleClick = useCallback(() => {
  console.log('Clicked');
}, []);

// useMemo
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(count);
}, [count]);
```

### Custom Hooks

```typescript
interface UseFetchResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

function useFetch<T>(url: string): UseFetchResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(url);
      const json = await response.json();
      setData(json);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

// Usage
interface User {
  id: number;
  name: string;
}

function UserProfile() {
  const { data, loading, error } = useFetch<User>('/api/user/1');

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!data) return null;

  return <div>{data.name}</div>;
}
```

### Context with TypeScript

```typescript
import { createContext, useContext, FC, ReactNode } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  const login = async (email: string, password: string) => {
    // API call
    const user = await loginUser(email, password);
    setUser(user);
  };

  const logout = () => {
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    isAuthenticated: user !== null
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

// Usage
function LoginButton() {
  const { login, isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <div>Already logged in</div>;
  }

  return (
    <button onClick={() => login('user@example.com', 'password')}>
      Login
    </button>
  );
}
```

## Performance Optimization

### Avoid Type Computation in Loops

```typescript
// ❌ Bad: Complex type computed on every iteration
function processItems<T extends { id: string; data: any }>(items: T[]) {
  return items.map(item => ({
    ...item,
    processed: true
  }));
}

// ✓ Good: Type computed once
type ProcessedItem<T> = T & { processed: boolean };

function processItems<T extends { id: string; data: any }>(
  items: T[]
): ProcessedItem<T>[] {
  return items.map(item => ({
    ...item,
    processed: true
  }));
}
```

### Use Type Aliases for Complex Types

```typescript
// ❌ Bad: Repeated complex type
function handleResponse(
  data: { id: string; name: string } & { metadata: Record<string, any> }
) {}

function sendRequest(): Promise<
  { id: string; name: string } & { metadata: Record<string, any> }
> {
  return Promise.resolve({} as any);
}

// ✓ Good: Type alias
type ResponseData = { id: string; name: string } & { 
  metadata: Record<string, any> 
};

function handleResponse(data: ResponseData) {}

function sendRequest(): Promise<ResponseData> {
  return Promise.resolve({} as any);
}
```

### Limit Deep Recursion

```typescript
// ❌ Bad: Potentially infinite recursion
type DeepReadonly<T> = {
  readonly [P in keyof T]: DeepReadonly<T[P]>;
};

// ✓ Good: Limited depth
type DeepReadonly<T, Depth extends number = 5> = Depth extends 0
  ? T
  : {
      readonly [P in keyof T]: DeepReadonly<T[P], Prev<Depth>>;
    };

type Prev<N extends number> = N extends 5 ? 4
  : N extends 4 ? 3
  : N extends 3 ? 2
  : N extends 2 ? 1
  : 0;
```

## Best Practices

### Use Strict Mode

Enable all strict type checking in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true
  }
}
```

### Prefer Type Inference

```typescript
// ❌ Unnecessary explicit types
const name: string = "John";
const count: number = 0;
const isActive: boolean = true;

// ✓ Let TypeScript infer
const name = "John";
const count = 0;
const isActive = true;
```

### Use `unknown` Instead of `any`

```typescript
// ❌ Bad: any disables type checking
function process(value: any) {
  return value.toUpperCase();  // No error, but might fail at runtime
}

// ✓ Good: unknown requires type checking
function process(value: unknown) {
  if (typeof value === "string") {
    return value.toUpperCase();  // Type-safe
  }
  throw new Error("Value must be a string");
}
```

### Avoid Type Assertions

```typescript
// ❌ Bad: Type assertion can hide errors
const user = getUserData() as User;
user.email.toLowerCase();  // Might fail if email is undefined

// ✓ Good: Proper type checking
const user = getUserData();
if (user && user.email) {
  user.email.toLowerCase();
}
```

### Use Discriminated Unions for State

```typescript
// ❌ Bad: Independent booleans can be inconsistent
interface State {
  isLoading: boolean;
  isError: boolean;
  data?: User;
  error?: Error;
}

// ✓ Good: Discriminated union ensures consistency
type State =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: User }
  | { status: 'error'; error: Error };

function render(state: State) {
  switch (state.status) {
    case 'idle':
      return <div>Start fetching</div>;
    case 'loading':
      return <div>Loading...</div>;
    case 'success':
      return <div>{state.data.name}</div>;  // data is guaranteed to exist
    case 'error':
      return <div>{state.error.message}</div>;  // error is guaranteed to exist
  }
}
```

### Prefer Interfaces for Object Types

```typescript
// ✓ Interfaces can be extended and merged
interface User {
  id: string;
  name: string;
}

interface User {  // Declaration merging
  email: string;
}

// ✓ Type aliases for unions, tuples, and primitives
type Status = 'active' | 'inactive';
type Coordinates = [number, number];
type ID = string | number;
```

## Common Pitfalls

### Forgetting Return Types

```typescript
// ❌ Bad: Implicit any return type
function getUser(id) {
  return fetch(`/api/users/${id}`);
}

// ✓ Good: Explicit return type
async function getUser(id: string): Promise<User> {
  const response = await fetch(`/api/users/${id}`);
  return response.json();
}
```

### Not Handling Null/Undefined

```typescript
// ❌ Bad: Assumes value exists
function getLength(str: string | null) {
  return str.length;  // Error with strictNullChecks
}

// ✓ Good: Handle null case
function getLength(str: string | null): number {
  return str?.length ?? 0;
}
```

### Overusing Type Assertions

```typescript
// ❌ Bad: Suppressing type errors
const data = JSON.parse(jsonString) as User;

// ✓ Good: Validate with type guard
function isUser(obj: any): obj is User {
  return (
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    typeof obj.name === 'string'
  );
}

const data = JSON.parse(jsonString);
if (isUser(data)) {
  // data is User
}
```

## Tools and Resources

### Essential Tools

- **ESLint** with TypeScript plugin
- **Prettier** for formatting
- **ts-node** for running TypeScript directly
- **tsc-watch** for watch mode with hot reload

### Learning Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/)
- [Type Challenges](https://github.com/type-challenges/type-challenges)
- [Total TypeScript](https://www.totaltypescript.com/)

### Community

- [TypeScript Discord](https://discord.gg/typescript)
- [r/typescript](https://www.reddit.com/r/typescript/)
- [TypeScript Issues on GitHub](https://github.com/microsoft/TypeScript/issues)

## Conclusion

Congratulations on completing the TypeScript series! You've learned:

- ✅ **Part 1**: Fundamentals - types, interfaces, classes
- ✅ **Part 2**: Advanced types - generics, utility types, type guards
- ✅ **Part 3**: Real-world patterns and React integration

### Key Takeaways

1. **Enable strict mode** - Catch more errors at compile time
2. **Use type inference** - Let TypeScript do the work
3. **Prefer `unknown` over `any`** - Maintain type safety
4. **Use discriminated unions** - Model state accurately
5. **Write type guards** - Safely narrow types
6. **Leverage utility types** - Don't reinvent the wheel

TypeScript is a powerful tool that helps you write more maintainable, bug-free code. The learning curve is worth it - your future self (and teammates) will thank you!

Happy typing! 🎉

← [Part 2: Generics and Advanced Types](/typescript-part-2)
