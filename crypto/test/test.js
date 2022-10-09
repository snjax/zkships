const { expect, assert } = require("chai")
const { ethers, upgrades, waffle, hardhatArguments } = require("hardhat")
const { keccak256 } = require('@ethersproject/solidity')

const TokenRole = {
  NoRole: 0,
  Original: 1,
  Modifier: 2,
}


describe("zkShips Test Suite", () => {
  let alice, bob
  let zkShipsContract
  let testingNFTContract1, testingNFTContract2, testingNFTContract3

  before(async () => {
    [admin, alice, bob, charlie] = await ethers.getSigners()
    const BundleNFTFactory = await ethers.getContractFactory("BundleNFT", admin)
    const bundleDeployTx = await BundleNFTFactory.deploy()
    bundleContract = await bundleDeployTx.deployed()
  })
  beforeEach(async () => {
    const TestingNFTContract = await ethers.getContractFactory("TestingNFT", admin)
    const testingNFTContract1DeployTx = await TestingNFTContract.deploy(alice.address, 10)
    testingNFTContract1 = (await testingNFTContract1DeployTx.deployed()).address
    const testingNFTContract2DeployTx = await TestingNFTContract.deploy(alice.address, 10)
    testingNFTContract2 = (await testingNFTContract2DeployTx.deployed()).address
    const testingNFTContract3DeployTx = await TestingNFTContract.deploy(bob.address, 10)
    testingNFTContract3 = (await testingNFTContract3DeployTx.deployed()).address
  });

  const approveTokens = async (signer, ...args) => {
    for (let i = 0; i < args.length; i += 2) {
      const [nftAddress, tokens] = [args[i], args[i+1]]
      const contract = (await ethers.getContractFactory("TestingNFT")).attach(nftAddress).connect(signer)
      for (let tokenIdx = 0; tokenIdx < tokens.length; ++tokenIdx) {
        const tx = await contract.approve(bundleContract.address, tokens[tokenIdx])
        await tx.wait()
      }
    }
  }

  const pauseContract = async (signer, nftAddress) => {
    const contract = (await ethers.getContractFactory("TestingNFT")).attach(nftAddress).connect(signer)
    const tx = await contract.pause()
    await tx.wait()
  }
  const unpauseContract = async (signer, nftAddress) => {
    const contract = (await ethers.getContractFactory("TestingNFT")).attach(nftAddress).connect(signer)
    const tx = await contract.unpause()
    await tx.wait()
  }

  const extractBundleID = (effects) => {
    const mints = effects.events.filter(e => e.event === "MintMessage")
    assert(mints.length === 1)
    return mints[0].args[0]
  }

  it("Creates a bundle", async () => {
    await approveTokens(alice, testingNFTContract1, [0, 1, 2, 3, 4, 5], testingNFTContract2, [3, 4, 5])
    const contract = bundleContract.connect(alice)
    const bundlingTx = await contract.bundle([
      [testingNFTContract1, 1, TokenRole.Modifier], [testingNFTContract2, 4, TokenRole.Original]
    ], {value: "33300000000000000"})
    const txEffects = await bundlingTx.wait()
    
    const bundleID = extractBundleID(txEffects)
    const bundledTokens = await bundleContract.bundeledTokensOf(bundleID)
    assert(bundledTokens.length === 2)
    assert(bundledTokens[0].token === testingNFTContract1)
    assert(bundledTokens[0].tokenId == 1)
    assert(bundledTokens[0].role == 2)
    assert(bundledTokens[1].token === testingNFTContract2)
    assert(bundledTokens[1].tokenId == 4)
    assert(bundledTokens[1].role == 1)
    assert((await bundleContract.ownerOf(bundleID)) == alice.address);
    const bundleIDByIndex = await contract.tokenOfOwnerByIndex(alice.address, "0");
    assert(bundleIDByIndex.toString() === bundleID.toString(), `${bundleIDByIndex} != ${bundleID}`);

    const nft1Contract = (await ethers.getContractFactory("TestingNFT")).attach(testingNFTContract1)
    assert((await nft1Contract.ownerOf(1)) != alice.address);
    for (let i = 0; i < 6; ++i) {
      if (i === 1) continue;
      assert((await nft1Contract.ownerOf(i)) == alice.address);
    }

    const nft2Contract = (await ethers.getContractFactory("TestingNFT")).attach(testingNFTContract2)
    assert((await nft2Contract.ownerOf(4)) != alice.address);
    for (let i = 0; i < 6; ++i) {
      if (i === 4) continue;
      assert((await nft2Contract.ownerOf(i)) == alice.address);
    }
  })

  it("Creates a bundle with a base", async () => {
    await approveTokens(alice, testingNFTContract1, [0, 1, 2, 3, 4, 5], testingNFTContract2, [3, 4, 5])
    const contract = bundleContract.connect(alice)
    const bundlingTx = await contract.bundle([
	    // Section 0
	    [testingNFTContract1, 1, TokenRole.Original], [testingNFTContract2, 4, TokenRole.Modifier],
      [testingNFTContract1, 3, TokenRole.NoRole], [testingNFTContract2, 3, TokenRole.NoRole],
    ], {value: "33300000000000000"})
    const txEffects = await bundlingTx.wait()
    
    const bundleID = extractBundleID(txEffects)
    const bundledTokens = await bundleContract.bundeledTokensOf(bundleID)
    assert(bundledTokens.length === 4)
    assert(bundledTokens[0].token === testingNFTContract1)
    assert(bundledTokens[0].tokenId == 1)
    assert(bundledTokens[0].role == 1)
    assert(bundledTokens[1].token === testingNFTContract2)
    assert(bundledTokens[1].tokenId == 4)
    assert(bundledTokens[1].role == 2)
    assert(bundledTokens[2].token === testingNFTContract1)
    assert(bundledTokens[2].tokenId == 3)
    assert(bundledTokens[2].role == 0)
    assert(bundledTokens[3].token === testingNFTContract2)
    assert(bundledTokens[3].tokenId == 3)
    assert(bundledTokens[3].role == 0)

    assert((await bundleContract.ownerOf(bundleID)) == alice.address);
    const nft1Contract = (await ethers.getContractFactory("TestingNFT")).attach(testingNFTContract1)
    assert((await nft1Contract.ownerOf(1)) != alice.address);
    for (let i = 0; i < 6; ++i) {
      if (i === 1 || i === 3) continue;
      assert((await nft1Contract.ownerOf(i)) == alice.address);
    }

    const nft2Contract = (await ethers.getContractFactory("TestingNFT")).attach(testingNFTContract2)
    assert((await nft2Contract.ownerOf(4)) != alice.address);
    for (let i = 0; i < 6; ++i) {
      if (i === 3 || i === 4) continue;
      assert((await nft2Contract.ownerOf(i)) == alice.address);
    }
  })

  it("Checks who owns NFT before adding", async () => {
    await approveTokens(alice, testingNFTContract1, [0, 1, 2, 3, 4, 5], testingNFTContract2, [3, 4, 5])
    await approveTokens(bob, testingNFTContract3, [0])
    const contract = bundleContract.connect(alice)
    const bundlingTx = await contract.bundle([
	    [testingNFTContract1, 1, TokenRole.NoRole], [testingNFTContract2, 4, TokenRole.NoRole],
      [testingNFTContract1, 3, TokenRole.NoRole], [testingNFTContract2, 3, TokenRole.NoRole],
    ], {value: "33300000000000000"})
    const txEffects = await bundlingTx.wait()
    const bundleID = extractBundleID(txEffects)

    // Add NFT
    try {
        await contract.addNFTsToBundle(
          bundleID,
          [[testingNFTContract3, 0, TokenRole.NoRole]],
          "",
          {value: "15000000000000000"});
	      assert(1 === 2, "This should not happen");
    } catch (e) {
	      assert(e.toString().indexOf("ERC721: transfer from incorrect owner") >= 0, e.toString())
    }
  })
	  
  it("Adds NFT", async () => {
    await approveTokens(alice, testingNFTContract1, [0, 1, 2, 3, 4, 5], testingNFTContract2, [3, 4, 5])
    const contract = bundleContract.connect(alice)
    const bundlingTx = await contract.bundle([
	    [testingNFTContract1, 1, TokenRole.Original], [testingNFTContract2, 4, TokenRole.NoRole],
      [testingNFTContract1, 3, TokenRole.Modifier], [testingNFTContract2, 3, TokenRole.NoRole],
    ], {value: "33300000000000000"})
    const txEffects = await bundlingTx.wait()
    const bundleID = extractBundleID(txEffects)

    await (await contract.addNFTsToBundle(
      bundleID,
      [[testingNFTContract1, 2, TokenRole.NoRole], [testingNFTContract2, 5, TokenRole.NoRole]],
      "", {value: "15000000000000000"})
    ).wait();

    const bundledTokens = await bundleContract.bundeledTokensOf(bundleID)
    assert(bundledTokens.length === 6)
    assert(bundledTokens[0].token === testingNFTContract1)
    assert(bundledTokens[0].tokenId == 1)
    assert(bundledTokens[0].role === 1)
    assert(bundledTokens[1].token === testingNFTContract2)
    assert(bundledTokens[1].tokenId == 4)
    assert(bundledTokens[1].role === 0)
    assert(bundledTokens[2].token === testingNFTContract1)
    assert(bundledTokens[2].tokenId == 3)
    assert(bundledTokens[2].role === 2)
    assert(bundledTokens[3].token === testingNFTContract2)
    assert(bundledTokens[3].tokenId == 3)
    assert(bundledTokens[3].role === 0)
    assert(bundledTokens[4].token === testingNFTContract1)
    assert(bundledTokens[4].tokenId == 2)
    assert(bundledTokens[4].role === 0)
    assert(bundledTokens[5].token === testingNFTContract2)
    assert(bundledTokens[5].tokenId == 5)
    assert(bundledTokens[5].role === 0)

    assert((await bundleContract.ownerOf(bundleID)) == alice.address);
  })

  it("Adding NFTs by not authorized person fails", async () => {
    await approveTokens(alice, testingNFTContract1, [0, 1, 2, 3, 4, 5], testingNFTContract2, [3, 4, 5])
    await approveTokens(bob, testingNFTContract3, [0])
    const contract = bundleContract.connect(alice)
    const bundlingTx = await contract.bundle([
	    [testingNFTContract1, 1, TokenRole.NoRole], [testingNFTContract2, 4, TokenRole.NoRole],
      [testingNFTContract1, 3, TokenRole.NoRole], [testingNFTContract2, 3, TokenRole.NoRole],
    ], {value: "33300000000000000"})
    const txEffects = await bundlingTx.wait()
    const bundleID = extractBundleID(txEffects)

    const contractAsBob = bundleContract.connect(bob)
    try {
        await (await contractAsBob.addNFTsToBundle(bundleID, [[testingNFTContract3, 0, TokenRole.NoRole]], "", {value: "15000000000000000"})).wait();
        assert(1 == 2, "Should not get here");
    } catch (e) {
	      // assert(e.toString().indexOf("E02") >= 0, e.toString())
    }
  });

  it("Removing NFTs by not authorized person fails", async () => {
    await approveTokens(alice, testingNFTContract1, [0, 1, 2, 3, 4, 5], testingNFTContract2, [3, 4, 5])
    const contract = bundleContract.connect(alice)
    const bundlingTx = await contract.bundle([
	    [testingNFTContract1, 1, TokenRole.NoRole], [testingNFTContract2, 4, TokenRole.NoRole],
      [testingNFTContract1, 3, TokenRole.NoRole], [testingNFTContract2, 3, TokenRole.NoRole],
    ], {value: "33300000000000000"})
    const txEffects = await bundlingTx.wait()
    const bundleID = extractBundleID(txEffects)

    const contractAsBob = bundleContract.connect(bob)
    try {
        await (await contractAsBob.removeNFTsFromBundle(
          bundleID,
          [[testingNFTContract1, 1, TokenRole.NoRole]],
          "", {value: "15000000000000000"})).wait();
        assert(1 == 2, "Should not get here");
    } catch (e) {
        // assert(e.toString().indexOf("E02") >= 0, e.toString())
    }
  });

  it("Adding paused NFTs fails", async () => {
    await approveTokens(alice, testingNFTContract1, [0, 1, 2, 3, 4, 5], testingNFTContract2, [3, 4, 5])
    const contract = bundleContract.connect(alice)
    const bundlingTx = await contract.bundle([
	    [testingNFTContract1, 1, TokenRole.NoRole], [testingNFTContract2, 4, TokenRole.NoRole],
      [testingNFTContract1, 3, TokenRole.NoRole], [testingNFTContract2, 3, TokenRole.NoRole],
    ], {value: "33300000000000000"})
    const txEffects = await bundlingTx.wait()
    const bundleID = extractBundleID(txEffects)

    await pauseContract(admin, testingNFTContract2)
    try {
        await (await contract.addNFTsToBundle(
          bundleID,
          [[testingNFTContract1, 2, TokenRole.NoRole], [testingNFTContract2, 5, TokenRole.NoRole]],
          "", {value: "15000000000000000"})
        ).wait();
        assert(1 == 2, "Should not get here");
    } catch (e) {
	      assert(e.toString().indexOf("ERC721Pausable: token transfer while paused") >= 0, e.toString())
    }
  });

  it("Removing paused NFTs fails", async () => {
    await approveTokens(alice, testingNFTContract1, [0, 1, 2, 3, 4, 5], testingNFTContract2, [3, 4, 5])
    const contract = bundleContract.connect(alice)
    const bundlingTx = await contract.bundle([
	    [testingNFTContract1, 1, TokenRole.NoRole], [testingNFTContract2, 4, TokenRole.NoRole],
      [testingNFTContract1, 3, TokenRole.NoRole], [testingNFTContract2, 3, TokenRole.NoRole],
    ], {value: "33300000000000000"})
    const txEffects = await bundlingTx.wait()
    const bundleID = extractBundleID(txEffects)

    await pauseContract(admin, testingNFTContract2)
    try {
        await (await contract.removeNFTsFromBundle(
          bundleID,
          [[testingNFTContract2, 4, TokenRole.NoRole]],
          "", {value: "15000000000000000"})).wait();
        assert(1 == 2, "Should not get here");
    } catch (e) {
	      assert(e.toString().indexOf("ERC721Pausable: token transfer while paused") >= 0, e.toString())
    }
  });

  it("Removes NFT - Good Case", async () => {
    await approveTokens(alice, testingNFTContract1, [0, 1, 2, 3, 4, 5], testingNFTContract2, [3, 4, 5])
    const contract = bundleContract.connect(alice)
    const bundlingTx = await contract.bundle([
	    [testingNFTContract1, 1, TokenRole.Original], [testingNFTContract1, 2, TokenRole.NoRole],
      [testingNFTContract2, 5, TokenRole.NoRole], [testingNFTContract2, 4, TokenRole.Modifier],
      [testingNFTContract1, 3, TokenRole.NoRole], [testingNFTContract2, 3, TokenRole.NoRole],
    ], {value: "33300000000000000"})
    const txEffects = await bundlingTx.wait()
    const bundleID = extractBundleID(txEffects)

    await (await contract.removeNFTsFromBundle(
      bundleID,
      [[testingNFTContract2, 5, TokenRole.NoRole], [testingNFTContract1, 2, TokenRole.NoRole]],
      "", {value: "15000000000000000"})).wait();

    const bundledTokens = await bundleContract.bundeledTokensOf(bundleID)
    assert(bundledTokens.length === 4)
    assert(bundledTokens[0].token === testingNFTContract1)
    assert(bundledTokens[0].tokenId == 1)
    assert(bundledTokens[1].token === testingNFTContract1)
    assert(bundledTokens[1].tokenId == 3)
    assert(bundledTokens[2].token === testingNFTContract2)
    assert(bundledTokens[2].tokenId == 3)
    assert(bundledTokens[3].token === testingNFTContract2)
    assert(bundledTokens[3].tokenId == 4)

    assert((await bundleContract.ownerOf(bundleID)) == alice.address);

    const nft1Contract = (await ethers.getContractFactory("TestingNFT")).attach(testingNFTContract1)
    assert((await nft1Contract.ownerOf(2)) == alice.address);
    const nft2Contract = (await ethers.getContractFactory("TestingNFT")).attach(testingNFTContract2)
    assert((await nft2Contract.ownerOf(5)) == alice.address);
  })

  it("Removing non-existing NFT fails", async () => {
    await approveTokens(alice, testingNFTContract1, [0, 1, 2, 3, 4, 5], testingNFTContract2, [3, 4, 5])
    const contract = bundleContract.connect(alice)
    const bundlingTx = await contract.bundle([
	    [testingNFTContract1, 1, TokenRole.NoRole], [testingNFTContract1, 2, TokenRole.NoRole],
      [testingNFTContract2, 5, TokenRole.NoRole], [testingNFTContract2, 4, TokenRole.NoRole],
      [testingNFTContract1, 3, TokenRole.NoRole], [testingNFTContract2, 3, TokenRole.NoRole],
    ], {value: "33300000000000000"})
    const txEffects = await bundlingTx.wait()
    const bundleID = extractBundleID(txEffects)

    try {
        await (await contract.removeNFTsFromBundle(
          bundleID,
          [[testingNFTContract2, 5, TokenRole.NoRole], [testingNFTContract1, 4, TokenRole.NoRole]],
          "", {value: "15000000000000000"})).wait();
        assert(1 == 2, "Should not get here");
    } catch (e) {
	      // assert(e.toString().indexOf("E04") >= 0, e.toString())
    }
  });

  it("Removing base NFT fails", async () => {
    await approveTokens(alice, testingNFTContract1, [0, 1, 2, 3, 4, 5], testingNFTContract2, [3, 4, 5])
    const contract = bundleContract.connect(alice)
    const bundlingTx = await contract.bundle([
	    [testingNFTContract1, 1, TokenRole.NoRole], [testingNFTContract1, 2, TokenRole.NoRole],
      [testingNFTContract2, 5, TokenRole.NoRole], [testingNFTContract2, 4, TokenRole.NoRole],
      [testingNFTContract1, 3, TokenRole.Modifier], [testingNFTContract2, 3, TokenRole.Original],
    ], {value: "33300000000000000"})
    const txEffects = await bundlingTx.wait()
    const bundleID = extractBundleID(txEffects)

    try {
        await (await contract.removeNFTsFromBundle(
          bundleID,
          [[testingNFTContract1, 3, TokenRole.NoRole]],
          "", {value: "15000000000000000"})).wait();
        assert(1 == 2, "Should not get here");
    } catch (e) {
	      // assert(e.toString().indexOf("E03") >= 0, e.toString())
    }
  });

  it("Unbundles", async () => {
    await approveTokens(alice, testingNFTContract1, [0, 1, 2, 3, 4, 5], testingNFTContract2, [3, 4, 5])
    const contract = bundleContract.connect(alice)
    const bundlingTx = await contract.bundle([
      [testingNFTContract1, 1, TokenRole.Original],
      [testingNFTContract2, 4, TokenRole.Modifier],
    ], {value: "33300000000000000"})
    const txEffects = await bundlingTx.wait()
    const bundleID = extractBundleID(txEffects)
    const unbundlingTx = await contract.unbundle(bundleID, {value: "33300000000000000"})
    await unbundlingTx.wait()

    const nft1Contract = (await ethers.getContractFactory("TestingNFT")).attach(testingNFTContract1)
    for (let i = 0; i < 6; ++i) {
      assert((await nft1Contract.ownerOf(i)) == alice.address);
    }

    const nft2Contract = (await ethers.getContractFactory("TestingNFT")).attach(testingNFTContract2)
    for (let i = 0; i < 6; ++i) {
      assert((await nft2Contract.ownerOf(i)) == alice.address);
    }

    try {
      await bundleContract.ownerOf(bundleID)
      assert(1 === 2, "we should not get here")
    } catch (e) {
	    assert(e.toString().indexOf("ERC721: owner query for nonexistent token") >= 0, e.toString())
    }
  })

  it("Prevents alice from creating a bundle with bob's NFTs even if he approved them", async () => {
    await approveTokens(alice, testingNFTContract1, [0])
    await approveTokens(bob, testingNFTContract3, [0])
    const contract = bundleContract.connect(alice)
    try {
      const bundlingTx = await contract.bundle([
        [testingNFTContract1, 0, TokenRole.NoRole],
        [testingNFTContract3, 0, TokenRole.NoRole],
      ], {value: "33300000000000000"})
      await bundlingTx.wait()
      assert(1 === 2, "This should not have happened")
    } catch (e) {
	    assert(e.toString().indexOf("ERC721: transfer from incorrect owner") >= 0, e.toString())
    }
  });

  it("it MINTS token", async () => {
    const balanceOfAliceBegin = parseInt(await bundleContract.balanceOf(alice.address));
    const contract = bundleContract.connect(alice)
    const mintingTx = await contract.functions['mintItem(address,string)'](
      alice.address,
      'bafybeicalokeprmrfqxqui33cck5t3bl4wq7a5zny6wrnjtg44rmwalwdi/file',
      {value: "15000000000000000"}
    )
    const receipt = await mintingTx.wait()
    const mintedEvent = receipt.events.find((x) => {
        return x.event === "MintMessage";
    });
    const bundleID = mintedEvent.args.message;
    assert((await bundleContract.ownerOf(bundleID)) == alice.address);
    const balanceOfAliceNow = parseInt(await bundleContract.balanceOf(alice.address));
    assert(balanceOfAliceBegin + 1 === balanceOfAliceNow, `Balance of Alice changed ${balanceOfAliceBegin} (${typeof(balanceOfAliceBegin)}) -> ${balanceOfAliceNow} (${typeof(balanceOfAliceNow)})`);
  });

  it("Does not create a bundle, and NFTs remain on users wallet if any of transfers fail", async () => {
    await approveTokens(alice, testingNFTContract1, [0, 1, 2, 3, 4, 5], testingNFTContract2, [3, 4, 5])
    await pauseContract(admin, testingNFTContract2)
    const contract = bundleContract.connect(alice)
    try {
      const bundlingTx = await contract.bundle([
        [testingNFTContract1, 1, TokenRole.NoRole],
        [testingNFTContract2, 4, TokenRole.NoRole],
      ], {value: "33300000000000000"})
      await bundlingTx.wait()
      assert(1 === 2, "This should not have happened")
    } catch (e) {
	    assert(e.toString().indexOf("ERC721Pausable: token transfer while paused") >= 0, e.toString())
    }

    const nft1Contract = (await ethers.getContractFactory("TestingNFT")).attach(testingNFTContract1)
    for (let i = 0; i < 6; ++i) {
      assert((await nft1Contract.ownerOf(i)) == alice.address);
    }

    const nft2Contract = (await ethers.getContractFactory("TestingNFT")).attach(testingNFTContract2)
    for (let i = 0; i < 6; ++i) {
      assert((await nft2Contract.ownerOf(i)) == alice.address);
    }
  });

  it("Does not destroy a bundle if anything remains", async () => {
    await approveTokens(alice, testingNFTContract1, [0, 1, 2, 3, 4, 5], testingNFTContract2, [3, 4, 5])
    const contract = bundleContract.connect(alice)
    const bundlingTx = await contract.bundle([
      [testingNFTContract1, 1, TokenRole.NoRole],
      [testingNFTContract2, 4, TokenRole.NoRole],
    ], {value: "33300000000000000"})
    const txEffects = await bundlingTx.wait()
    const bundleID = extractBundleID(txEffects)
    await pauseContract(admin, testingNFTContract2)
    const unbundlingTx = await contract.unbundle(bundleID, {value: "30000000000000000"})
    await unbundlingTx.wait()

    // Token 1 should be extracted
    const nft1Contract = (await ethers.getContractFactory("TestingNFT")).attach(testingNFTContract1)
    for (let i = 0; i < 6; ++i) {
      assert((await nft1Contract.ownerOf(i)) == alice.address);
    }

    // Token 2 should remain in bundle
    const nft2Contract = (await ethers.getContractFactory("TestingNFT")).attach(testingNFTContract2)
    assert((await nft2Contract.ownerOf(4)) == bundleContract.address);

    const bundledTokens = await bundleContract.bundeledTokensOf(bundleID)
    assert(bundledTokens.length === 1)
    assert(bundledTokens[0].token === testingNFTContract2)
    assert(bundledTokens[0].tokenId == 4)
    assert((await bundleContract.ownerOf(bundleID)) == alice.address);

    await unpauseContract(admin, testingNFTContract2)
    const unbundlingTx2 = await contract.unbundle(bundleID, {value: "30000000000000000"})
    await unbundlingTx2.wait()

    for (let i = 0; i < 6; ++i) {
      assert((await nft1Contract.ownerOf(i)) == alice.address);
    }
    for (let i = 0; i < 6; ++i) {
      assert((await nft2Contract.ownerOf(i)) == alice.address);
    }

    try {
      await bundleContract.ownerOf(bundleID)
      assert(1 === 2, "we should not get here")
    } catch (e) {
	    assert(e.toString().indexOf("ERC721: owner query for nonexistent token") >= 0, e.toString())
    }
  });

  it("Checks for odd effects/modifiers", async () => {
    await approveTokens(alice, testingNFTContract1, [0, 1, 2, 3, 4, 5], testingNFTContract2, [3, 4, 5])
    const contract = bundleContract.connect(alice)

    await contract.bundle([
      [testingNFTContract1, 1, TokenRole.NoRole],
      [testingNFTContract2, 4, TokenRole.Original],
    ], {value: "33300000000000000"})

    try {
      await contract.bundle([
        [testingNFTContract1, 2, TokenRole.Modifier],
      ], {value: "33300000000000000"})
      assert(1 === 2, "We should not get here");
    } catch (e) {
      // assert(e.toString().indexOf("E07") >= 0, e.toString());
    }
  })

  it("Allows to put bundles into bundles", async () => {
    const contract = bundleContract.connect(alice)

    const mint1Tx = await contract.functions['mintItem(address,string)'](
      alice.address,
      'http://www.example.com/file',
      {value: "15000000000000000"}
    )
    const mint1TxEffects = await mint1Tx.wait()
    const bundle1ID = extractBundleID(mint1TxEffects);
  
    const mint2Tx = await contract.functions['mintItem(address,string)'](
      alice.address,
      'http://www.example.com/file',
      {value: "15000000000000000"}
    )
    const mint2TxEffects = await mint2Tx.wait()
    const bundle2ID = extractBundleID(mint2TxEffects);

    await approveTokens(alice, contract.address, [bundle1ID, bundle2ID]);
    
    await contract.bundleWithTokenURI([
      [contract.address, bundle1ID, TokenRole.Original],
      [contract.address, bundle2ID, TokenRole.NoRole],
    ], "ipfs://bundle.url/",
    {value: "33300000000000000"})
  })

  it("Regression 18/07/2022", async () => {
    const contract1 = bundleContract.connect(alice)
    const BundleNFTFactory = await ethers.getContractFactory("BundleNFT", admin)
    const bundleDeployTx = await BundleNFTFactory.deploy()
    bundleContract2 = await bundleDeployTx.deployed()
    const contract2 = bundleContract2.connect(alice)

    const mintOnContract = async (contract) => {
      const mintTx = await contract.functions['mintItem(address,string)'](
        alice.address,
        'http://www.example.com/file',
        {value: "15000000000000000"}
      )
      const mintTxEffects = await mintTx.wait()
      const bundleID = extractBundleID(mintTxEffects);
      return bundleID;
    }

    const contract1BundleId = await mintOnContract(contract1)
    const contract2BundleId = await mintOnContract(contract2)

    await approveTokens(alice, contract1.address, [contract1BundleId],
                               contract2.address, [contract2BundleId]);

    await contract1.bundleWithTokenURI([
      [contract1.address, contract1BundleId, TokenRole.Original],
      [contract2.address, contract2BundleId, TokenRole.NoRole],
    ], "ipfs://bundle.url/",
    {value: "33300000000000000"})
  })

  it("Allows to modify bundle if it is inside another bundle", async () => {
    await approveTokens(alice, testingNFTContract1, [0, 1, 2, 3, 4, 5], testingNFTContract2, [3, 4, 5])
    const contract = bundleContract.connect(alice);
    const bundlingTx = await contract.bundle([
      [testingNFTContract1, 1, TokenRole.NoRole],
      [testingNFTContract2, 4, TokenRole.NoRole],
    ], {value: "33300000000000000"})
    const txEffects = await bundlingTx.wait()
    const bundleID = extractBundleID(txEffects);

    await approveTokens(alice, bundleContract.address, [bundleID])
    const bundlingTx2 = await contract.bundle([
      [testingNFTContract1, 2, TokenRole.NoRole],
      [bundleContract.address, bundleID, TokenRole.NoRole],
    ], {value: "33300000000000000"})
    const txEffects2 = await bundlingTx2.wait();
    const outerBundleID = extractBundleID(txEffects2);

    const addNFTsToBundleTx = await contract.addNFTsToBundle(
      bundleID,
      [[testingNFTContract1, 3, TokenRole.NoRole]],
      "",
      {value: "15000000000000000"});
    await addNFTsToBundleTx.wait();
  });

  it("Allowance test", async () => {
    await approveTokens(alice, testingNFTContract1, [0])
    const contractAsAlice = bundleContract.connect(alice);
    const bundlingTx = await contractAsAlice.bundle([
      [testingNFTContract1, 0, TokenRole.NoRole],
    ], {value: "33300000000000000"})
    const txEffects = await bundlingTx.wait()
    const bundleID = extractBundleID(txEffects);
    
    const contractAsBob = bundleContract.connect(bob);
    await approveTokens(bob, testingNFTContract3, [0])
    try {
      await contractAsBob.addNFTsToBundle(
        bundleID,
        [[testingNFTContract3, 0, TokenRole.NoRole]],
        "",
        {value: "15000000000000000"}
      )
      assert(1 == 2, "not expected to happen")
    }
    catch (e) {
    }
        
    const setAllowanceTx = await contractAsAlice.setAllowance(bob.address, bundleID, true);
    await setAllowanceTx.wait();

    // Now Bob can add NFTs.
    await contractAsBob.addNFTsToBundle(
      bundleID,
      [[testingNFTContract3, 0, TokenRole.NoRole]],
      "",
      {value: "1500000000000000000"}
    )

    // And even remove Alice's original NFT...
    await (await contractAsBob.removeNFTsFromBundle(
      bundleID,
      [[testingNFTContract1, 0, TokenRole.NoRole]],
      "", {value: "15000000000000000"})).wait();

    // But Alice decides to remove the allowance, and Bob cannot get back HIS originally NFT
    const removeAllowanceTx = await contractAsAlice.removeAllAllowances(bundleID);
    await removeAllowanceTx.wait();

    try {
      await contractAsBob.addNFTsToBundle(
        bundleID,
        [[testingNFTContract3, 0, TokenRole.NoRole]],
        "",
        {value: "15000000000000000"}
      )
      assert(1 == 2, "not expected to happen")
    }
    catch (e) {
    }
  });

  it("Handles duplicated NFTs", async () => {});
  it("Handles non ERC721 NFTs", async () => {});

  it("Rejects a bundle creation when fee is not provided", async () => {})
  it("New owner unbundles", () => {})
  it("Unbundle twice fails", () => {})
  it("URL is remembered", () => {})

  it("Is save against re-entrant attacks", async () => {

  })

  it("Bundle could be transferred", async () => {

  })

  it("What if you bundle, unbundle, and then bundle same tokens again", async () => {})
  
  
  
  it.skip("Integration", async function () {
    const [admin, alice, bob, charlie] = await ethers.getSigners();
    const bundleContract = await deploy("BundleNFT", admin);
    
    
    const mutantFactory = await deploy("MutantFactory");

    // Create mutant
    let tx = await mutantFactory.connect(alice).createMutant(bob.address, mutantId);
    let receipt = await tx.wait();
    const mutantCreatedEvent = receipt.events.indexOf((x) => {
        return x.event == "MutantCreated";
    });
    const mutantAddress = mutantCreatedEvent.args.mutant;
    assert.equal(mutantCreatedEvent.args.tokenId, mutantId);

    const Mutant = await ethers.getContractFactory("Mutant");
    const mutant = new ethers.Contract(mutantAddress, Mutant.interface, admin);

    assert.equal(await mutant.getOwner(), bob.address);

    // Deploy images ERC721, mint background nft, approve it for mutant
    const images = await deploy("ImagesNFT");
    await images.mint(charlie.address, backgroundTokenId);
    await images.connect(charlie).approve(mutantAddress, backgroundTokenId);

    // Mutate with background
    await mutant.connect(bob).mutate(backgroundType, images.address, backgroundTokenId);
    assert.equal(await images.ownerOf(backgroundTokenId), mutantAddress);
  })
})

