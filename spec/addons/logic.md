# About This File

This file describes the logic augments that addons bring to the base version of the game.

# Lobby

If any addons are present in the application, there's a mechanism in the lobby for selecting which addons to play the
game with. Players specify the addons collectively. Addons can be of two types: negative and positive. For each type
players choose number of addons to be played with and a set of addons to choose those from.

Once the game starts (or restarts) the specified number of addons are randomly chosen for each of the types using the
groupings. Addon groups are arranged as a tree. Every time a new random addon needs to be chosen, a descent from the
root tree is performed every time uniformly choosing a random child node, until a leaf (a specific addon) is determined.

# Addon Descriptions

This section describes all the details of each addon.

## Guess

### Addon: Guess Hand Highest

Short description: "Guess Hand Highest"

Long description: Before the player with the highest value red chip reveals their cards, other players must collectively
agree on what hand rank that player has (pair/two pairs/straight/etc.).

Functionality: The functionality is as described in General Details below. The player that needs to be guessed is
the player with the highest value red chip. The feature needed to be guessed is their hand rank. The guess button says
"Guess Hand". The guess options are, top-to-down: Royal Flush, Straight Flush, Four of a Kind, Full House, Flush,
Straight, Three of a Kind, Two Pair, One Pair, High Card.

### Addon: Guess Hand 2nd Highest

Same as "Guess Hand Highest" (including the functionality), but for 2nd-highest red chip instead of the highest one.

### Addon: Guess Hand Lowest

Same as "Guess Hand Highest" (including the functionality), but for the lowest red chip instead of the highest one.

### Addon: Guess Card Highest

Short description: "Guess Card Highest"

Long description: Before the player with the highest value red chip reveals their cards, other players must collectively
agree on a card value that player has (ace/queen/seven/etc.).

Functionality: The functionality is as described in General Details below. The player that needs to be guessed is
the player with the highest value red chip. The feature needed to be guessed is a card value they have. The guess button
says "Guess Card". The guess options are, top-to-down: (A) Ace, (K) King, (Q) Queen, (J) Jack, (10) Ten, (9) Nine,
(8) Eight, (7) Seven, (6) Six, (5) Five, (4) Four, (3) Three, (2) Two. If a card value is known to the players to be
excluded from the deck before dealing the pocket cards and therefore there's no possibility somebody has it, this
option is not shown in this list.

### General Details

Each of the "guess" addons targets a single player and a single hidden feature of that player's cards. Let's call that
player P and feature F. P and F should be specified in each addon's details.
Once it's P's turn to reveal their cards, they can't do so until all other players submit votes for their F. Each other
player has to submit a
vote, the voting is over once all votes are submitted. Once it's P's turn to reveal their cards, every other player
sees a guess button under P's chips. If a player presses that button, a list of all vote options pops up. The list
displays maximum 8 elements and is scrollable to navigate to more. If the player
clicks anywhere on the entire screen outside the list of options, the
list is closed and the player sees the guess button again, this should work for in any area of the screen. Clicking
the guess button itself when the list is visible, also closes it. If the player presses one of the vote options, the
list disappears and the chosen option is displayed where the guess button was. The
player can click the chosen option to change their vote, while it's possible a pencil icon (U+1F589) is displayed
to the right from the current guess button text. Once the player made a guess everyone else sees their guess above
them in a style of a text a dialogue cloud. Once everyone has
made a guess, the guesses are fixed and P can reveal their cards as normal. When guesses are fixed, the most popular
guess is determined. If there are multiple guesses with maximum number of votes, a pure random chooses one of them.
Guesses of the players who voted for that chosen option get yellow background, other guesses get more subtle more gray
background and text. 5 seconds after P reveals their cards, all the guesses disappear.

When the same player is under multiple "guess" addons that require guessing the same feature, it is logically and
visually equal to them being under just one. There's no point in having players to guess the same thing twice.

When the same player is under multiple "guess" addons that require guessing different features, all the guesses happen
simultaneously: there are multiple guess buttons and there are multiple dialogue clouds. The player can only reveal
their cards once all guesses on all features are fixed. All guesses are fixed together when all votes are submitted, so
for example, if everyone guessed card value, but not everyone has guessed hand rank yet, the card value guesses can be
changed.

