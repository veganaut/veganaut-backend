monkey-tail
===========

This  is the backend to monkey-face. Together they're OperationMonkey, i.e.
they're going to be a gamified platform (website and phonegap app) helping the
international vegan/vegetarian movement to grow faster, be more effective and
include a more diverse range of people.

Please report issues to [monkey-face issues](https://github.com/OperationMonkey/monkey-face/issues).

See the [monkey-face README.md](https://github.com/OperationMonkey/monkey-face/blob/master/README.md)
for more instructions.


Developer information
---------------------

This repo comes with a git-commit hook to run jshint prior to commits. To
enable it, use the following commands after cloning.

    npm install  # Downloads required modules, including jshint
    (cd .git/ && rm -r hooks/ && ln -s ../git_hooks hooks)
