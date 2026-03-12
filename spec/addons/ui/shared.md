# About This File

This file describes the UI that addons bring and that is shared across multiple places (multiple pages, etc.).

# List of Addons

Every time a list of addons is displayed somewhere in the app, it is displayed in 2 columns:
First, there is a list of all negative addons, then next to it is a list of all positive addons. Each of the 2 lists
has a header and its own background. The negative addons have subtle red background, the positive addons have subtle
green background. The overall panel with addons should adapt its width accordingly to the width of each of the lists.
The order of the addons is exactly the same as the order they are described in the spec.

The players see the list of short names of the addons. On the right side to each addon there's a question mark sign. All
question marks are aligned in a single column. If player hovers over the sign, they see the full description of the
addon. Full description is shown as an additional panel that appears when the player hovers over the question mark sign.
Hovering over the description itself, but not hovering over the question mark sign hides the description (it's not
hoverable). When hovering over a row of an addon, the row becomes a bit lighter so that it's clearly visible which
question mark sing corresponds to which addon name.

Above these 2 columns there's a header "Addons" in the same style and color as "Volume" text above it, but in uppercase.

List of addons is always displayed on top any other element in the game. Nothing should block the list of addons, its
buttons and on-hover descriptions.

# Stop Game Button

Pressing the Stop Game button sets up the new empty lobby exactly as the previous one that was just over, meaning it
should have the same addons code.