import tokenABI from './assets/data/tokenABI.json';
import tokenTestABI from './assets/data/tokenTestAbi.json';
import stakingABI from './assets/data/stakingABI.json';
import stakingV2ABI from './assets/data/stakingV2ABI.json';
import swappingABI from './assets/data/swappingABI.json';
import { ethers } from "ethers";
import Web3 from 'web3';
import BigNumber from "bignumber.js";
import bigInt from "big-integer";

async function V2_getStakedDataById(account, id) {
    const bigNumberValue = ethers.BigNumber.from(id.toString());
    const contract = SC.stakingContractV2;
  
    try {
      return await contract.viewUserStakeAny(account, bigNumberValue);
    } catch (err) {
      throw err;
    }
}

async function V2_getAvialableRewardById(account, id, shiftTime = 0) {
    const bigNumberValue = ethers.BigNumber.from(id.toString());
    const contract = SC.stakingContractV2;
  
    try {
        return await contract.calcRewardByIndex(account, bigNumberValue, ethers.BigNumber.from(shiftTime));
    } catch (err) { throw err }
}

async function V2_getTotalRewardsValue(account, shiftTime = 0) {
    let totalRewards = ethers.BigNumber.from(0);
  
    try {
        const stakesCount = await SC.stakingContractV2.getCountStake(account);

        for (let i = 0; i < stakesCount; i++) {
            const { reward } = await V2_getAvialableRewardById(account, i, shiftTime);
            totalRewards = totalRewards.add(reward.toString());
        }

        return totalRewards.toString();
    } catch (err) { throw err }
}

async function V2_getUnlockedReward(account, count, shiftTime = 0) {
    let totalRewards = ethers.BigNumber.from(0);
  
    try {
        for (let i = 0; i < count; i++) {
            const { reward } = await V2_getAvialableRewardById(account, i, shiftTime);
            totalRewards = totalRewards.add(reward.toString());
        }

        return totalRewards.toString();
    } catch (err) { throw err }
}

async function V2_getAllStakesData(account) {
    const stakes = [];

    try {
      const stakesCount = await SC.stakingContractV2.getCountStake(account);
  
      for (let i = 0; i < stakesCount; i++) {
        const stakeData = await V2_getStakedDataById(account, i);
        stakes.push(stakeData);
      }
  
      return stakes;
    } catch (err) { throw err }
}


export class SC {
    static coefficient = 0.000000000000000001;
    static dailyDistribution = 1e27;
    static tokenContract;
    static tokenContractTest;
    static stakingContract;
    static stakingContractV2;
    static swappingContractAddress;
    static web3ojb;
    static tokenInst;
    static tokenInst2;
    static tokenSwap;
    static rewardV2;
    static config = {
        mainChainId: 56,
        tokenContractAddress: '0xDc3541806D651eC79bA8639a1b495ACf503eB2Dd',
        tokenContractAddressTest: '0x48714CAbCd1268C9A2F59813eaB88d490FBf8923',
        /* testnet approve */ _tokenContractAddress: '0xf8c5b21cf02a5429ae188901d3a73956b9ac9e2d',
        // stakingContractAddress: '0xaA03e1110de1515976fAEEA19817dA81AfA44dbE',
        stakingContractAddress: '0xbBD5c7139d50A4eFB6A03534E59CcA285faBa051',
        stakingContractV2Address: '0x6CCF448bAE762431B2Bae046b85fD730313Cbef3',
        swappingContractAddress: '0x6043e18d34b989a7674cb3feB4F6f849dB4056FF',
        mainWallet: '0x8B4754ae99F1e595481029c6835C6931442f5f02',
        timestamp: 1648163253
    };

