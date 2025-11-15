OK, I need your help to write this with me. I have a few different scripts:
- fetch-deposit-logs-volt1 has just been fetching for one given volt all the users.
- fetch-felix-deposit-volts is for all the volts that I fetched, all the addresses that's connected to this.
- fetch-felix-with-volta-lateral is for all the marques people that with-volta-lateral I fetched it from here.  Associated JS are in either hyperEVM or the root. Then I have a few unique users I just need to merge them to have all the users that interacted either with Felix or Morpho.

Then, filterOnlyForFelix goes through all the markets logs & filter if it's a felix vault or not.

uniqueUsers.json -> Interacted with one felix vault
uniqueUsers2.json -> Interacted with any felix market
