const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

const GENRE = { OPEN: 0, MYSTERY: 1, FOLKLORE: 6 };
const STATUS = { CAN_WRITE: 0, NOT_FOUND: 1, SEALED: 2, WROTE_LAST: 3, QUOTA: 4, HIDDEN: 5 };

async function deploy() {
  const [owner, ayu, bima, citra, dewi] = await ethers.getSigners();
  const Sambung = await ethers.getContractFactory("Sambung");
  const sambung = await Sambung.deploy();
  await sambung.waitForDeployment();
  return { sambung, owner, ayu, bima, citra, dewi };
}

/** A short story (6 lines, quota 2) opened by ayu. */
async function withOpenStory() {
  const ctx = await deploy();
  await ctx.sambung.connect(ctx.ayu).startStory("The lamp on the pier", GENRE.MYSTERY, 6, "The lamp went out at nine.");
  return ctx;
}

/** The same story written to the end by ayu, bima and citra. */
async function withSealedStory() {
  const ctx = await withOpenStory();
  const { sambung, ayu, bima, citra } = ctx;
  await sambung.connect(bima).addLine(1, "Nobody on the pier had touched it.");
  await sambung.connect(citra).addLine(1, "Except the boy who sold salted fish.");
  await sambung.connect(ayu).addLine(1, "He swore he only wanted to see the stars.");
  await sambung.connect(bima).addLine(1, "The harbour master did not believe in stars.");
  await sambung.connect(citra).addLine(1, "By morning the lamp was burning again, and the boy was gone.");
  return ctx;
}

