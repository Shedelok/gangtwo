# About This File

This file describes the UI augments that addons bring to the base version of the lobby page.

# Addons

On the left, all players see full list of available addons as a side-panel under the sound control elements.

Addons of each type are displayed as a list. Each of the 2 lists has a header and controls to specify the number of
addons of the corresponding type to be used. Once the game starts, the specified number of negative and specified number
of positive addons are randomly selected and are used in the game.

Players can uncheck the checkbox next to each addon to remove them from the pool which is used when making the
random selection. The hover description of each asset doesn't cover the checkboxes, so they always stay visible
If the number of requested addons is bigger than the number of enabled checkboxes, the game cannot start.

Each (negative and positive) list should take 14% of the entire screen in width.

## Setup Code

At the top of the addons side-panel right next to the word "Addons" (also on the left side of the panel) there's a code
corresponding to the current addons setup.

Players can copy the code to reuse in future games. The "Copy" button's text changes to a tick after the copy was
successfully done. Changing the text to tick should not modify the size (neither height nor width) of the button in any
way so that it doesn't seem disturbing.

Players can paste the code to set up all the checkboxes and numbers
of addons per type requested. Code, checkboxes and the numbers are always in sync meaning that if the code changes,
checkboxes and numbers change accordingly and vice versa.

The idea of the code is to be a human-readable Base32 serialization of the game setup so that the players don't have
to set up the game again and again. The sequence of the checkboxes is converted in a sequence of 1s and 0s, then
number of negative addons requested and number of positive addons requested is appended to in binary format. After that
this whole sequence is converted to Base32 code (using RFC 4648 alphabet) as a number.

The encoding/decoding logic can assume that the list of addons will never change.
