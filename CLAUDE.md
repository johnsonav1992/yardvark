In general, follow all of the ways things have been done in this repo so far. A couple specific notes, though:

1. No comments unless they are jsdoc comments or they are VERY NEEDED inline comments.
2. Make sure there is an empty line before and after all if blocks or if/else, etc.
3. Follow modern angular principles - don't use old stuff like angular decorators, non-signal properties, etc.
4. Avoid rxjs if possible and use signals and resources. only use rxjs if it's very specifically needed.
5. Always ask questions before you implement something you are unsure of.
6. Always use the tools in this repo, like primeng, date-fns, etc. Don't do made-up stuff unless there isn't already a tool or util already there for you to use. And even then, make sure to put new utils/tools/types in appropriate places, not randomly somewhere.
7. When writing code in .ts files, be sure to always put empty lines before and after multi-line blocks of code. And then always include empty lines before return statements of fns. The exception to this is you may put a multiline block of code at the beginning of the function without an empty line above it since it is the beginning of the fn.
8. All class properties in FE or BE should have access modifiers
9. No empty lines between html elements or blocks in html files
10. We use real types, anys are never allowed for any reason. Pun intended.