    static setStake = 0;
    static inStakeV2 = 0;
     
static async init(_provider) {
    SC.web3ojb = new Web3(_provider);
    SC.tokenInstMeto = new SC.web3ojb.eth.Contract(tokenABI, SC.config.tokenContractAddress)
    SC.tokenInst = new SC.web3ojb.eth.Contract(stakingABI, SC.config.stakingContractAddress)
    SC.tokenInst2 = new SC.web3ojb.eth.Contract(stakingV2ABI, SC.config.stakingContractV2Address)
    SC.tokenSwap = new SC.web3ojb.eth.Contract(swappingABI, SC.config.swappingContractAddress)
    const provider = new ethers.providers.Web3Provider(_provider), signer = provider.getSigner();

    if (!SC.tokenContract) {
        SC.tokenContract = new ethers.Contract(SC.config.tokenContractAddress, tokenABI, signer);
        SC.tokenContractTest = new ethers.Contract(SC.config.tokenContractAddressTest, tokenTestABI, signer);
        SC.stakingContract = new ethers.Contract(SC.config.stakingContractAddress, stakingABI, signer);
        SC.stakingContractV2 = new ethers.Contract(SC.config.stakingContractV2Address, stakingV2ABI, signer);
        SC.swappingContract = new ethers.Contract(SC.config.swappingContractAddress, swappingABI, signer);
    }
}

static async getInHoldTime() {
    const time = await SC.tokenInst.methods.holdingTime().call();
    return parseInt(time);
}

static async getInStackTime(account) {
    const time = await SC.tokenInst.methods.userLastStackedTime(account).call();
    return parseInt(time);
}

static async allowance(account) {
    const contract = SC.tokenContract;
    try {
        let approvedRaw = await contract.allowance(account, SC.stakingContract.address);
        console.log('APPROVED_VALUE', approvedRaw);
        if (approvedRaw) {
            let approved = parseInt(approvedRaw._hex, '16');
            if (approved) return true;
        }
        return false;
    } catch(e) { throw e }
}

static async allowanceV2(account) {
    const contract = SC.tokenContract;
    try {
        let approvedRaw = await contract.allowance(account, SC.stakingContractV2.address);
        console.log('APPROVED_VALUE', approvedRaw);
        if (approvedRaw) {
            let approved = parseInt(approvedRaw._hex, '16');
            if (approved) return true;
        }
        return false;
    } catch(e) { throw e }
}

static async approve() {

     const bigNumberValue = ethers.utils.parseEther((1000000000000000000000000000n).toString());
     const contract = SC.tokenContract;
    //  const gasLimit = await SC.tokenInstMeto.methods
    // .approve(SC.config.stakingContractAddress, bigNumberValue)    
    // .estimateGas({from: ''});  
      try {
          let approval = await contract.approve(SC.config.stakingContractAddress, bigNumberValue);

          return !!approval;
      } catch (e) { throw e }
}

static async approveV2() {
    const bigNumberValue = ethers.utils.parseEther((1000000000000000000000000000n).toString());
    const contract = SC.tokenContract;
    
    try {
        let approval = await contract.approve(SC.config.stakingContractV2Address, bigNumberValue);
        return !!approval;
    } catch (e) { throw e }
}

static async getEarned(account) {
    const earned = bigInt(await SC.tokenInst.methods.earned(account).call());
    return String(earned.value / 10n ** 18n);
}

static async getInStake(account) {
    const balance = bigInt(await SC.tokenInst.methods.balanceOf(account).call());
    SC.inStake = String(balance.value / 10n ** 18n);
    return String(balance.value / 10n ** 18n);
}

static async getEarnedV2(account) {
    try {
        let totalRewards = await V2_getTotalRewardsValue(account, 2678400);
        return totalRewards * SC.coefficient;
    } catch(e) { throw e }
}

static async getInStakeV2(account) {
    try {
        let allStakesData = await V2_getAllStakesData(account);
        let balance = allStakesData.reduce((acc, stakedToken) => {
            if (!(stakedToken._endTime * 1)) acc += stakedToken._amount * SC.coefficient;
            return acc;
        }, 0);
        SC.inStakeV2 = parseInt(balance);
        return parseInt(balance);
    } catch(e) { throw e }
}

static async stake(account, amount) {
    amount = new BigNumber(amount * 10 ** 18);  
    SC.tokenInst.methods.stake(amount.toFixed())
    .send({from: account})
        .then(function(result){
            console.log(result)
    });
}

static async harvest(account) {
    SC.tokenInst.methods.getReward()
    .send({from: account})
        .then(function(result){
            console.log(result)
    });
}
           
static async withdraw(account,amount) {
    SC.tokenInst.methods.withdraw(amount)
    .send({from: account})
        .then(function(result){
            console.log(result)
    });
}

static async stakeV2(account, amount) {
    amount = new BigNumber(amount * 10 ** 18);  
    SC.tokenInst2.methods.stake(account,amount.toFixed())
    .send({from: account})
        .then(function(result){
            console.log(result)
    });
}

static async harvestV2(account) {
    SC.tokenInst2.methods.getReward(account)
    .send({from: account})
        .then(function(result){
             console.log(result)
    });
}

static async withdrawV2(account) {
    SC.tokenInst2.methods.unStake(account)
    .send({from: account})
        .then(function(result){
            console.log(result)
    });
}

static async APR() {
    let count1 = await SC.tokenInst.methods.rewardRate().call();
    let count2 = await SC.tokenInst.methods.totalSupply().call();
    let count = ((bigInt(count1) * 86400 * 365) / (bigInt(count2) / 10 **18)  * 100 ) / 10 **18;
    return Math.trunc(count);
}

static async APRV2() {
    const contract = SC.stakingContractV2;
    try {
        let byDay = await contract.rewardTokensByDay();
        let totalStacked = await contract.totalStakedTokens();
        let APR = Math.floor(((byDay * SC.coefficient * 365) / + (totalStacked * SC.coefficient)) * 100) || 0;
        return APR;
    } catch(e) { throw e }
}

static async getUnlockedRewardV2(account) {
    let get = Number();
         for(let i = 0; i < 10; i++) {
            await SC.tokenInst2.methods.calcRewardByIndex(account, i, 0).call().then(function (result) {
                get = get + parseInt(result.reward)
            }).catch(function (err) {
            });
         }
       return parseInt(get / 10 ** 18);
}

static async swap(account, amount) {
    amount = new BigNumber(amount * 10 ** 18); 
     SC.tokenSwap.methods.deposit(amount.toFixed())
    .send({from: account})
        .then(function(result){
            console.log(result)
    });
}

static async Rate() {
    let count = await SC.tokenSwap.methods.getTokenProportion().call();
    let result = bigInt(10000000000) / bigInt(count);
    return Math.trunc(result);
}

static async available(account) {
    // let count = await SC.tokenSwap.methods.calculateReward(account,1).call();
    // return parseInt(count / 10 ** 28);
    return undefined;
}
static async remaining(account) {
    account = '0x8B4754ae99F1e595481029c6835C6931442f5f02'
    let card = await SC.tokenSwap.methods.getUserCardAmount(account).call();
    let count = await SC.tokenSwap.methods.getInformation(account,card).call();
    return parseInt(count[1] / 10 ** 18);
}
static async claimOshi(account) {
    let card = await SC.tokenSwap.methods.getUserCardAmount(account).call();
     SC.tokenSwap.methods.release(parseInt(card))
    .send({from: account})
        .then(function(result){
            console.log(result)
    });
}
static async approveV3() {
    const bigNumberValue = ethers.utils.parseEther((1000000000000000000000000000n).toString());
    const contract = SC.tokenContractTest;
    
    try {
        let approval = await contract.approve(SC.config.swappingContractAddress, bigNumberValue);
        return !!approval;
    } catch (e) { throw e }
}
static async allowanceV3(account) {
    const contract = SC.tokenContractTest;
    try {
        let approvedRaw = await contract.allowance(account, SC.swappingContract.address);
        console.log('APPROVED_VALUE', approvedRaw);
        if (approvedRaw) {
            let approved = parseInt(approvedRaw._hex, '16');
            if (approved) return true;
        }
        return false;
    } catch(e) { throw e }
}
}