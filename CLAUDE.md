In general, follow all of the ways things have been done in this repo so far. A couple specific notes, though:

1. No comments unless they are jsdoc comments or they are VERY NEEDED inline comments.
2. Make sure there is an empty line before and after all if blocks or if/else, etc.
3. Follow modern angular principles - don't use old stuff like angular decorators, non-signal properties, etc.
4. Avoid rxjs if possible and use signals and resources. only use rxjs if it's very specifically needed.
5. Always ask questions before you implement something you are unsure of.
6. Always use the tools in this repo, like primeng, date-fns, etc. Don't do made-up stuff unless there isn't already a tool or util already there for you to use. And even then, make sure to put new utils/tools/types in appropriate places, not randomly somewhere.
