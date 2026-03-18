# About This File

This file describes the UI augments that addons bring to the base version of the in-game page.

# Addons

On the left, players can see the full list of addons that take part in the game as a side-panel under the sound control
elements. Addons of each type are displayed as a list. Each (negative and positive) list should take 10% of the entire
screen in width.

The players can also see the code of the current addons setup.

# Action Cards

## Action Cards Table

On the right side of the main table, there is a rectangular table for action cards (from addons with actions).

Each card is a rectangle of the same size. Each card corresponds to one addon present in the game.

## Using an Action Card

If the action is available to the player, they can click the card and start workflow of using it.
While selecting specifics of the action the player can cancel it at any time until it's commited. The cancellation is
done by pressing the same card again. During this time there's a big red cross displayed on the card, all it's text is
removed and the card's color becomes more red hinting the player the cancellation logic. While using the card, player
cannot do any other action that is not required by this card, so that they are
forced to either play the card or return it to the table. While one player is using a card, no other player can start
using any action cards (neither this nor other). All those cards change their color to a less bright one. The player
using the card can't use any other card until they finish using this one (or cancel). All other cards change their color
to a less bright one.

When a card is played, all players hear "ACTION_CARD_PLAYED" sound which defaults to
spec/base/resources/sounds/magic-1.mp3 and the card is used, it is removed from the UI completely.

When a player needs to pick one of their cards for an action, their pocket cards become clickable in-place and glow a
bit to hint that.

When a player needs to pick a player, all players available to be picked become clickable in-place and glow a bit
to hint that.

When a player needs to pick a common card, all cards available to be picked become clickable in-place and glow a bit
to hint that.

No additional general text or panel is shown when a player uses a card to guide them through that.

When another player using a card, it moves away from the action cards table to that player and is displayed on top of
them for everyone else. Also, the "ACTION_CARD_TAKEN" sound which defaults to spec/base/resources/sounds/minutochku.mp3
is played.

Every time a card is moved, visually it doesn't teleport immediately, but rather
a moving animation is played that lasts 2 second and moves the card from its origin to destination. This animation is
used
regardless of whether the card is taken from the table, or returned to it. The dedicated card
spots
on the table are always available as precise animation endpoints. Specifically, if a card is being taken from the table,
the animation must start from the card's table spot; if a card is being returned to the table, the animation must end at
its table spot.
These table spot positions must remain trackable at all times, including while the card is held by a player. A card
should never magically "teleport". When it moves, it always looks the same as on the table. The animation should be
realistic and the card should never appear in multiple places at the same time. For example, when the card is flying,
it should not be visible at its origin or destination places. The animation is played for all players
at the same time. If a player was in a different tab when the animation was played, they just won't see it, they would
see the card already at player who uses it. While the card is flying back to the table, the flying card becomes
clickable and available for all players.