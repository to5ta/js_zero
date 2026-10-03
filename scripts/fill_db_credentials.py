#!/usr/bin/env python3
"""Fill the database credentials into the built PHP files.

Replaces the <db-server>, <db-user>, <db-pass> and <db-name> placeholders with
the values of the DB_SERVER, DB_USER, DB_PASSWORD and DB_NAME environment
variables.

This used to be four `sed -i "s|<db-x>|${{ secrets.DB_X }}|g"` calls per file.
Interpolating a secret into a command is brittle in two ways, and both of them
bit us: a trailing newline in a stored secret split the sed expression in half
and failed every deploy, and a `|`, `&` or backslash in a value would have been
read as sed syntax rather than as text. Here the values arrive through the
environment and are substituted literally, so no character in a credential can
change what the substitution does.

The placeholders sit inside single-quoted PHP strings, so a value also has to
survive that context: an apostrophe would otherwise close the literal early and
turn the rest of the credential into PHP source.
"""

import os
import sys

PLACEHOLDERS = {
    '<db-server>': 'DB_SERVER',
    '<db-user>': 'DB_USER',
    '<db-pass>': 'DB_PASSWORD',
    '<db-name>': 'DB_NAME',
}


BACKSLASH = chr(92)
APOSTROPHE = chr(39)


def escape_php_single_quoted(value):
    """Escape a value for insertion into a single-quoted PHP string.

    Inside '...' PHP gives a meaning to a backslash only before another
    backslash or before an apostrophe, so those two characters are the only
    ones needing an escape. Backslashes go first, otherwise the one added in
    front of an apostrophe would be escaped a second time.
    """
    return (value
            .replace(BACKSLASH, BACKSLASH * 2)
            .replace(APOSTROPHE, BACKSLASH + APOSTROPHE))


def read_credentials():
    """Map each placeholder to its escaped value, or exit naming what is unusable."""
    values = {}
    unset, empty = [], []

    for placeholder, variable in PLACEHOLDERS.items():
        raw = os.environ.get(variable)
        if raw is None:
            unset.append(variable)
            continue
        # Stored secrets routinely carry a trailing newline from being pasted.
        value = raw.strip()
        if not value:
            empty.append(variable)
            continue
        values[placeholder] = escape_php_single_quoted(value)

    problems = []
    if unset:
        problems.append(f'not set: {", ".join(unset)}')
    if empty:
        problems.append(f'empty: {", ".join(empty)}')
    if problems:
        sys.exit(f'Cannot fill credentials, {"; ".join(problems)}')

    return values


def fill(path, values):
    try:
        with open(path, encoding='utf-8') as handle:
            text = handle.read()
    except OSError as error:
        sys.exit(f'Cannot read {path}: {error}')

    filled = text
    for placeholder, value in values.items():
        filled = filled.replace(placeholder, value)

    # A surviving placeholder means the PHP file and this script disagree about
    # the names, which would ship a file that cannot reach the database.
    leftover = sorted(p for p in values if p in filled)
    if leftover:
        sys.exit(f'{path}: placeholder(s) not replaced: {", ".join(leftover)}')

    if filled == text:
        sys.exit(f'{path}: no placeholder found, nothing was filled in')

    with open(path, 'w', encoding='utf-8') as handle:
        handle.write(filled)
    print(f'{path}: credentials filled in')


def main(paths):
    if not paths:
        sys.exit('usage: fill_db_credentials.py <php file> [<php file> ...]')
    values = read_credentials()
    for path in paths:
        fill(path, values)


if __name__ == '__main__':
    main(sys.argv[1:])