describe("AllowList Test Suite", () => {
  let admin, alice, bob, charlie
  let allowListContract
  let contractAsAlice, contractAsBob
  beforeEach(async () => {
    [admin, alice, bob, charlie] = await ethers.getSigners()
    const AllowListFactory = await ethers.getContractFactory("EffectsAllowList", admin)
    const contractDeployTx = await AllowListFactory.deploy()
    allowListContract = await contractDeployTx.deployed()

    const listManagerRole = await allowListContract.LIST_MANAGER_ROLE()
    const addAliceAsAdminTx = await allowListContract.grantRole(listManagerRole, alice.address)
    await addAliceAsAdminTx.wait()
    contractAsAlice = allowListContract.connect(alice)
    contractAsBob = allowListContract.connect(bob)
  })

  it("Allows Bob to check effect", async () => {
    const effectExists = await contractAsBob.checkPermission("0x0123456789012345678901234567890123456780", "0x0123456789012345678901234567890123456780")
    assert(!effectExists)
  })

  it("Does not allow Bob to create effect", async () => {
    try {
      await contractAsBob.addToList(
        ["0x0123456789012345678901234567890123456789", "https://www.example.com", 
              "0x0123456789012345678901234567890123456788", "0x0123456789012345678901234567890123456787"]);
      assert(1 === 2, "Should not get here")
    }
    catch (e) {
    }
  })

  it("Allows Alice to create effect and to Bob to check it", async () => {
    const addToListTx = await contractAsAlice.addToList(
      ["0x0123456789012345678901234567890123456789", "https://www.example.com", 
            "0x0123456789012345678901234567890123456788", "0x0123456789012345678901234567890123456787", 0]);
    await addToListTx.wait();
    const addToListTx2 = await contractAsAlice.addToList(
      ["0x0123456789012345678901234567890123456786", "https://www.example.com", 
            "0x0123456789012345678901234567890123456785", "0x0000000000000000000000000000000000000000", 0]);
    await addToListTx2.wait();
    const effectPermitted = await contractAsBob.checkPermission("0x0123456789012345678901234567890123456787", "0x0123456789012345678901234567890123456789")
    assert(effectPermitted, "Expected 0x0123456789012345678901234567890123456789 to be permitted on 0x0123456789012345678901234567890123456787")
    const effectPermitted2 = await contractAsBob.checkPermission("0x0123456789012345678901234567890123456789", "0x0123456789012345678901234567890123456789")
    assert(!effectPermitted2, "Expected 0x0123456789012345678901234567890123456789 to be not permitted on 0x0123456789012345678901234567890123456789")
    const effectPermitted3 = await contractAsBob.checkPermission("0x0123456789012345678901234567890123456780", "0x0123456789012345678901234567890123456786")
    assert(effectPermitted3, "Expected 0x0123456789012345678901234567890123456786 to be permitted on 0x0123456789012345678901234567890123456780")
    const effect = await contractAsBob.getByEffect("0x0123456789012345678901234567890123456789")
    assert(effect[0] === "0x0123456789012345678901234567890123456789")
    assert(effect[1] === "https://www.example.com")
    assert(effect[2] === "0x0123456789012345678901234567890123456788")
    assert(effect[3] === "0x0123456789012345678901234567890123456787")
    assert(effect[4] === 0)
  })

  it("Allows Alice to create and remove effect", async () => {
    const addToListTx = await contractAsAlice.addToList(
      ["0x0123456789012345678901234567890123456789", "https://www.example.com", 
            "0x0123456789012345678901234567890123456788", "0x0123456789012345678901234567890123456787", 0]);
    await addToListTx.wait();
    const removeFromListTx = await contractAsAlice.removeFromList("0x0123456789012345678901234567890123456789");
    await removeFromListTx.wait();
  })

  it("Allows Alice to create but does not allow Bob to remove", async () => {
    const addToListTx = await contractAsAlice.addToList(
      ["0x0123456789012345678901234567890123456789", "https://www.example.com", 
            "0x0123456789012345678901234567890123456788", "0x0123456789012345678901234567890123456787", 0]);
    await addToListTx.wait();
    try {
      await contractAsBob.removeFromList("0x0123456789012345678901234567890123456789");
      assert(1 === 2, "Should not get here")
    }
    catch (e) {}
  })

  it("Does link manupulations right", async () => {
    const addToListTx = await contractAsAlice.addToList(
      ["0x0123456789012345678901234567890123456789", "https://www.example.com/1", 
            "0x0123456789012345678901234567890123456788", "0x0123456789012345678901234567890123456787", 0]);
    await addToListTx.wait();
    const addToListTx2 = await contractAsAlice.addToList(
      ["0x0123456789012345678901234567890123456786", "https://www.example.com/2", 
            "0x0123456789012345678901234567890123456785", "0x0123456789012345678901234567890123456784", 0]);
    await addToListTx2.wait();
    const addToListTx3 = await contractAsAlice.addToList(
      ["0x0123456789012345678901234567890123456783", "https://www.example.com/3", 
            "0x0123456789012345678901234567890123456782", "0x0123456789012345678901234567890123456781", 0]);
    await addToListTx3.wait();

    const effectsList1 = (await contractAsBob.getEffectInfos()).map(ei=>ei.modificatorsContract);
    assert(effectsList1[0], "0x0123456789012345678901234567890123456789")
    assert(effectsList1[1], "0x0123456789012345678901234567890123456786")
    assert(effectsList1[2], "0x0123456789012345678901234567890123456783")
    assert(effectsList1.length === 3)

    const effect1 = await contractAsBob.getByEffect("0x0123456789012345678901234567890123456789")
    assert(effect1[0] === "0x0123456789012345678901234567890123456789")
    assert(effect1[1] === "https://www.example.com/1")
    assert(effect1[2] === "0x0123456789012345678901234567890123456788")
    assert(effect1[3] === "0x0123456789012345678901234567890123456787")

    const effect2 = await contractAsBob.getByEffect("0x0123456789012345678901234567890123456786")
    assert(effect2[0] === "0x0123456789012345678901234567890123456786")
    assert(effect2[1] === "https://www.example.com/2")
    assert(effect2[2] === "0x0123456789012345678901234567890123456785")
    assert(effect2[3] === "0x0123456789012345678901234567890123456784")

    const effect3 = await contractAsBob.getByEffect("0x0123456789012345678901234567890123456783")
    assert(effect3[0] === "0x0123456789012345678901234567890123456783")
    assert(effect3[1] === "https://www.example.com/3")
    assert(effect3[2] === "0x0123456789012345678901234567890123456782")
    assert(effect3[3] === "0x0123456789012345678901234567890123456781")

    const preRemovalCheck1 = await contractAsAlice.checkPermission("0x0123456789012345678901234567890123456784", "0x0123456789012345678901234567890123456786")
    assert(preRemovalCheck1)
    const remove2FromListTx = await contractAsAlice.removeFromList("0x0123456789012345678901234567890123456786");
    await remove2FromListTx.wait();
    const postRemovalCheck2 = await contractAsAlice.checkPermission("0x0123456789012345678901234567890123456784", "0x0123456789012345678901234567890123456786")
    assert(!postRemovalCheck2)

    const effect1_check_2 = await contractAsBob.getByEffect("0x0123456789012345678901234567890123456789")
    assert(effect1_check_2[0] === "0x0123456789012345678901234567890123456789")
    assert(effect1_check_2[1] === "https://www.example.com/1")
    assert(effect1_check_2[2] === "0x0123456789012345678901234567890123456788")
    assert(effect1_check_2[3] === "0x0123456789012345678901234567890123456787")

    const effect3_check_2 = await contractAsBob.getByEffect("0x0123456789012345678901234567890123456783")
    assert(effect3_check_2[0] === "0x0123456789012345678901234567890123456783")
    assert(effect3_check_2[1] === "https://www.example.com/3")
    assert(effect3_check_2[2] === "0x0123456789012345678901234567890123456782")
    assert(effect3_check_2[3] === "0x0123456789012345678901234567890123456781")

    const effectsList2 = (await contractAsBob.getEffectInfos()).map(ei=>ei.modificatorsContract);
    assert(effectsList2.length === 2, `Expected to have two items but got ${JSON.stringify(effectsList2)}`)
    assert(effectsList2[0], "0x0123456789012345678901234567890123456789")
    assert(effectsList2[1], "0x0123456789012345678901234567890123456783")
  
    const remove3FromListTx = await contractAsAlice.removeFromList("0x0123456789012345678901234567890123456783");
    await remove3FromListTx.wait();

    const effect1_check_3 = await contractAsBob.getByEffect("0x0123456789012345678901234567890123456789")
    assert(effect1_check_3[0] === "0x0123456789012345678901234567890123456789")
    assert(effect1_check_3[1] === "https://www.example.com/1")
    assert(effect1_check_3[2] === "0x0123456789012345678901234567890123456788")
    assert(effect1_check_3[3] === "0x0123456789012345678901234567890123456787")

    const effectsList3 = (await contractAsBob.getEffectInfos()).map(ei=>ei.modificatorsContract);
    assert(effectsList3.length === 1)
    assert(effectsList3[0], "0x0123456789012345678901234567890123456789")

    const remove1FromListTx = await contractAsAlice.removeFromList("0x0123456789012345678901234567890123456789");
    await remove1FromListTx.wait();

    const effectsList4 = (await contractAsBob.getEffectInfos()).map(ei=>ei.modificatorsContract);
    assert(effectsList4.length === 0, `Expected to see an empty list but got ${JSON.stringify(effectsList4)}`)

  })
})


