# About This File

This file describes the logic augments that addons bring to the base version of the game.

# Lobby

If any addons are defined, there's a mechanism in the lobby for selecting which addons to play the game with.
Players specify the addons collectively. Addons can be of two types: negative and positive. For each type players
choose number of addons to be played with and a set of addons to choose those from. Once the game starts (or restarts)
the specified number of addons are randomly chosen for each of the types.

# Negative Addons

## Guess Rank

### Addon: Guess Rank Highest

Short description: "Guess Rank Highest"

Long description: Before the player with the highest value red chip reveals their hand, other players must collectively
agree on what hand rank that player has (pair/two pairs/straight/etc.).

Functionality: Here, let's call the player with the highest value red chip HRC. Once it's HRC's turn to reveal the
cards, they can't do so until all other players submit votes for their hand rank. Each other player has to submit a
vote, the voting is over once all votes are submitted. Once it's HRC's turn to reveal their cards, every other player
sees a button "Guess Rank" under HRC's chips. If a player presses that button, a list of all ranks pops up. The ranks
are, top-to-down: Royal Flush, Straight Flush, Four of a Kind, Full House, Flush, Straight, Three of a Kind, Two Pair,
One Pair, High Card. If the player presses one of these options, the list disappears and the chosen rank is displayed
where the "Guess Rank" button was. If the player clicks anywhere on the entire screen outside the list of options, the
list is closed and the player sees "Guess Rank" button again, this should work for in any area of the screen. Clicking
the "Guess Rank" button itself when the list is visible, also closes it. The player
can click the chosen rank to change their vote. Once the player made a guess everyone else sees their guess above them
in a style of a text a dialogue cloud. Once everyone has
made a guess, the guesses are fixed and HRC can reveal their cards as normal. When guesses are fixed, the most popular
guess is determined. If there are multiple guesses with maximum number of votes, a pure random chooses one of them.
Guesses of the players who voted for that chosen option get yellow background, other guesses get more subtle more gray
background and text. 3 seconds after HRC reveals their cards, all the guesses disappear.

### Addon: Guess Rank 2nd Highest

Same as "Guess Rank Highest" (including the functionality), but for 2nd-highest red chip instead of the highest one.

### Addon: Guess Rank Lowest

Same as "Guess Rank Highest" (including the functionality), but for the lowest red chip instead of the highest one.

### General Details

When the same player is under multiple "guess rank" addons, it is logically and visually equal to them being under just
one. There's no point in having players to guess the same thing twice.

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

## Addon: Additional Card Flop

Short description: "Additional Card Flop"

Long description: When the 2nd round begins, 4 community cards are placed on the table instead of usual 3.

Functionality: The first round's number of community cards is increased by 1.

## Addon: Additional Card Turn

Same as "Additional Card Flop", but for 3rd round instead of the 2nd one.

## Addon: Additional Card River

Same as "Additional Card Flop", but for 4th round instead of the 2nd one.

## Black Chip

### Addon: Black 1s

Short description: "Black 1s"

Long description: All chips of value 1 become black. A black chip can't move (can't be stolen or dropped) after it's
taken from the middle of the table for the first time.

Functionality: All chips of value 1 have black circle inside them (the border is still of their color, but the middle is
black). There's no steal or drop option for a black chip.

### Addon: Black Ns

Same as "Black 1s", but the highest value (equal to the number of players) chips become black instead of the chips
with the value 1.

### Addon: Black Xs

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

# Positive Addons

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

### Addon: [A] Unsuited X

Same as "Addon: [A] Unsuited Jack", but instead of Jack a random card Rank (from 2 to A) is determined at the beginning
of the game and an unsuited card with rank X is available to be taken. X stays the same through all rounds.

### General Details

When multiple unsuited action cards are put on the action cards table, they are sorted by rank (top to bottom A, K, Q,
J, 10, 9, 8, 7, 6, 5, 4, 3, 2).

## Addon: [A] Reroll Common

Short description: "[A] Reroll Common"

Long description: Once per game, one of the players can replace one of the common cards with another random card.

Functionality: This addon adds an action card. When using the card, the player needs to select one of the common cards.
That card is discarded and another card from the deck takes its place. This card can't be used if there are no common
cards.

The action card for this addon has no text, has a simple "refresh" sign image in its center and has a white background.

When this action is commited, the chosen common card flips face down, then it flips again face up, but now it's a new
card from the deck. Both flips happen with the flipping card animation.

