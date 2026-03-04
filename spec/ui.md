# UI Details

## About This File

This file describes the UI aspects of the application.

## List of Addons

Every time a list of addons is displayed somewhere in the app, it is displayed in 2 columns:
First, there is a list of all negative addons, then next to it is a list of all positive addons. Each of the 2 lists
has a header and its own background. The negative addons have subtle red background, the positive addons have subtle
green background. Each list should take 14% of the entire screen in width. The overall left side-panel should adapt its
width accordingly.
The order of the addons is exactly the same as the order they are described in spec/addons.md.
The players see the list of short names
of the addons. If they hover over an addon, they see the full description of it. Full description is shown as an
additional panel that appears when the player hovers over the addon. Hovering over the description itself, but not
hovering over
the addon hides the description (it's not hoverable).

Above these 2 columns there's a header "Addons" in the same style and color as "Volume" text above it, but in uppercase.

## Home Page

When first entering the application, the users see a text input for entering their name and button "Join Lobby (X
player(s))", where X is the number of players currently in the lobby and "player(s)" is actually either "player" or
"players" depending on the number.

## Lobby

One the player joins the lobby, they see the full list of players and "Start Game" button. If the game cannot start for
any logical reason (for example because too many addons are requested), the "Start Game" button appears gray and cannot
be pressed. Start Game button only takes effect once all players in the lobby have it pressed. Players can press/unpress
it, and they can see how many players have it pressed.

### Addons

On the left, all players see full list of available addons as a side-panel under the sound control elements.

Each of the 2 lists has a header and controls to specify the number of addons of the corresponding type to be used.
Once the game starts, the specified number of negative and specified number of positive addons are randomly selected and
are used in the game.

Players can uncheck the checkbox next to each addon to remove them from the pool which is used when making the
random selection. The hover description of each asset doesn't cover the checkboxes, so they always stay visible
If the number of requested addons is bigger than the number of enabled checkboxes, the game cannot start.

#### Setup Code

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

The players can also see the code of the current addons setup.

### Stop and Restart Buttons

The Stop Game and Restart buttons are displayed side by side with a gap between them.

Pressing the Stop Game button sets up the new lobby exactly as the previous one that was just over, meaning it shoud
have the same addons code.

The Restart button works similar to the "Move to the next round" button. All players must press it for it to take
effect. Each player can press and unpress it. Players can only see how many of them have this button pressed at the
moment.

### Table

The table should be horizontally centered on the screen regardless of whether there are or are not any side panels on
the left or right. The table should take roughly 60% of the player's screen width.

### Common Cards

Common cards are displayed on the table.

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
table. The same chip, when taken and then returned to the table, always ends up in the same position, no matter if any
other chips were taken/returned from/to the table in between. The chip spots are fixed horizontally and vertically, so
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

### Hand Rankings Hint

To the right of the sound control elements there is a question mark icon. When hovered over that icon,
spec/resources/hand-ranking.png is displayed to the user. The hand ranking should be displayed on top of any other
UI element (including table and players), so it's fully visible and nothing blocks it.