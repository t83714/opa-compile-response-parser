# opa-compile-response-parser

[![GitHub stars](https://img.shields.io/github/stars/t83714/opa-compile-response-parser.svg?style=social&label=Star&maxAge=2592000)](https://github.com/t83714/opa-compile-response-parser)
[![npm version](https://img.shields.io/npm/v/opa-compile-response-parser.svg)](https://www.npmjs.com/package/opa-compile-response-parser)
[![unpkg](https://img.shields.io/badge/unpkg-latest-blue.svg)](https://unpkg.com/opa-compile-response-parser)
[![npm bundle size (minified + gzip)](https://img.shields.io/bundlephobia/minzip/opa-compile-response-parser.svg)](https://bundlephobia.com/result?p=opa-compile-response-parser)
[![Build Status](https://travis-ci.org/t83714/opa-compile-response-parser.svg?branch=master)](https://travis-ci.org/t83714/opa-compile-response-parser)

An Open Policy Agent Compile Response Parser

[Open Policy Agent](https://www.openpolicyagent.org/) provides a [compile API](https://www.openpolicyagent.org/docs/latest/rest-api/#compile-api) that allows you partially evaluate your policy. 

This library can parse the compile JSON response and allow you to access the [Rego](https://www.openpolicyagent.org/docs/latest/how-do-i-write-policies/#what-is-rego) AST (Abstract Syntax Tree) in the response body by Rego language structure.

Moreover, it further processes the AST to:
- eliminate tautological rules 
  - e.g. r { x; false } => false
- replace rule reference with inline value
  - e.g. r1 { r2 } r2 { true } => r1 { true } => true

### API document

https://t83714.github.io/opa-compile-response-parser/

### Examples

```typescript
import OpaCompileResponseParser from "opa-compile-response-parser";

const parser = new OpaCompileResponseParser();
parser.parse(jsonResponse);

const result = parser.evaluate();
/**
 returned evaluate result:
    interface CompleteRuleResult {
        fullName: string;
        name: string;
        value: RegoValue;
        isCompleteEvaluated: boolean;
        residualRules?: RegoRule[];
    }
*/

// --- Print residual rules as human readable string
console.log(parser.evaluateAsHumanReadableString());
```

#### More Examples

- [Simple OPA AST To SQL Translator](https://github.com/t83714/opa-compile-response-parser/blob/master/test/SimpleOpaSQLTranslator.ts)
- [Simple OPA AST To Elastic Search Query DSL Translator](https://github.com/t83714/opa-compile-response-parser/blob/master/test/SimpleOpaESTranslator.ts)

### Todo

- replace rule reference with inline rules

### Compatibility

Tested with Open Policy Agent version 0.37.2