describe("Bundle respects AllowList Test Suite", () => {
  let admin, alice, bob, charlie
  let allowListContract
  let bundleContract
  let allowListAsAlice
  let modificatorContract, originalContract

  before(async () => {
    [admin, alice, bob, charlie] = await ethers.getSigners()
    const AllowListFactory = await ethers.getContractFactory("EffectsAllowList", admin)
    const BundleNFTFactory = await ethers.getContractFactory("BundleNFT", admin)
    const TestingNFTContract = await ethers.getContractFactory("TestingNFT", admin)

    const allowListDeployTx = await AllowListFactory.deploy()
    allowListContract = await allowListDeployTx.deployed()

    bundleContract = await upgrades.deployProxy(BundleNFTFactory, ["DoNFT", "DNFT"]);

    const listManagerRole = await allowListContract.LIST_MANAGER_ROLE()
    const addAliceAsAdminTx = await allowListContract.grantRole(listManagerRole, alice.address)
    await addAliceAsAdminTx.wait()
    allowListAsAlice = allowListContract.connect(alice)

    const modificatorContractDeployTx = await TestingNFTContract.deploy(alice.address, 10)
    modificatorContract = (await modificatorContractDeployTx.deployed()).address
    const originalContractDeployTx = await TestingNFTContract.deploy(alice.address, 10)
    originalContract = (await originalContractDeployTx.deployed()).address

    const addToListTx = await allowListAsAlice.addToList(
      [modificatorContract, "https://www.example.com/1", bob.address, originalContract, 0]
    );
    await addToListTx.wait();

    for (let i = 0; i < 3; ++i) {
      const approveModificatorTx = await TestingNFTContract.attach(modificatorContract).connect(alice).approve(bundleContract.address, i)
      await approveModificatorTx.wait()
      const approveOriginalTx = await TestingNFTContract.attach(originalContract).connect(alice).approve(bundleContract.address, i)
      await approveOriginalTx.wait()
    }

    const setAllowListTx = await bundleContract.setEffecstAllowList(allowListContract.address);
    await setAllowListTx.wait()
  });

  it("Test Good", async () => {
    const bobsBalanceBefore = await ethers.provider.getBalance(bob.address);
    const bundlingTx = await bundleContract.connect(alice).bundle([
      [modificatorContract, 0, TokenRole.Modifier], [originalContract, 1, TokenRole.Original]
    ], {value: "100000000000000000"})
    await bundlingTx.wait()
    const bobsBalanceAfter = await ethers.provider.getBalance(bob.address);
    expect(bobsBalanceAfter.sub(bobsBalanceBefore).toString()).to.be.equal("33400000000000000");
  })
  it("Test Bad", async () => {
    try {
      await bundleContract.connect(alice).bundle([
        [modificatorContract, 0, TokenRole.Original],
        [originalContract, 1, TokenRole.Modifier],
      ], {value: "33300000000000000"})
      assert(1 === 2, "This should not happen")
    } catch (e) {
      // assert(e.toString().indexOf("E08") >= 0, e.toString());
    }
  })
})


