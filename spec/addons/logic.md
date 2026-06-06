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
background and text. 10 seconds after P reveals their cards, all the guesses disappear.

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

## Addon: Pass 1 Card

Short description: "Pass 1 Card"

Long description: Once the pocket cards have been dealt in Round 1, each of you chooses one of your pocket cards.
Everyone then simultaneously passes their chosen card to the player on their left as a pocket card.

Functionality: Immediately after the pocket cards are dealt and before anything else happens (before dealing chips,
before starting the share info phase, etc.), each player must choose one of their cards and press the ready button. The
UI for picking a card is the same as for action cards, when needed to pick one of the pocket cards. The ready button
reads "Pass card". The readiness is public during this phase. Once everyone is ready, chosen pocket card is given to the
player on the left for all players. All cards move at the same time with flying card animation. The cards don't visually
instantly teleport, but rather a moving animation is played that lasts 2 seconds and moves each card from its origin to
destination simultaneously.

The new card coming to the player's hand takes the same position that the one passed was, so that all other cards stay
on their positions.

During this phase, the text on the table is "Pass 1 Card".

It is possible to use action cards during this phase, except for the cards that can't be used due to their own
condition.

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
The dialogue clouds are displayed on top of any other UI element in the application, except the hand ranking. It must be
above the table, above
any other UI element of the player the cloud is on, above any UI element of any other player (even when that other
player has a dialogue cloud as well). Also, there's an addon-specific text written at the middle of the table during
this phase. No other text is written on the table during this phase. Each player has the normal ready button. Once
everyone is ready, the rest of the first round happens as normal.

If the information that the shared value depends on changes for any reason (for example, player takes unsuited card
instead of one of their cards and the addon value depended on their pocket cards), the shared value is updated
accordingly.

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
that, that card is discarded and the player gets an orange #B87333) Jack. This Jack is always face up for all players.
This Jack is always unsuited (orange) even if it becomes a common card. If unsuited Jack is discarded at any point of
the game, it's just normally discarded, the action card doesn't return to the table. If unsuited Jack moves to table or
to another player, it moves normally as any other card. When unsuited Jack is flipped (animation), it flips just as a
normal card.