During the guessing phase if the current player is going to be guessed later, their cards have dark gray (#3b3b3b)
wide diagonal (top-right to bottom-left) 20% transparent stripes up until there's nothing to guess on them for the rest
of the game. This is only visible to the player themself.

Red chips that are targeted by one or more guess addons (chips owning which will result in the owner being
guessed) have a white question mark on the background, behind the stars. The question mark is 80% transparent,
acting as a watermark. The size of the question mark should be that it takes 90% of the height of the chip background.
The question mark's visual center must align exactly with the center of the chip circle, both
horizontally and vertically. Font spacing and character metrics must not cause any offset, the centering is based on
the visual appearance of the character. The fact that question mark is higher than a normal character should not impact
its vertical position, the vertical center of the question mark still should be exactly at the chip's center. The visual
center of the question mark is defined as the geometrical center of all its pixels (including both dot and top part of
the sign). This
question mark is visible on a red chip all the time: when it's on the table, when it's moving, when it's in a player's
hand, etc.

## Addon: Only Neighbors Steal

Short description: "Only Neighbors Steal"

Long description: You can only steal chips from players sitting next to your left and right (neighbors).

Functionality: The "Steal" option is not available for the chips that are currently at players that are not neighbors
of the current player.

## Addon: Black & Red

Short description: "Black & Red"

Long description: Instead of 4 logical suits, there are only 2: black (represented by clubs and spades) and red (
represented by diamonds and hearths).

Functionality: All cards revert their colors, meaning the following: cards have the background of their suit color
(red or black) and card's rank and suit symbols become white.

## Addon: Short Deck

Short description: "Short Deck"

Long description: The game is played only with cards of value 10 through Ace. All twos, threes, ..., nines are removed.

Functionality: The game is played only with cards of values 10, Jack, Queen, King, Ace. Other cards are removed. The
cards are removed at the very beginning, so neither pocket cards nor common cards can be 2, 3, ..., 9. When this addon
is active, the cards are styled differently: each card has it's value and suit stacked vertically at the middle of the
card. Both value and rank should take 50% of the height of the card. Both value and suit text should take about 50% of
the width of the card (the font should be chosen accordingly).

## Addon: Additional Card Flop

Short description: "Additional Card Flop"

Long description: When the 2nd round begins, 4 community cards are placed on the table instead of usual 3.

Functionality: The first round's number of community cards is increased by 1.

## Addon: Additional Card Turn

Same as "Additional Card Flop", but for 3rd round instead of the 2nd one.

## Addon: Additional Card River

Same as "Additional Card Flop", but for 4th round instead of the 2nd one.

## Addon: Black 1s

Short description: "Black 1s"

Long description: All chips of value 1 become black. A black chip can't move (can't be stolen or dropped) after it's
taken from the middle of the table for the first time.

Functionality: All chips of value 1 have black circle inside them (the border is still of their color, but the middle is
black). There's no steal or drop option for a black chip.

## Addon: Black Ns

Same as "Black 1s", but the highest value (equal to the number of players) chips become black instead of the chips
with the value 1.

## Addon: Black Xs

Same as "Black 1s", but instead of chips with value 1, a random number X (from 1 to N) is determined at the beginning of
the game and chips with number X become black. X stays the same through all rounds. If this addon affects a chip that
is already black (for example, because Black 1s addon is also enabled), then number X is rerolled until this doesn't
happen. If it's impossible to find such X (for example, if there are 2 players and both Black 1s and Black Ns addons are
enabled alongside this addon), then this addon has no effect.

## Addon: No White Chips

Short description: "No White Chips"

Long description: There is no distribution of white chips. The game starts from the 2nd round.

Functionality: Round 1 is skipped, the game starts from round 2. White chips never exist in the game.

## Addon: No Yellow Chips

Short description: "No Yellow Chips"

Long description: There is no distribution of yellow chips. After the common cards of the 2nd round are revealed,
the round is immediately over and the game moves to the 3rd round.

Functionality: When round 2 starts, its common cards are revealed, but chips are not put on the table. Immediately after
that round 2 ends and round 3 starts.

## Addon: No Orange Chips

Same as "No Yellow Chips", but for orange chips on the 3rd round rather than yellow chips on the 2nd round.

## Addon: No Old Chips

Short description: "No Old Chips"

Long description: At the beginning of each round (after the first one), all chips from the previous round are removed
and player cannot see them.

