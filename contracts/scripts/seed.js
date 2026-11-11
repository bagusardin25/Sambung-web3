// Fills a LOCAL chain with sample stories so the interface has something to show.
// Refuses to run anywhere else: sample text does not belong on a public network.
//
//   npx hardhat run scripts/seed.js --network localhost
const fs = require("fs");
const path = require("path");
const hre = require("hardhat");

const GENRE = { OPEN: 0, MYSTERY: 1, ROMANCE: 2, COMEDY: 3, HORROR: 4, SCIFI: 5, FOLKLORE: 6 };

async function main() {
  const { ethers, network } = hre;
  if (network.name !== "localhost" && network.name !== "hardhat") {
    throw new Error(`seed.js only runs on a local chain, not "${network.name}".`);
  }

  const file = path.join(__dirname, "..", "deployments", "localhost.json");
  if (!fs.existsSync(file)) throw new Error("Deploy first: npx hardhat run scripts/deploy.js --network localhost");
  const { address } = JSON.parse(fs.readFileSync(file, "utf8"));

  // Account 0 is the owner and the dev wallet used in the browser; keep it free of lines
  // so it can still write and applaud everywhere.
  const [, ayu, bima, citra, dewi, eko, fitri] = await ethers.getSigners();
  const sambung = await ethers.getContractAt("Sambung", address);
  const as = (signer) => sambung.connect(signer);
  const send = async (tx) => (await tx).wait();

  await send(as(ayu).setPenName("Ayu Laut"));
  await send(as(bima).setPenName("Bima"));
  await send(as(citra).setPenName("citra.writes"));
  await send(as(eko).setPenName("Pak Eko"));

  // 1 — sealed, short
  await send(as(ayu).startStory("The lamp on the pier", GENRE.MYSTERY, 6, "The lamp at the end of the pier went out at nine, the way it never had."));
  await send(as(bima).addLine(1, "Nobody admitted to touching it, though the ladder was still warm."));
  await send(as(citra).addLine(1, "The boy who sold salted fish said he had only wanted to see the stars."));
  await send(as(ayu).addLine(1, "The harbour master, who did not believe in stars, wrote his name down anyway."));
  await send(as(bima).addLine(1, "That night three boats came home by a light none of them could later describe."));
  await send(as(citra).addLine(1, "By morning the lamp was burning again, and the ladder was gone."));
  await send(as(dewi).applaud(1));
  await send(as(eko).applaud(1));
  await send(as(fitri).applaud(1));

  // 2 — open, classic, halfway
  await send(as(citra).startStory("Grandmother's rice cooker", GENRE.COMEDY, 12, "Grandmother's rice cooker had opinions, and it shared them at dawn."));
  await send(as(eko).addLine(2, "Mostly it disapproved of instant noodles, which it called 'a cry for help'."));
  await send(as(ayu).addLine(2, "My cousin tried unplugging it once. It finished the sentence on battery."));
  await send(as(citra).addLine(2, "We learned to negotiate: one pot of proper rice bought a day of silence."));
  await send(as(dewi).addLine(2, "Then the neighbours bought an air fryer, and the two of them began to talk through the wall."));

  // 3 — open, short, one line from the end
  await send(as(bima).startStory("Last train to Kota", GENRE.ROMANCE, 6, "She always took the last train, and so, eventually, did he."));
  await send(as(dewi).addLine(3, "For a month they shared a carriage and not a single word."));
  await send(as(fitri).addLine(3, "He practised hello on the platform until the announcer started saying it back."));
  await send(as(bima).addLine(3, "On the night he finally spoke, the train was cancelled."));
  await send(as(dewi).addLine(3, "They walked the nine stations instead, arguing happily about which one was hers."));

  // 4 — sealed, short
  await send(as(eko).startStory("The well that answered", GENRE.FOLKLORE, 6, "In the dry season the village well began returning what was said into it, a day late."));
  await send(as(fitri).addLine(4, "Children shouted jokes at dusk and collected the laughter the next evening."));
  await send(as(ayu).addLine(4, "The headman whispered a secret into it, and spent a sleepless night by the rim."));
  await send(as(eko).addLine(4, "At dusk the well repeated it, slowly, in his own voice, to everyone drawing water."));
  await send(as(fitri).addLine(4, "He was a better headman afterwards, having nothing left to hide."));
  await send(as(ayu).addLine(4, "The rains came, the well went quiet, and people found they missed being answered."));
  await send(as(bima).applaud(4));
  await send(as(citra).applaud(4));

  // 5 — open, long, just started
  await send(as(dewi).startStory("Signal from the mangroves", GENRE.SCIFI, 18, "The buoy had been dead for six years when it started transmitting again."));
  await send(as(bima).addLine(5, "Not data. A rhythm, the kind you tap on a table while waiting for someone."));

  // 6 — open, short, only the opening line
  await send(as(fitri).startStory("House rules", GENRE.HORROR, 6, "The landlord's only rule was written on the inside of the front door: do not answer the second knock."));

  const s = await sambung.stats();
  console.log(`Seeded ${s.stories} stories (${s.sealedStories} sealed), ${s.lines} lines, ${s.authors} authors, ${s.applause} applause.`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