describe("Supports Interface", () => {
  let admin, alice, bob, charlie
  let bundleContract

  before(async () => {
    [admin, alice, bob, charlie] = await ethers.getSigners()
    const BundleNFTFactory = await ethers.getContractFactory("BundleNFT", admin)
    const bundleDeployTx = await BundleNFTFactory.deploy()
    bundleContract = await bundleDeployTx.deployed()
  })

  it("Supports IBundle", async () => {
    const result = await bundleContract.supportsInterface("0x19FBAC2F");
    assert(result, "IBundleNFT is not supported");
  });
  it("Supports IERC721", async () => {
    const result = await bundleContract.supportsInterface("0x80AC58CD");
    assert(result, "IERC721 is not supported");
  });
  it("Not supports ERC721Enumerable", async () => {
    const result = await bundleContract.supportsInterface("0x780e9d63");
    assert(result, "ERC721Enumerable is not supported");
  });
})

describe("Proxy Factory", () => {
  let admin, alice, bob, charlie
  let proxyFactory
  let testingNFTContract1
  let bundle1, bundle2

  before(async () => {
    [admin, alice, bob, charlie] = await ethers.getSigners()
    const BundleNFTFactory = await ethers.getContractFactory("BundleNFT", admin)
    const beacon = await upgrades.deployBeacon(BundleNFTFactory);
    const ProxyFactory = await ethers.getContractFactory("BundleFactory", admin)
    const deployProxyFactoryTx = await ProxyFactory.deploy()
    proxyFactory = await deployProxyFactoryTx.deployed()
    const setBeaconTx = await proxyFactory.setBeacon(beacon.address)
    await setBeaconTx.wait()

    const TestingNFTContract = await ethers.getContractFactory("TestingNFT", admin)
    const testingNFTContract1DeployTx = await TestingNFTContract.deploy(alice.address, 10)
    testingNFTContract1 = await testingNFTContract1DeployTx.deployed()
  })

  it("Deploys", async () => {
    const createBundle1Tx = await proxyFactory.createMyBundle()
    const bundle1Effects = await createBundle1Tx.wait()
    const createBundle2Tx = await proxyFactory.createMyBundle()
    const bundle2Effects = await createBundle2Tx.wait()

    const getAddress = (e) => {
       const log = e.logs.filter(l => l.topics[0] == '0x3d7ecae69975b4509943fb852c8d38895fe74f5b81a65ae779028fcd303cb335')[0];
       return "0x" + log.data.substr(log.data.length - 40);
    };

    bundle1 = getAddress(bundle1Effects)
    bundle2 = getAddress(bundle2Effects)
  })

  it("Contracts are separated", async () => {
    const nft = testingNFTContract1.connect(alice)
    const approveToken1ToBundle1Tx = await nft.approve(bundle1, 1)
    approveToken1ToBundle1Tx.wait()
    const approveToken2ToBundle2Tx = await nft.approve(bundle2, 2)
    approveToken2ToBundle2Tx.wait()

    const BundleNFTFactory = await ethers.getContractFactory("BundleNFT", alice)
    const b1 = BundleNFTFactory.attach(bundle1);
    

    await b1.bundle([
      [nft.address, 1, TokenRole.NoRole],
    ], {value: "33300000000000000"})

    try {
      await b1.bundle([
        [nft.address, 2, TokenRole.NoRole],
      ], {value: "33300000000000000"})
      assert(1 === 2, "This should not happen")
    } catch (e) {
      // assert(e.toString().indexOf("E08") >= 0, e.toString());
    }

  })
})
