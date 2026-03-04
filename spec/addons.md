# Addons

## About This File

This file describes the addons (toggleable modifications of the base game).

## Negative Addons

### Guess Rank

#### Addon: Guess Rank Highest

Short description: "Guess Rank Highest"

Long description: Before the player with the highest value red chip reveals their hand, other players must collectively
agree on what hand rank that player has (pair/two pairs/street/etc.).

Functionality: Here, let's call the player with the highest value red chip HRC. Once it's HRC's turn to reveal the
cards, they can't do so until all other players submit votes for their hand rank. Each other player has to submit a
vote, the voting is over once all votes are submitted. Once it's HRC's turn to reveal their cards, every other player
sees a button "Guess Rank" under HRC's chips. If a player presses that button, a list of all ranks pops up. The ranks
are, top-to-down: Royal Flush, Straight Flush, Four of a Kind, Full House, Flush, Straight, Three of a Kind, Two Pair,
One Pair, High Card. If the player presses one of these options, the list disappears and the chosen rank is displayed
where the "Guess Rank" button was. The player can click the chosen rank to change their vote. Once the player made a
guess everyone else sees their guess above them in a style of a text a dialogue cloud. Once everyone has made a guess,
the guesses are fixed and HRC can reveal their cards as normal. When guesses are fixed, the most popular guess is
determined. If there are multiple guesses with maximum number of votes, a pure random chooses one of them. Guesses of
the players who voted for that chosen option get yellow background, other guesses get more subtle more gray background
and text. 3 seconds after HRC reveals their cards, all the guesses disappear.

#### Addon: Guess Rank 2nd Highest

Same as "Guess Rank Highest" (including the functionality), but for second-highest red chip instead of the highest one.

#### Addon: Guess Rank Lowest

Same as "Guess Rank Highest" (including the functionality), but for the lowest red chip instead of the highest one.

#### General Details

When the same player is under multiple "guess rank" addons, it is logically and visually equal to them being under just
one. There's no point in having players to guess the same thing twice.

### Addon: Black & Red

Short description: "Black & Red"

Long description: Instead of 4 logical suits, there are only 2: black (represented by clubs and spades) and red (
represented by diamonds and hearths).

Functionality: All cards revert their colors, meaning the following: cards have the background of their suit color
(red or black) and card's rank and suit symbols become white.

### Black Chip

#### Addon: Black 1s

Short description: "Black 1s"

Long description: All chips of value 1 become black. A black chip can't move (can't be stolen or dropped) after it's
taken from the middle of the table for the first time.

Functionality: All chips of value 1 have black circle inside them (the border is still of their color, but the middle is
black). There's no steal or drop option for a black chip.

#### Addon: Black Ns

Same as "Black 1s", but the highest value (equal to the number of players) chips become black instead of the chips
with the value 1.

#### Addon: Black Xs

Same as "Black 1s", but instead of chips with value 1, a random number X (from 1 to N) is determined at the beginning of
the game and chips with number X become black. X stays the same through all rounds. If this addon affects a chip that
is already black (for example, because Black 1s addon is also enabled), then number X is rerolled until this doesn't
happen. If it's impossible to find such X (for example, if there are 2 players and both Black 1s and Black Ns addons are
enabled alongside this addon), then this addon has no effect.

### Addon: No Old Chips

Short description: "No Old Chips"

Long description: At the beginning of each round (after the first one), all chips from the previous round are removed
and player cannot see them.

Functionality: When a new round starts and chips for this new round are placed on the table, all chips from the previous
round are removed as if they were never in the game. Once the game is over and all players have revealed their cards,
the chips are shown for the players to better analyze the game.

### Addon: Only Neighbors Steal

Short description: "Only Neighbors Steal"

Long description: You can only steal chips from players sitting next to your left and right (neighbors).

Functionality: The "Steal" option is not available for the chips that are currently at players that are not neighbors
of the current player.

## Positive Addons

### Addon: See 1 Neighbor's Cards

Short description: "See 1 Neighbor's Cards"

Long description: Besides your own cards you can also see pocket cards of the player next to your left.

Functionality: During the game each player sees the cards of their immediate neighbors on the left face up.
