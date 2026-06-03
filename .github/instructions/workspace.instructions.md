---
description: General workspace instructions for TypeScript files.
applyTo: 'src/**/*.ts'
---

<!-- Tip: Use /create-instructions in chat to generate content with agent assistance -->

Provide project context and coding guidelines that AI should follow when generating code, answering questions, or reviewing changes.

## Coding Guidelines

- **Strict TypeScript**: All TypeScript code must adhere to strict type checking. Avoid using `any` and ensure all variables and function returns have explicit types.
- **Security First**: Always implement with security in mind. If there is any ambiguity regarding security or any other implementation detail, prompt for clarification. Do not make assumptions.
- **No Hardcoded Secrets**: Never hardcode secrets, passwords, or other sensitive data directly in the code. Use environment variables and a configuration service.
- **Secure Storage**: Never store sensitive information like passwords or tokens in the database as plain text. Always use strong, one-way hashing algorithms (like bcrypt).
