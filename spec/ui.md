# UI Details

The table is displayed as a green oval in the center of the screen. Each player sees themself at the bottom and all
other
players are seated clockwise, but the order is the same for everyone (meaning the player who seats clockwise to the
current player
sees the current player counter-clockwise next to themself).

For each player there is their name, cards and chips that are displayed where the player seats.

## Table

The table should take roughly 60% of the player's screen width.

## Cards

The cards are displayed face up for the current player and face down for everyone else.

## Chips

The chips are displayed as circles of the designated color. The color of the chips should
always stay the same, even after the corresponding round is over, chips remain their color. Each chip has black
five-pointed stars on it that are of number equal to the chips value. If a chip has 1
star, it should be exactly in the middle, visually, meaning that the center of the star is exactly in the center of the
chip (circle) vertically and horizontally. If a chip has 2 stars, they should be on the same horizontal line. If a chip
has 3 or more stars they should form a circle. If a chip has 3 stars, one star is at the top and two are at the bottom
left and right corners. If a chip has 4 stars, they are at the top left, top right, bottom left and bottom right
corners.

The chips of the same color are always sorted by value ascending when are put next to each other.

The chips of different colors are always sorted by their corresponding round number ascending when are put next to each
other.

Every time a chip is moved (by a move of one of the players, etc.), visually it doesn't teleport immediately, but rather
a moving animation is played that lasts 1 second and moves the chip from its origin to destination.

## Checkbox

The players can only see their own checkbox for being ready for the next round and don't see whether other players have
their checkbox checked or not.

## Sound Bar

Each player has a bar to control the volume of all sounds in the game. The default value of the volume is 0.5.

Each player has a button that opens/closes a panel in which for each sound in the game the player has a drop-down box
of all mp3 files available (from spec/resources/ folder). The player can assign any of the mp3 files to any of the
sounds (one mp3 can be used any number of times).