Both action card and the actual card in hand from this addon look the same: they have orange (#B87333) background and
similarly to other playing cards have "J" symbol in the top left corner, but also in the center in the card where a
normal card would have its suit.

### Addon: [A] Unsuited X

Same as "Addon: [A] Unsuited Jack", but instead of Jack a random card Rank (from 2 to A) is determined at the beginning
of the game and an unsuited card with rank X is available to be taken. X stays the same through all rounds.

When Test Mode is enabled, an additional text input appears to the right of the checkbox and text for this addon in the
addons list.
It accepts a single rank token (2–9, 10, J, Q, K, A). If left
empty, X is chosen randomly at game start as usual. If a rank is specified, it is used as X. If the specified rank is
invalid or conflicts with the current game configuration the game cannot start. By default, this text input is empty.

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
That card is discarded and another card from the deck takes its place. This works for any common card (even if it's
unsuited). This action card can't be used if there are no common cards.

The action card for this addon has no text, has a simple "refresh" sign image in its center and has a white background.

When this action is commited, the chosen common card flips face down, then it flips again face up, but now it's a new
card from the deck. Both flips happen with the flipping card animation.

## Addon: [A] Swap With Common

Short description: "[A] Swap With Common"

Long description: Once per game, one of the players can swap one of their cards with one of the common cards.

Functionality: This addon adds an action card. When using the card, the player needs to select one of their cards, then
select one of the common cards. The selected cards swap places: the player's pocket card replaces the common card and
the common card replaces player's card in their hand. The cards replace each other in the same slots: the common
card takes the exact slot the pocket card was occupying in the hand, the pocket card takes the exact slot the common
card
was occupying on the table. The new pocket card becomes face down, the new common card becomes
face up. This action card can't be used if there are no common cards.

The action card for this addon has no text, has a simple white ring (circle with a hole in the middle) in its center and
has a blue background.

The chosen cards swap with animation similar to how other objects in the game move. Each card moves from its origin to
destination point. The animation lasts 2 seconds. When the animation completes, both cards are immediately revealed
(to whom it should be visible to), no flip or transition animation plays at the end.

## Addon: [A] Try Another Card

Short description: "[A] Try Another Card"

Long description: Once per game, one of the players can take one card from the deck and add it to their hand. Afterward,
this player must drop one of their cards. This can be the card that they have just drawn from the deck.

Functionality: This addon adds an action card. When using this card, the player sees a modal window above their name
that says "Use 'Try Another Card'?" and buttons under it "Confirm" and "Cancel".
The player needs
to click the Confirm button for the action card to take effect. Once the action card is played, the player sees one
additional
card where their pocket cards are. The game is logically paused at this moment: other player's can't do anything (can't
move chips, play action cards, etc.) and are
just waiting. Other players see that the current player has one more card, but they see them face down as usual. The "
move to next round" button's text changes to "Pick card to drop" when no card is selected yet and "Drop card" when a
card is
selected. The current player needs to select one of their cards and then press the Drop Card button. The player can't do
anything besides choosing the card and confirming it until they do. Once confirmed, the dropped card is discarded.

When the card is discarded, all players hear "CARD_DISCARDED" sound which defaults to
spec/base/resources/sounds/moving-plant.mp3.

The action card for this addon has green background. It has 3 vertical rectangles (like bars) displayed on it: first two
are black and third one is yellow.

## Addon: [A] Destroy All Xs

Short description: "[A] Destroy All Xs"

Long description: Once per game, one of the players can destroy all cards of chosen rank R. Destroying cards discards
all of them whether they are in the deck, on the table or in players' hands.

Functionality: This addon adds an action card. When using this card, the player sees a list of all ranks of cards that
participate in the game, given the current game configuration like active addons, regardless of whether any card of
such rank is still in the game. The list is hidden behind the "Choose rank" button that, when pressed, displays a
pop-up list. If player selects one of the ranks, the pop-up list closes and that rank is shown instead of "Choose rank".
The player can change their selection. If the player selects one of the ranks and
presses the confirmation button, the action card is played
and
all cards of chosen rank are discarded. The confirmation button reads "Select rank to destroy" (and is inactive) when no
rank
is selected and
"Destroy Jacks" or "Destroy 8s" or similar with the corresponding rank when a rank is selected. The list of ranks
displays maximum 8 elements and is scrollable to navigate to more, similar to "guess rank" functionality. If some of the
common
cards
are discarded, the space they were taking stays blank (other cards don't change their position because of this). Same
with pocket cards - other cards don't change their position if some other are discarded.

When the action card is played, all players hear "CARD_DISCARDED" sound. The cards that are being destroyed by this
addon
are not disappearing instantly, instead an animation is played. The card disappears top to bottom with constant speed.
The animation takes 5 seconds. All cards disappear at the same time. Also, as soon as the action card is played, there's
a dialogue cloud displayed above the player who played the card with text like "Destroyed Queens" or "Destroyed 6s"
depending on the actual choice. This cloud disappears after 10 seconds. This cloud has the same background color as the
action
card.

The action card for this addon has black background. It also has big white skull (emoji) displayed in the center of it.

## Addon: [A] Check Number of Ranks

Short description: "[A] Check Number of Ranks"

Long description: Once per game, one of the players can check how many cards of chosen rank R are in play. They see
the total number of cards of rank R in player hands and on the table (not including unused action cards).

Functionality: This addon adds an action card. When using this card, the player sees a list of all ranks of cards that
participate in the game, given the current game configuration like active addons, regardless of whether any card of
such rank is still in the game. The list is hidden behind the "Choose rank" button that, when pressed, displays a
pop-up list. If player selects one of the ranks, the pop-up list closes and that rank is shown instead of "Choose rank".
The player can change their selection. If the player selects one of the ranks and
presses the confirmation button, the action card is played
and the player sees a dialogue cloud. The cloud has text like "There are 3 Queens in the game right now (Only visible to
you)" depending on the actual number and the rank the player chosen. The cloud is only visible to the player who
played the card. "(Only visible to you)" text goes on a separate line and is italic. When computing the number of cards,
cards in
player hands (any player) are counted and common cards are counted. The confirmation button reads "Select rank to
check" (and is inactive) when no
rank
is selected and
"Check number of Jacks" or "Check number of 8s" or similar with the corresponding rank when a rank is selected. The list
of ranks
displays maximum 8 elements and is scrollable to navigate to more, similar to "guess rank" functionality.

The dialogue cloud disappears after 10 seconds. This cloud has the same background color as the action card.

The action card for this addon has black background. It also has big white question mark displayed in the center of it.

## Addon: [A] Vacation

Short description: "[A] Vacation"

Long description: Once per game, one of the players can take a special "Vacation" card that stays with them until the
end of the game. Player holding the vacation card doesn't participate in the last round. This player is not counted when
determining win/lose after the last round. The vacation card can't be taken during the last round.

Functionality: This addon adds an action card. When using this card, the player sees a modal window above their name
that says "Take 'Vacation' card?" and buttons under it "Confirm" and "Cancel".
The player needs
to click the Confirm button for the action card to take effect. This action card can be used at
any stage
of game before the last round starts. Once the action card is played, the player logically
holds the
vacation card for the rest of the game. A palm tree emoji is displayed both before and after their name to indicate
this. When the last round starts, similarly to how "Prison" addon works, the player holding the vacation card can't
participate in the round, they cannot take a chip from the table, cannot steal a chip from another player, cannot use
action cards. There's one less chip dealt to the table during that round.

When the last round starts and the vacation card takes effect (if any player holds it), all players hear
"VACATION_STARTED" sound which defaults to spec/base/resources/sounds/airbus-cabin-beep.mp3. During this round there are
thick horizontal wavy blue lines displayed on top of the player (across the whole player's seat) visible to everyone
(this effect is removed when the reveal cards phase starts).

During the reveal cards phase, the vacation player reveals (can press the reveal button) after all players holding a red
chip have revealed their cards.

The action card for this addon has blue background. It also has big palm (palm tree emoji) displayed in the center of
it.

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

1. Pass 1 Card
2.
    1. Share Blackjack Sum
    2. Share Number of Faces
3. [A] Show 1 Card to 1 Player
4.
    1. [A] Unsuited Jack
    2. [A] Unsuited X
5. [A] Reroll Common
6. [A] Swap With Common
7. [A] Try Another Card
8. [A] Destroy All Xs
9. [A] Check Number of Ranks
10. [A] Vacation
