# A Game of nomic

This is our game of nomic. If you wish to join, read through the laws.
In order to become an active player, submit a Pull Request into the players.yaml file
with your github username and points of 0. (Verify this process against the laws)

## Automation

This repository is being watched by our friend the Nomic Bot.
Nomic Bot watches comments and will respond to commands. 

### Voting

**yay**

**nay**

For Proposal PRs which require a vote, Nomic Bot will count votes and determine if the proposal has a quorum and if it is currently passing, failing, or tied.
It will apply the appropriate labels to the PR. As per rule **304**:

> **304.** PARSING VOTES: A vote must be a Pull Request (PR) comment containing only a "yay" (a vote for a proposal) or a "nay" (a vote against a proposal). Case sensitivity is irrelevant. 
> It is important, for parsing, that no other non-space characters be included in the comment body. The comment must be attached to the PR itself, and not associated with any specific file.

### Proposal Management

#### /open

In order for a vote on a proposal to be proper, the proposal must be in an "Open For Voting" state. 
This is managed through the PR's label. 
Active Players who are not repository administrators are unable to add labels to their PR.
For this, Nomic bot will listen for a PR comment of **/open**.
This will allow only allow the creator of the PR, if they are an Active Player, to add the "Open For Voting" label, and thus put the PR in the corresponding state.

### Dice Rolling and Randomness

Throughout the game, there are actions which require an element of randomness.
Any rule which indicates a dice roll, or other random number must be determined will be governed by Nomic Bot using the **/roll** command.

The **/roll** command uses a variety of generation strings which determine the variance and output of the random generation.
Currently, the following formats are accepted:

- **/roll #d#** - (Ex: /roll 3d6) Indicates 3 six sided dice should be rolled and their results reported individually.
- **/roll #d#+#** - (Ex: /roll 3d6+4) Indicates 3 six sided dice should be rolled, their results should be added together, and 4 should be added to the total.
- **/roll #d#+** - (Ex: /roll 3d6+) Indicates 3 six sided dice should be rolled and their results should be added together. This is the same as */roll 3d6+0*
- **/roll #d#-#** - (Ex: /roll 3d6-1) Indicates 3 six sided dice should be rolled, their results should be added together, and 1 should be subtracted from the total.

Nomic Bot will reply in the same comment thread as the roll request with the results.

In the event Nomic Bot does not understand the requested roll, it will reply with the regular expression patterns used to match the roll commands.

To prevent Nomic Bot from consuming too many resources, there is a limit to the number of dice to be rolled.
Any attempt to have Nomic Bot roll too many dice will cause it great discomfort and it will lash out.
The Nomic Bot creators and their affiliates are not responsible for any aggression, or passive aggression by the Nomic Bot unleashed on account of abuse.

### Purchases

Throughout the game, there may be opportunities to buy items, equipment, resources, etc...
Nomic Bot will interpret the **/buy** command as an attempt to procure something.
It must first be aware of what it is you intend to purchase and it's cost.
These must be programmed and defined in the laws. 
Currently, only Active Players are allowed to purchase anything.

The **/buy** command follows this format **/buy # item(s)**.
Where *#* is the number of *item(s)* you wish to buy.
It is not required, and if it is omitted, Nomic Bot assumes a quantity of 1.
*item(s)* must be in the list of available items.

If you do not have enough points for the procurement, Nomic Bot will respond with a comment indicating this, and the purchase will fail.

If you do have enough points for the procurement, Nomic Bot will modify the player record file with your updated point value, and the purchased item.
For items which activate, or otherwise have some action upon purchase, 
the result of the action will be in the commit message of the player record file, 
and in a comment reply to the thread where the **/buy** command was used.

Example commands:

- */buy farm* - Will attempt to buy 1 farm
- */buy 1 farm* - Will attempt to buy 1 farm
- */buy 1 farms* - Will attempt to buy 1 farm
- */buy 8 farm* - Will attempt to buy 8 farms
- */buy      8       FaRmS* - Will attempt to buy 8 farms *(ie.: Case sensitivity and white space is irrelevant, you just look like a psycho in your purchase request)* 

#### Available Items

The following items are currently available for purchase:

**farm**: 10 points

### Scheduled Processes

Throughout the game, there may be rules which operate on a schedule which manipulate player data.
These schedules are run by Nomic Bot.

#### Hunger

As of rule **329** and **330** Which state:

>**329.** **FARM PRODUCTION:** Farms produce enough food to feed 1d12+12 people per week.

>**330.** **FEED THE PEOPLE:** 
>  - **SECTION 1** Active Players with a Village must have enough Farms to feed the Village's Population or become at risk for Starvation.
>
>  - **SECTION 2** Hunger will occur once per week. The Hunger will be equal to the Village's Population at the time of calculation.
>
>  - **SECTION 3** Farm production will be calculated at the time of Hunger and used to reduce the Village's Hunger.
>   
>  - **SECTION 4** If there is a positive Hunger value after Farm production, an issue will be created and assigned to the Active Player.
>   
>  - **SECTION 5** During the next week, the Active Player may purchase additional Farms which will immediatly calculate production, and reduce the Hunger value.
>
>  - **SECTION 6** A negative Hunger value indicates a surplus and will be considered stored, and used to reduce the next Hunger calculation.
>
>  - **SECTION 7** If a Village has a pre-existing positive Hunger value when Hunger strikes, Starvation will occur and the village's population will be reduced by the Hunger value.

The hunger process Will perform these calculations once per week.
In the event of an Active Player's Village becoming at risk of Starvation,
Nomic Bot will create a Hunger Issue and assign it to the Active Player.
In that issue, the player may comment with the **/buy farm** command in an attempt to reduce their Starvation.
If there is a positive hunger value in the player's village when the next Hunger calculation takes place,
Nomic Bot will reduce the player's village population accordingly.