# About This File

This file describes the UI of the in-game page.

# Game Start

At the beginning of the game, all players hear "GAME_START" sound which defaults to
spec/base/resources/sounds/car-engine-start.mp3. This sound is also played after a restart, even if a restart happens
immediately after the game starts (on the first round).

# General Layout

The table is displayed as a green oval in the center of the screen. Each player sees themself at the bottom and all
other players are seated clockwise, but the order is the same for everyone (meaning the player who seats next to the
current player clockwise sees the current player next to them, but counter-clockwise).

For each player there is their name, cards and chips that are displayed where the player seats.

# Table

The table should be horizontally centered on the screen regardless of whether there are or are not any side panels on
the left or right. The table should take roughly 60% of the player's screen width.

## Common Cards

Common cards are displayed on the table.

When new common cards are revealed, they first appear face down and then flip with the flipping animation. The animation
is also played for the revealed cards when the cards being revealed are first common cards and there were no common
cards before, the animation still plays as normal.

# Pocket Cards

The cards are displayed face up for the current player and face down for everyone else.

# Chips

The chips are displayed as circles of the designated color. The color of the chips should
always stay the same, even after the corresponding round is over, chips remain their color.

Each chip has black
five-pointed stars on it that are of number equal to the chips value. If a chip has 1
star, it should be exactly in the middle, visually, meaning that the center of the star is exactly in the center of the
chip (circle) vertically and horizontally. If a chip has 2 stars, they should be on the same horizontal line. If a chip
has 3 or more stars they should form a circle. If a chip has 3 stars, one star is at the top and two are at the bottom
left and right corners. If a chip has 4 stars, they are at the top left, top right, bottom left and bottom right
corners.

The chips of the same color are always sorted by value ascending when are put next to each other.

The chips of different colors are always sorted by their corresponding round number ascending when are put next to each
other.

Chips on the table always have dedicated spots, meaning their position doesn't depend on the number of chips on the
table. The same value chip, when taken and then returned to the table, always ends up in the same position, no matter if
any other chips were taken/returned from/to the table in between. Once the round where the chip was introduced is over
and the chip can no longer move, the spot of the chip is removed from the UI. The chip spots are fixed horizontally and
vertically, so
that chips on the table don't move when other chips are touched (this takes into account any additional elements like
buttons appearing/disappearing next to chips). Each chip spot has a very subtle rectangular border.

All chips belonging to a player are always displayed in a single horizontal row. The chip area in each player's seat
always occupies the same vertical space regardless of whether the player currently holds any chips, so the seat does
not resize when a chip is taken or returned.

Every time a chip is moved (by a move of one of the players, etc.), visually it doesn't teleport immediately, but rather
a moving animation is played that lasts 1 second and moves the chip from its origin to destination. This animation is
used
regardless of whether the chip is taken from the table, or from another player, or somewhere else. The dedicated chip
spots
on the table are always available as precise animation endpoints. Specifically, if a chip is being taken from the table,
the animation must start from the chip's table spot; if a chip is being returned to the table, the animation must end at
its table spot.
These table spot positions must remain trackable at all times, including while the chip is held by a player. If another
action
that moves a chip that is already moving was done to it, the chip moves to the new place starting where it was when the
action happened. The chip should never magically "teleport".

Every time a chip is moved, all players hear "CHIP_MOVE" sound which defaults to
spec/base/resources/sounds/fast-woosh.mp3. The volume of CHIP_MOVE sound is multiplied by 0.2.

When someone steals a chip from the current player, the current player hears the sound "STEAL_FROM_YOU" which defaults
to spec/base/resources/sounds/bell-1.mp3.

# Ready Button

The "ready" button is only visible to the player themselves. When not ready, the
button reads "Move to next round" and is styled prominently to draw attention. When ready, the button reads "Waiting"
and has less bright color. Clicking the button toggles the state. The button is sized to fit its label and does not
affect the size of the player seat.

Initially the player is not ready. When the player's current round chip is
stolen or discarded, their state resets to not ready. When a new round starts, the ready button is automatically reset
to not ready state. When a player disconnects the state is reset to not ready, so that the new round doesn't start until
they are back and pressed the button again.