Functionality: When a new round starts and chips for this new round are placed on the table, all chips from the previous
round are removed as if they were never in the game. Once the game is over and all players have revealed their cards,
the chips are shown for the players to better analyze the game.

## Addon: See 1 Neighbor's Cards

Short description: "See 1 Neighbor's Cards"

Long description: Besides your own cards you can also see pocket cards of the player next to your left.

Functionality: During the game each player sees the cards of their immediate neighbors on the left face up.

## Share Info Addons

### Addon: Share Blackjack Sum

Short description: "Share Blackjack Sum"

Long description: Once the pocket cards have been dealt in Round 1, everyone states the sum of the value of their pocket
cards. 2 to 10 have the values 2–10. J, Q, and K have the value of 10. A has the value of 11. This is done as a separate
pre-game round, which ends when everyone has the ready button pressed.

Functionality: The functionality is as described in General Details of this addon. The number for each player is the sum
of the value of their pocket cards as described above. The text on the table for the round is "Blackjack Sum".

### Addon: Share Number of Faces

Short description: "Share Number of Faces"

Long description: Once the pocket cards have been dealt in Round 1, each player says how many “face cards” (J, Q, K)
they have.

Functionality: The functionality is as described in General Details of this addon. The number for each player is the
total number of J, Q and K in their cards. The text on the table for the round is "Number of Faces".

### General Details

Each share info addon works as follows: After the pocket cards in the beginning of the game are dealt, but before any
other aspects of the normal rounds have happened (for example, dealing chips or cards), above each player (including the
current one) there's a dialogue cloud with the value specific for the addon of their pocket cards as described above.
The dialogue cloud should be displayed above the player's name.
The dialogue clouds are displayed on top of any other UI element in the application. It must be above the table, above
any other UI element of the player the cloud is on, above any UI element of any other player (even when that other
player has a dialogue cloud as well). Also, there's an addon-specific text written at the middle of the table during
this phase. No other text is written on the table during this phase. Each player has the normal ready button. Once
everyone is ready, the rest of the first round happens as normal.

When multiple share info addons are in the same game, they take effect one by one: for each of them there's info shared
by each player and a table text. Once everyone is ready, the next addon changes the current one, until there are no more
share info addons.

During a share info phase move to next round readiness is public: each player has a tick right next to their name
indicating that they have the button pressed. The tick should not move the name horizontally, it should appear to the
right from the name, but the name should still be centered as if there was no tick. Players who are not ready have a
red cross (U+2715) next to their name instead.

## Addon: [A] Show 1 Card to 1 Player

Short description: "[A] Show 1 Card to 1 Player"

Long description: Once per game, one of the players can show one of their cards to another player for 5 seconds.

Functionality: This addon adds an action card. When using the card, the player needs to first select one of their cards,
then one of other players. After that the selected player sees the selected card flip face up in-place. 5 seconds after
that the card flips back face down just as it was before. The player using the card also sees the flipping card
animation (from face up to face down, and then after 5 seconds from face down to face up).

If the card chosen to be shown is already face-up for all players, the flipping animation is not played.

When the target player is selected and the card reveal begins, all players see a cone of light from the
using player toward the target player. The cone is just a dot at the using player's side and widens toward the target
player. It is semi-transparent, pale yellow, and visually soft (not
bright or distracting). The cone is displayed for the full duration of the flipping animation.
The cone is rendered above all table elements.

The action card for this addon has no text, has a simple eye image in its center and has a black background.

## Unsuited Card

### Addon: [A] Unsuited Jack

Short description: "[A] Unsuited Jack"

