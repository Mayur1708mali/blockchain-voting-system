const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("VotingContract", function () {
  let votingContract;
  let owner;
  let voter1;
  let voter2;
  let voter3;

  beforeEach(async function () {
    [owner, voter1, voter2, voter3] = await ethers.getSigners();

    const VotingContract = await ethers.getContractFactory("VotingContract");
    votingContract = await VotingContract.deploy();
    await votingContract.waitForDeployment();
  });

  describe("Election Creation", function () {
    it("should allow owner to create an election", async function () {
      await expect(votingContract.createElection(1, 3, 0))
        .to.emit(votingContract, "ElectionCreated")
        .withArgs(1, 3, 0);

      const election = await votingContract.elections(1);
      expect(election.candidateCount).to.equal(3);
      expect(election.status).to.equal(0); // Active
      expect(election.exists).to.be.true;
    });

    it("should not allow non-owner to create an election", async function () {
      await expect(
        votingContract.connect(voter1).createElection(1, 3, 0)
      ).to.be.revertedWithCustomError(votingContract, "OwnableUnauthorizedAccount");
    });

    it("should not allow creating election with less than 2 candidates", async function () {
      await expect(
        votingContract.createElection(1, 1, 0)
      ).to.be.revertedWith("At least 2 candidates required");
    });

    it("should not allow creating duplicate election IDs", async function () {
      await votingContract.createElection(1, 3, 0);
      await expect(
        votingContract.createElection(1, 3, 0)
      ).to.be.revertedWith("Election already exists");
    });

    it("should not allow invalid election type", async function () {
      await expect(
        votingContract.createElection(1, 3, 2)
      ).to.be.revertedWith("Invalid election type");
    });
  });

  describe("Vote Casting", function () {
    beforeEach(async function () {
      await votingContract.createElection(1, 3, 0); // 3 candidates, single choice
    });

    it("should allow a voter to cast a vote", async function () {
      await expect(votingContract.connect(voter1).castVote(1, 0))
        .to.emit(votingContract, "VoteCast")
        .withArgs(1, voter1.address, 0);
    });

    it("should not allow double voting", async function () {
      await votingContract.connect(voter1).castVote(1, 0);
      await expect(
        votingContract.connect(voter1).castVote(1, 1)
      ).to.be.revertedWith("You have already voted in this election");
    });

    it("should not allow voting for invalid candidate index", async function () {
      await expect(
        votingContract.connect(voter1).castVote(1, 5)
      ).to.be.revertedWith("Invalid candidate index");
    });

    it("should not allow voting in non-existent election", async function () {
      await expect(
        votingContract.connect(voter1).castVote(99, 0)
      ).to.be.revertedWith("Election does not exist");
    });

    it("should track hasVoted correctly", async function () {
      expect(await votingContract.checkHasVoted(1, voter1.address)).to.be.false;
      await votingContract.connect(voter1).castVote(1, 0);
      expect(await votingContract.checkHasVoted(1, voter1.address)).to.be.true;
    });

    it("should track total votes correctly", async function () {
      await votingContract.connect(voter1).castVote(1, 0);
      await votingContract.connect(voter2).castVote(1, 1);
      await votingContract.connect(voter3).castVote(1, 0);

      expect(await votingContract.getTotalVotes(1)).to.equal(3);
    });
  });

  describe("Election Closing", function () {
    beforeEach(async function () {
      await votingContract.createElection(1, 3, 0);
    });

    it("should allow owner to close an election", async function () {
      await expect(votingContract.closeElection(1))
        .to.emit(votingContract, "ElectionClosed")
        .withArgs(1);
    });

    it("should not allow non-owner to close an election", async function () {
      await expect(
        votingContract.connect(voter1).closeElection(1)
      ).to.be.revertedWithCustomError(votingContract, "OwnableUnauthorizedAccount");
    });

    it("should not allow voting after election is closed", async function () {
      await votingContract.closeElection(1);
      await expect(
        votingContract.connect(voter1).castVote(1, 0)
      ).to.be.revertedWith("Election is not active");
    });

    it("should not allow closing an already closed election", async function () {
      await votingContract.closeElection(1);
      await expect(
        votingContract.closeElection(1)
      ).to.be.revertedWith("Election is not active");
    });
  });

  describe("Results", function () {
    beforeEach(async function () {
      await votingContract.createElection(1, 3, 0);
      await votingContract.connect(voter1).castVote(1, 0);
      await votingContract.connect(voter2).castVote(1, 0);
      await votingContract.connect(voter3).castVote(1, 2);
    });

    it("should not allow getting results while election is active", async function () {
      await expect(
        votingContract.getResults(1)
      ).to.be.revertedWith("Election is still active - results hidden");
    });

    it("should return correct results after election is closed", async function () {
      await votingContract.closeElection(1);
      const results = await votingContract.getResults(1);

      expect(results[0]).to.equal(2); // candidate 0: 2 votes
      expect(results[1]).to.equal(0); // candidate 1: 0 votes
      expect(results[2]).to.equal(1); // candidate 2: 1 vote
    });

    it("should return election status correctly", async function () {
      expect(await votingContract.getElectionStatus(1)).to.equal(0); // Active
      await votingContract.closeElection(1);
      expect(await votingContract.getElectionStatus(1)).to.equal(1); // Closed
    });
  });
});
