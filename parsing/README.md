## Details on each step of parsing are included in their folders

This repo can automatically run a parsing test from AIA > JSON > AIA and write the results to designated `output[ext]` files located in each folder.

The chain begins with `./actionToJSON/input.aia`, which is the only static file. To start this process:

```bash
# On the root folder of the repo, not this one.
npm run parse
```

This will rewrite every `.json` file inside the actionToJSON folder and produce `output.json` which itself is fed into jsonToAction, finally writing the JSON > AIA result as `output.aia`.
