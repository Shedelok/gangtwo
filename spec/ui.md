# UI Details

## About This File

This file describes the UI aspects of the application.

## Lobby

One the player joins the lobby, they see the full list of players and "Start Game" button.

### Addons

On the left, all players see full list of available addons as a side-panel under the sound control elements.
First, there is a list of all negative addons, then next to it is a list of all positive addons. Each of the 2 lists
has a header and its own background. The negative addons have subtle red background, the positive addons have subtle
green background. Each list should take 15% of the entire screen in width. The overall left side-panel should adapt its
width accordingly.
The order of the addons is exactly the same as the order they are described in spec/addons.md. Each addon
is displayed as a checkbox and
short description
of the addon. When hovering an addon in this list, full description of it is displayed. Players can enable/disable
addons. When the game starts, list of enabled addons is fixed, and they are used in the game.

## In-game

The table is displayed as a green oval in the center of the screen. Each player sees themself at the bottom and all
other
players are seated clockwise, but the order is the same for everyone (meaning the player who seats clockwise to the
current player
sees the current player counter-clockwise next to themself).

For each player there is their name, cards and chips that are displayed where the player seats.

### Addons

On the left, players can see the full list of addons that take part in the game as a side-panel under the sound control
elements.
First, there is a list of all negative addons, then next to it is a list of all positive addons. Each of the 2 lists
has a header and its own background. The negative addons have subtle red background, the positive addons have subtle
green background. Each list should take 15% of the entire screen in width. The overall left side-panel should adapt its
width accordingly.
The order of the addons is exactly the same as the order they are described in spec/addons.md.
The players see the list of short names
of the addons. If they hover over an addon, they see the full description of it.

The Stop Game and Restart buttons are displayed side by side with a gap between them.

### Table

The table should be horizontally centered on the screen regardless of whether there are or are not any side panels on
the left or right. The table should take roughly 60% of the player's screen width.

### Common Cards

Сommon cards are displayed on the table.

When new common cards are revealed, they first appear face down and then there's an animation of them flipping that
lasts 1 second and turns the cards face up. The animation is played for all players at the same time. If a player was in
a different tab when the animation was played, they just won't see it, they would see the card(s) already face up. When
there are multiple common cards revealed together, their animations are played at the same time (they all flip
together). The animation is also played for the revealed cards when the cards being revealed are first common cards
and there were no common cards before, the animation still plays as normal.

### Pocket Cards

The cards are displayed face up for the current player and face down for everyone else.

### Chips

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

All chips belonging to a player are always displayed in a single horizontal row. The chip area in each player's seat
always occupies the same vertical space regardless of whether the player currently holds any chips, so the seat does
not resize when a chip is taken or returned.

Every time a chip is moved (by a move of one of the players, etc.), visually it doesn't teleport immediately, but rather
a moving animation is played that lasts 1 second and moves the chip from its origin to destination.

### Ready Button

The "ready" button is only visible to the player themselves. When not ready, the
button reads "Move to next round" and is styled prominently to draw attention. When ready, the button reads "Ready!"
and is styled green. Clicking the button toggles the state. The button is sized to fit its label and does not affect the
size of the player seat.

### Sound Bar

Each player has a bar to control the volume of all sounds in the game. The default value of the volume is 0.5.

Each player has a button that opens/closes a panel in which for each sound in the game the player has a drop-down box
of all mp3 files available (from spec/resources/ folder). The player can assign any of the mp3 files to any of the
sounds (one mp3 can be used any number of times).