describe("Sambung", function () {
  describe("startStory", function () {
    it("opens a story and records the opening line as line one", async function () {
      const { sambung, ayu } = await loadFixture(deploy);

      await expect(sambung.connect(ayu).startStory("The lamp on the pier", GENRE.MYSTERY, 6, "The lamp went out at nine."))
        .to.emit(sambung, "StoryStarted")
        .withArgs(1, ayu.address, GENRE.MYSTERY, 6, "The lamp on the pier")
        .and.to.emit(sambung, "LineAdded")
        .withArgs(1, 0, ayu.address);

      const story = await sambung.getStory(1);
      expect(story.id).to.equal(1);
      expect(story.starter).to.equal(ayu.address);
      expect(story.lastAuthor).to.equal(ayu.address);
      expect(story.title).to.equal("The lamp on the pier");
      expect(story.genre).to.equal(GENRE.MYSTERY);
      expect(story.maxLines).to.equal(6);
      expect(story.lineCount).to.equal(1);
      expect(story.authorCount).to.equal(1);
      expect(story.sealedAt).to.equal(0);
      expect(story.opening).to.equal("The lamp went out at nine.");
      expect(story.latest).to.equal("The lamp went out at nine.");

      const lines = await sambung.getLines(1);
      expect(lines).to.have.lengthOf(1);
      expect(lines[0].author).to.equal(ayu.address);
      expect(lines[0].text).to.equal("The lamp went out at nine.");
    });

    it("accepts the three story lengths and nothing else", async function () {
      const { sambung, ayu } = await loadFixture(deploy);
      for (const len of [6, 12, 18]) {
        await expect(sambung.connect(ayu).startStory("A title", GENRE.OPEN, len, "First.")).not.to.be.reverted;
      }
      for (const len of [0, 3, 5, 7, 9, 15, 24]) {
        await expect(sambung.connect(ayu).startStory("A title", GENRE.OPEN, len, "First.")).to.be.revertedWithCustomError(
          sambung,
          "InvalidLength"
        );
      }
    });

    it("rejects titles outside 3–64 bytes", async function () {
      const { sambung, ayu } = await loadFixture(deploy);
      await expect(sambung.connect(ayu).startStory("ab", GENRE.OPEN, 6, "First.")).to.be.revertedWithCustomError(
        sambung,
        "InvalidTitle"
      );
      await expect(sambung.connect(ayu).startStory("a".repeat(65), GENRE.OPEN, 6, "First.")).to.be.revertedWithCustomError(
        sambung,
        "InvalidTitle"
      );
      await expect(sambung.connect(ayu).startStory("a".repeat(64), GENRE.OPEN, 6, "First.")).not.to.be.reverted;
    });

    it("rejects an unknown genre", async function () {
      const { sambung, ayu } = await loadFixture(deploy);
      await expect(sambung.connect(ayu).startStory("A title", 7, 6, "First.")).to.be.revertedWithCustomError(
        sambung,
        "InvalidGenre"
      );
      await expect(sambung.connect(ayu).startStory("A title", GENRE.FOLKLORE, 6, "First.")).not.to.be.reverted;
    });

    it("rejects an empty or oversized opening line", async function () {
      const { sambung, ayu } = await loadFixture(deploy);
      await expect(sambung.connect(ayu).startStory("A title", GENRE.OPEN, 6, "")).to.be.revertedWithCustomError(
        sambung,
        "InvalidLine"
      );
      await expect(sambung.connect(ayu).startStory("A title", GENRE.OPEN, 6, "x".repeat(281))).to.be.revertedWithCustomError(
        sambung,
        "InvalidLine"
      );
      await expect(sambung.connect(ayu).startStory("A title", GENRE.OPEN, 6, "x".repeat(280))).not.to.be.reverted;
    });

    it("counts bytes, not characters", async function () {
      const { sambung, ayu } = await loadFixture(deploy);
      // "é" is two bytes in UTF-8: 140 of them fit, 141 do not.
      await expect(sambung.connect(ayu).startStory("A title", GENRE.OPEN, 6, "é".repeat(140))).not.to.be.reverted;
      await expect(sambung.connect(ayu).startStory("A title", GENRE.OPEN, 6, "é".repeat(141))).to.be.revertedWithCustomError(
        sambung,
        "InvalidLine"
      );
    });
  });

  describe("addLine", function () {
    it("lets another wallet continue the story", async function () {
      const { sambung, ayu, bima } = await loadFixture(withOpenStory);

      await expect(sambung.connect(bima).addLine(1, "Nobody on the pier had touched it."))
        .to.emit(sambung, "LineAdded")
        .withArgs(1, 1, bima.address);

      const story = await sambung.getStory(1);
      expect(story.lineCount).to.equal(2);
      expect(story.authorCount).to.equal(2);
      expect(story.lastAuthor).to.equal(bima.address);
      expect(story.opening).to.equal("The lamp went out at nine.");
      expect(story.latest).to.equal("Nobody on the pier had touched it.");
      expect(await sambung.linesBy(1, ayu.address)).to.equal(1);
      expect(await sambung.linesBy(1, bima.address)).to.equal(1);
    });

    it("stops the same wallet writing twice in a row", async function () {
      const { sambung, ayu, bima } = await loadFixture(withOpenStory);
      await expect(sambung.connect(ayu).addLine(1, "Me again.")).to.be.revertedWithCustomError(sambung, "NotYourTurn");

      await sambung.connect(bima).addLine(1, "Second.");
      await expect(sambung.connect(bima).addLine(1, "Me again.")).to.be.revertedWithCustomError(sambung, "NotYourTurn");
      await expect(sambung.connect(ayu).addLine(1, "Third.")).not.to.be.reverted;
    });

    it("caps each wallet at a third of the story", async function () {
      const { sambung, ayu, bima, citra } = await loadFixture(withOpenStory);
      await sambung.connect(bima).addLine(1, "Second.");
      await sambung.connect(ayu).addLine(1, "Third."); // ayu now has 2 of 2
      await sambung.connect(bima).addLine(1, "Fourth."); // bima now has 2 of 2

      await expect(sambung.connect(ayu).addLine(1, "Fifth.")).to.be.revertedWithCustomError(sambung, "QuotaReached");
      await expect(sambung.connect(citra).addLine(1, "Fifth.")).not.to.be.reverted;
    });

    it("scales the quota with the story length", async function () {
      const { sambung, ayu, bima } = await loadFixture(deploy);
      await sambung.connect(ayu).startStory("A long one", GENRE.OPEN, 18, "One.");
      // Quota is 6: ayu and bima can alternate until both have written six lines.
      for (let i = 0; i < 5; i++) {
        await sambung.connect(bima).addLine(1, "b");
        await sambung.connect(ayu).addLine(1, "a");
      }
      await sambung.connect(bima).addLine(1, "b");
      expect(await sambung.linesBy(1, ayu.address)).to.equal(6);
      expect(await sambung.linesBy(1, bima.address)).to.equal(6);
      await expect(sambung.connect(ayu).addLine(1, "a")).to.be.revertedWithCustomError(sambung, "QuotaReached");
    });

    it("seals the story on its last line", async function () {
      const { sambung, ayu, bima, citra } = await loadFixture(withOpenStory);
      await sambung.connect(bima).addLine(1, "Two.");
      await sambung.connect(citra).addLine(1, "Three.");
      await sambung.connect(ayu).addLine(1, "Four.");
      await sambung.connect(bima).addLine(1, "Five.");

      await expect(sambung.connect(citra).addLine(1, "Six."))
        .to.emit(sambung, "StorySealed")
        .withArgs(1, 3);

      const story = await sambung.getStory(1);
      expect(story.lineCount).to.equal(6);
      expect(story.sealedAt).to.be.greaterThan(0);
      expect(await sambung.sealedCount()).to.equal(1);
    });

    it("needs at least three authors to finish any story", async function () {
      const { sambung, ayu, bima } = await loadFixture(withOpenStory);
      await sambung.connect(bima).addLine(1, "Two.");
      await sambung.connect(ayu).addLine(1, "Three.");
      await sambung.connect(bima).addLine(1, "Four.");
      // Both are out of quota with two lines still to write.
      await expect(sambung.connect(ayu).addLine(1, "Five.")).to.be.revertedWithCustomError(sambung, "QuotaReached");
      await expect(sambung.connect(bima).addLine(1, "Five.")).to.be.reverted;
      expect((await sambung.getStory(1)).sealedAt).to.equal(0);
    });

    it("refuses lines on a sealed story", async function () {
      const { sambung, dewi } = await loadFixture(withSealedStory);
      await expect(sambung.connect(dewi).addLine(1, "One more.")).to.be.revertedWithCustomError(sambung, "StoryIsSealed");
    });

    it("refuses lines on a story that does not exist", async function () {
      const { sambung, bima } = await loadFixture(withOpenStory);
      await expect(sambung.connect(bima).addLine(0, "Hello.")).to.be.revertedWithCustomError(sambung, "StoryNotFound");
      await expect(sambung.connect(bima).addLine(2, "Hello.")).to.be.revertedWithCustomError(sambung, "StoryNotFound");
    });

    it("refuses empty and oversized lines", async function () {
      const { sambung, bima } = await loadFixture(withOpenStory);
      await expect(sambung.connect(bima).addLine(1, "")).to.be.revertedWithCustomError(sambung, "InvalidLine");
      await expect(sambung.connect(bima).addLine(1, "x".repeat(281))).to.be.revertedWithCustomError(sambung, "InvalidLine");
    });
  });

  describe("writeStatus", function () {
    it("explains why a wallet can or cannot write", async function () {
      const { sambung, owner, ayu, bima, citra, dewi } = await loadFixture(withOpenStory);

      expect(await sambung.writeStatus(9, bima.address)).to.equal(STATUS.NOT_FOUND);
      expect(await sambung.writeStatus(1, bima.address)).to.equal(STATUS.CAN_WRITE);
      expect(await sambung.writeStatus(1, ayu.address)).to.equal(STATUS.WROTE_LAST);

      await sambung.connect(bima).addLine(1, "Two.");
      await sambung.connect(ayu).addLine(1, "Three.");
      await sambung.connect(bima).addLine(1, "Four.");
      expect(await sambung.writeStatus(1, ayu.address)).to.equal(STATUS.QUOTA);

      await sambung.connect(owner).setHidden(1, true);
      expect(await sambung.writeStatus(1, citra.address)).to.equal(STATUS.HIDDEN);
      await sambung.connect(owner).setHidden(1, false);

      await sambung.connect(citra).addLine(1, "Five.");
      await sambung.connect(dewi).addLine(1, "Six.");
      expect(await sambung.writeStatus(1, citra.address)).to.equal(STATUS.SEALED);
    });
  });

  describe("applaud", function () {
    it("lets a reader applaud a sealed story once", async function () {
      const { sambung, dewi } = await loadFixture(withSealedStory);

      await expect(sambung.connect(dewi).applaud(1)).to.emit(sambung, "Applauded").withArgs(1, dewi.address);
      expect((await sambung.getStory(1)).applause).to.equal(1);
      expect(await sambung.hasApplauded(1, dewi.address)).to.equal(true);
      expect(await sambung.totalApplause()).to.equal(1);

      await expect(sambung.connect(dewi).applaud(1)).to.be.revertedWithCustomError(sambung, "AlreadyApplauded");
    });

    it("does not let authors applaud their own story", async function () {
      const { sambung, ayu, citra } = await loadFixture(withSealedStory);
      await expect(sambung.connect(ayu).applaud(1)).to.be.revertedWithCustomError(sambung, "AuthorsCannotApplaud");
      await expect(sambung.connect(citra).applaud(1)).to.be.revertedWithCustomError(sambung, "AuthorsCannotApplaud");
    });

    it("does not allow applause while the story is open", async function () {
      const { sambung, dewi } = await loadFixture(withOpenStory);
      await expect(sambung.connect(dewi).applaud(1)).to.be.revertedWithCustomError(sambung, "StoryStillOpen");
    });

    it("rejects a story that does not exist", async function () {
      const { sambung, dewi } = await loadFixture(withSealedStory);
      await expect(sambung.connect(dewi).applaud(2)).to.be.revertedWithCustomError(sambung, "StoryNotFound");
    });
  });

  describe("pen names and profiles", function () {
    it("stores, replaces and clears a pen name", async function () {
      const { sambung, ayu } = await loadFixture(deploy);

      await expect(sambung.connect(ayu).setPenName("Ayu Laut")).to.emit(sambung, "PenNameSet").withArgs(ayu.address, "Ayu Laut");
      expect((await sambung.profileOf(ayu.address)).penName).to.equal("Ayu Laut");

      await sambung.connect(ayu).setPenName("Ayu");
      expect((await sambung.profileOf(ayu.address)).penName).to.equal("Ayu");

      await sambung.connect(ayu).setPenName("");
      expect((await sambung.profileOf(ayu.address)).penName).to.equal("");
    });

    it("rejects pen names over 32 bytes", async function () {
      const { sambung, ayu } = await loadFixture(deploy);
      await expect(sambung.connect(ayu).setPenName("x".repeat(33))).to.be.revertedWithCustomError(sambung, "InvalidPenName");
      await expect(sambung.connect(ayu).setPenName("x".repeat(32))).not.to.be.reverted;
    });

    it("returns pen names for a list of wallets in order", async function () {
      const { sambung, ayu, bima, citra } = await loadFixture(deploy);
      await sambung.connect(ayu).setPenName("Ayu");
      await sambung.connect(citra).setPenName("Citra");
      expect(await sambung.getPenNames([citra.address, bima.address, ayu.address])).to.deep.equal(["Citra", "", "Ayu"]);
    });

    it("tracks what each wallet has written", async function () {
      const { sambung, ayu, bima, dewi } = await loadFixture(withSealedStory);
      await sambung.connect(bima).startStory("Second story", GENRE.OPEN, 6, "Once.");
      await sambung.connect(ayu).addLine(2, "Twice.");

      const a = await sambung.profileOf(ayu.address);
      expect(a.linesWritten).to.equal(3);
      expect(a.storiesStarted).to.equal(1);
      expect(a.storiesJoined).to.equal(2);

      const b = await sambung.profileOf(bima.address);
      expect(b.linesWritten).to.equal(3);
      expect(b.storiesStarted).to.equal(1);
      expect(b.storiesJoined).to.equal(2);

      expect(await sambung.storiesOf(ayu.address)).to.deep.equal([1n, 2n]);
      expect(await sambung.storiesOf(dewi.address)).to.deep.equal([]);
    });

    it("reports a wallet's line count across several stories", async function () {
      const { sambung, ayu, bima, dewi } = await loadFixture(withSealedStory);
      await sambung.connect(bima).startStory("Second story", GENRE.OPEN, 6, "Once.");
      await sambung.connect(ayu).addLine(2, "Twice.");

      expect(await sambung.linesByMany([1, 2, 99], ayu.address)).to.deep.equal([2n, 1n, 0n]);
      expect(await sambung.linesByMany([2, 1], bima.address)).to.deep.equal([1n, 2n]);
      expect(await sambung.linesByMany([1, 2], dewi.address)).to.deep.equal([0n, 0n]);
      expect(await sambung.linesByMany([], ayu.address)).to.deep.equal([]);
    });
  });

  describe("lists and stats", function () {
    it("pages stories newest first", async function () {
      const { sambung, ayu } = await loadFixture(deploy);
      for (let i = 1; i <= 5; i++) {
        await sambung.connect(ayu).startStory(`Story ${i}`, GENRE.OPEN, 6, `Opening ${i}`);
      }

      const [first, next] = await sambung.getStories(0, 2);
      expect(first.map((s) => s.id)).to.deep.equal([5n, 4n]);
      expect(next).to.equal(3);

      const [second, next2] = await sambung.getStories(next, 2);
      expect(second.map((s) => s.id)).to.deep.equal([3n, 2n]);
      expect(next2).to.equal(1);

      const [third, next3] = await sambung.getStories(next2, 2);
      expect(third.map((s) => s.id)).to.deep.equal([1n]);
      expect(next3).to.equal(0);
    });

    it("returns an empty page when there are no stories", async function () {
      const { sambung } = await loadFixture(deploy);
      const [page, next] = await sambung.getStories(0, 10);
      expect(page).to.have.lengthOf(0);
      expect(next).to.equal(0);
    });

    it("clamps the cursor and the page size", async function () {
      const { sambung, ayu } = await loadFixture(deploy);
      for (let i = 1; i <= 3; i++) {
        await sambung.connect(ayu).startStory(`Story ${i}`, GENRE.OPEN, 6, "Opening");
      }
      const [page] = await sambung.getStories(99, 500);
      expect(page.map((s) => s.id)).to.deep.equal([3n, 2n, 1n]);
    });

    it("fetches stories by id and leaves gaps for unknown ids", async function () {
      const { sambung } = await loadFixture(withSealedStory);
      const page = await sambung.getStoriesByIds([1, 42]);
      expect(page[0].id).to.equal(1);
      expect(page[0].title).to.equal("The lamp on the pier");
      expect(page[1].id).to.equal(0);
      expect(page[1].starter).to.equal(ethers.ZeroAddress);
    });

    it("reverts getStory for an unknown id", async function () {
      const { sambung } = await loadFixture(deploy);
      await expect(sambung.getStory(1)).to.be.revertedWithCustomError(sambung, "StoryNotFound");
    });

    it("keeps running totals", async function () {
      const { sambung, dewi } = await loadFixture(withSealedStory);
      await sambung.connect(dewi).applaud(1);
      await sambung.connect(dewi).startStory("Another", GENRE.OPEN, 12, "Go.");

      const s = await sambung.stats();
      expect(s.stories).to.equal(2);
      expect(s.sealedStories).to.equal(1);
      expect(s.lines).to.equal(7);
      expect(s.authors).to.equal(4);
      expect(s.applause).to.equal(1);
    });
  });

  describe("owner", function () {
    it("lets only the owner hide and unhide a story", async function () {
      const { sambung, owner, ayu } = await loadFixture(withOpenStory);

      await expect(sambung.connect(ayu).setHidden(1, true)).to.be.revertedWithCustomError(sambung, "NotOwner");
      await expect(sambung.connect(owner).setHidden(1, true)).to.emit(sambung, "StoryHiddenSet").withArgs(1, true);
      expect((await sambung.getStory(1)).hidden).to.equal(true);

      await sambung.connect(owner).setHidden(1, false);
      expect((await sambung.getStory(1)).hidden).to.equal(false);
    });

    it("blocks writing and applause on a hidden story but keeps its text", async function () {
      const { sambung, owner, bima, dewi } = await loadFixture(withOpenStory);
      await sambung.connect(owner).setHidden(1, true);
      await expect(sambung.connect(bima).addLine(1, "Two.")).to.be.revertedWithCustomError(sambung, "StoryIsHidden");
      expect((await sambung.getLines(1))[0].text).to.equal("The lamp went out at nine.");

      const sealed = await loadFixture(withSealedStory);
      await sealed.sambung.connect(sealed.owner).setHidden(1, true);
      await expect(sealed.sambung.connect(sealed.dewi).applaud(1)).to.be.revertedWithCustomError(
        sealed.sambung,
        "StoryIsHidden"
      );
      expect(dewi.address).to.be.properAddress;
    });

    it("cannot hide a story that does not exist", async function () {
      const { sambung, owner } = await loadFixture(deploy);
      await expect(sambung.connect(owner).setHidden(1, true)).to.be.revertedWithCustomError(sambung, "StoryNotFound");
    });

    it("transfers ownership", async function () {
      const { sambung, owner, ayu } = await loadFixture(deploy);
      await expect(sambung.connect(ayu).transferOwnership(ayu.address)).to.be.revertedWithCustomError(sambung, "NotOwner");
      await expect(sambung.connect(owner).transferOwnership(ethers.ZeroAddress)).to.be.revertedWithCustomError(
        sambung,
        "ZeroAddress"
      );
      await expect(sambung.connect(owner).transferOwnership(ayu.address))
        .to.emit(sambung, "OwnershipTransferred")
        .withArgs(owner.address, ayu.address);
      expect(await sambung.owner()).to.equal(ayu.address);
    });
  });

  describe("gas", function () {
    it("stays within the budget the PRD quotes", async function () {
      const { sambung, ayu, bima, citra, dewi } = await loadFixture(deploy);
      const line = "x".repeat(140);

      const deployTx = sambung.deploymentTransaction();
      const deployGas = (await deployTx.wait()).gasUsed;

      const start = await (await sambung.connect(ayu).startStory("The lamp on the pier", 1, 6, line)).wait();
      const add = await (await sambung.connect(bima).addLine(1, line)).wait();
      await sambung.connect(citra).addLine(1, line);
      await sambung.connect(ayu).addLine(1, line);
      await sambung.connect(bima).addLine(1, line);
      await sambung.connect(citra).addLine(1, line);
      const clap = await (await sambung.connect(dewi).applaud(1)).wait();

      console.log(
        `      gas — deploy ${deployGas}, startStory ${start.gasUsed}, addLine ${add.gasUsed}, applaud ${clap.gasUsed}`
      );
      expect(deployGas).to.be.lessThan(3_000_000n);
      expect(start.gasUsed).to.be.lessThan(450_000n);
      expect(add.gasUsed).to.be.lessThan(350_000n);
      expect(clap.gasUsed).to.be.lessThan(100_000n);
    });
  });
});