Long description: Once per game, one of the players can replace one of their cards with a Jack. The player must
discard one of their cards to do so. The Jack has no suit (can't be used for flash).

Functionality: This addon adds an action card. When using the card, the player needs to select one of their cards. After
that, that card is discarded and the player gets an orange #B87333) Jack. For the rest of the game the player has this
Jack as one of their cards. This Jack is always face up for all players.

Both action card and the actual card in hand from this addon look the same: they have orange (#B87333) background and
similarly to other playing cards have "J" symbol in the top left corner, but also in the center in the card where a
normal card would have its suit.

### Addon: [A] Unsuited Xrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr

Same as "Addon: [A] Unsuited Jack", but instead of Jack a random card Rank (from 2 to A) is determined at the beginning
of the game and an unsuited card with rank X is available to be taken. X stays the same through all rounds.

### General Details

When multiple unsuited action cards are put on the action cards table, they are sorted by rank (top to bottom A, K, Q,
J, 10, 9, 8, 7, 6, 5, 4, 3, 2).

## Addon: Prison

Short description: "Prison"

Long description: On a random round (except the last one), a random player is imprisoned and can't participate in that
round. One fewer chip is placed on the table that round.

Functionality: At the start of the game, a random round R (from 1 to 3, excluding any rounds skipped by other addons)
and a random player P are determined. If all rounds are skipped by other addons, this addon has no effect.
When round R starts, vertical black lines are displayed over the player (imitating prison bars), visible to all players.
Also, sound "PRISON_TAKEN_EFFECT" which defaults to spec/base/resources/sounds/prison-close.mp3 is played for all
players.
During round R, player P cannot take a chip from the table, cannot steal a chip from another player, cannot use action
cards. All action cards become unavailable for the prisoned player and they can't click them. Player P is automatically
treated as ready during whole round R. The ready button is not shown to player P.

During round R, one fewer chips are placed on the table. The round ends when all non-imprisoned players have a chip for
the current round and are ready.

The prison effect lasts only for round R (the chip-distribution phase). It does not extend into any card-revealing or
rank-guessing phase. It also does not apply to any pre-round phases (such as share info addon phases) that happen before
round chip distribution begins.

## Addon: [A] Reroll Common

Short description: "[A] Reroll Common"

Long description: Once per game, one of the players can replace one of the common cards with another random card.

Functionality: This addon adds an action card. When using the card, the player needs to select one of the common cards.
That card is discarded and another card from the deck takes its place. This card can't be used if there are no common
cards.

The action card for this addon has no text, has a simple "refresh" sign image in its center and has a white background.

When this action is commited, the chosen common card flips face down, then it flips again face up, but now it's a new
card from the deck. Both flips happen with the flipping card animation.

## Addon: [A] Try Another Card

Short description: "[A] Try Another Card"

Long description: Once per game, one of the players can take one card from the deck and add it to their hand. Afterward,
this player must drop one of their cards. This can be the card that they have just drawn from the deck.

Functionality: This addon adds an action card. When using this card, the player sees a modal window above their name
that says "Use 'Try Another Card'?" and buttons under it "Confirm" and "Cancel".
The player needs
to click that button for the action card to take effect. Once the action card is played, the player sees one additional
card where their pocket cards are. The game is logically paused at this moment: other player's can't do anything (can't
move chips, play action cards, etc.) and are
just waiting. Other players see that the current player has 3 cards, but they see them face down as usual. The "move to
next round" button's text changes to "Drop Card". The current player needs to select one of their
cards and then press the Drop Card button. The player can't do anything besides choosing the card and confirming it
until they do. Once confirmed, the dropped card is discarded.

When the card is discarded, all players hear "CARD_DISCARDED" sound which defaults to
spec/base/resources/sounds/moving-plant.mp3.

The action card for this addon has green background. It has 3 vertical rectangles (like bars) displayed on it: first two
are black and third one is yellow.

# Addon Groupings

This section describes which addons are actually present in the game and how they are grouped. Some addons are grouped
together. Groups can have nested groups. Only addons listed in this section are present in the game, others are not
visible to the players in any way.

When addons are displayed as a list anywhere in the game, they should be in the same order that they go in here (if you
go top to down ignoring the nesting).

The tree structure of the groups is described as Markdown enumerated list. Nested elements mean children of a node,
addon names mean leaf nodes with that addon.

## Negative Addons

1.
    1. Guess Hand Highest
    2. Guess Hand 2nd Highest
    3. Guess Hand Lowest
    4. Guess Card Highest
2. Only Neighbors Steal
3.
    1. Black & Red
    2. Short Deck
4.
    1.
        1. Additional Card Flop
        2. Additional Card Turn
        3. Additional Card River
    2.
        1. No White Chips
        2. No Yellow Chips
        3. No Orange Chips
5.
    1. Black 1s
    2. Black Ns
    3. Black Xs
6. No Old Chips
7. Prison

## Positive Addons

1. See 1 Neighbor's Cards
2.
    1. Share Blackjack Sum
    2. Share Number of Faces
3. [A] Show 1 Card to 1 Player
4.
    1. [A] Unsuited Jack
    2. [A] Unsuited X
5. [A] Reroll Common
6. [A] Try Another Card
