import { base, celo, gnosis, sepolia, baseGoerli, goerli, polygon } from 'viem/chains';
import { http, createPublicClient, Chain, createWalletClient, SendTransactionParameters, extractChain } from "viem"
import { createBundlerClient, createSmartAccountClient, ENTRYPOINT_ADDRESS_V07, ENTRYPOINT_ADDRESS_V06} from 'permissionless';
import { createPimlicoPaymasterClient, createPimlicoBundlerClient  } from "permissionless/clients/pimlico";
import { privateKeyToSafeSmartAccount, signerToSafeSmartAccount } from "permissionless/accounts";
import { NetworkUtil } from './networks';


import { createAccount } from '@turnkey/viem';

import { Contract, parseEther, ZeroAddress } from 'ethers';
import { passkeyHttpClient, publicClient } from './utils';
import { PackedUserOperation } from '@/utils/userOp';


const getChain = (chainId: string) : Chain => {

  return [base, celo, gnosis, sepolia, baseGoerli, goerli, polygon].find((chain: any) => chain.id == chainId) as Chain;
  

}

export const sendTransaction = async(chainId: string, to: string, data: string, safeAccount: any, value: BigInt = 0n) => {

  const chain = getChain(chainId);
  // console.log(NetworkUtil.getNetworkById(parseInt(chainId))?.url)

  const publicClient = createPublicClient({
    transport: http(NetworkUtil.getNetworkById(parseInt(chainId))?.url),
  });

  const pimlicoEndpoint = `https://api.pimlico.io/v2/${chain.name.toLowerCase().replace(/\s+/g, '-')}/rpc?apikey=${import.meta.env.VITE_PIMLICO_API_KEY}`

  const pimlicoBundlerClient = createPimlicoBundlerClient({ 
    transport: http(pimlicoEndpoint),
    entryPoint: ENTRYPOINT_ADDRESS_V07
  });



  const paymasterClient = createPimlicoPaymasterClient({
    transport: http(pimlicoEndpoint),
    entryPoint: ENTRYPOINT_ADDRESS_V07,
})



    const smartAccountClient = createSmartAccountClient({
      account: safeAccount,
      chain: chain,
      entryPoint: ENTRYPOINT_ADDRESS_V07,
      bundlerTransport: http(pimlicoEndpoint),
      middleware: { 
        gasPrice: async () => (await pimlicoBundlerClient.getUserOperationGasPrice()).fast,
        sponsorUserOperation: paymasterClient.sponsorUserOperation, // optional
      }
    });


    const gasPrices = await pimlicoBundlerClient.getUserOperationGasPrice();

    try {
      
    const txHash = await smartAccountClient.sendTransaction({
      to: to as `0x${string}`,
      data:  data as `0x${string}`,
      value: value,
      maxFeePerGas: gasPrices.fast.maxFeePerGas, // if using Pimlico
      maxPriorityFeePerGas: gasPrices.fast.maxPriorityFeePerGas, // if using Pimlico
    } as SendTransactionParameters);
    
    console.log(txHash)
     
    return txHash;

  } catch(e) {
    
    console.log(e)
    return false;
  }

}


export const createSafeAccount = async (chainId: number, wallet: any) => {

  const chain = getChain(chainId.toString());

  const publicClient = createPublicClient({
    transport: http(NetworkUtil.getNetworkById(chainId)?.url),
  });


  const viemAccount = await createAccount({
      client: passkeyHttpClient,
      organizationId: wallet.subOrgId,
      signWith: wallet.address,
      ethereumAddress: wallet.address,
  });

  const viemClient = createWalletClient({
      account: viemAccount,
      chain: chain,
      transport: http(),
  });
  try {
  const account = await signerToSafeSmartAccount(publicClient, {
      signer: viemClient.account,
      entryPoint: ENTRYPOINT_ADDRESS_V07,
      safeVersion: "1.4.1",
      safe4337ModuleAddress: "0x75cf11467937ce3F2f357CE24ffc3DBF8fD5c226",
      // SafeModuleSetup: "0x2dd68b007B46fBe91B9A7c3EDa5A7a1063cB5b47",
  });

  return account;

    } catch(e) {
      console.log(e)
    }


  

  // const safeAccount = await signerToSafeSmartAccount(publicClient, {
  //   signer: signer,
  //   safeVersion: "1.4.1",
  //   entryPoint: "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789", // global entrypoint
  //   // saltNonce: 0, // optional
  //   addModuleLibAddress: "0x191EFDC03615B575922289DC339F4c70aC5C30Af",
  //   safe4337ModuleAddress: "0x39E54Bb2b3Aa444b4B39DEe15De3b7809c36Fc38",
  //   safeProxyFactoryAddress: "0x4e1DCf7AD4e460CfD30791CCC4F9c8a4f820ec67",
  //   safeSingletonAddress: "0x41675C099F32341bf84BFc5382aF534df5C7461a",
  //   multiSendAddress: "0x38869bf66a61cF6bDB996A6aE40D5853Fd43B526",
  //   multiSendCallOnlyAddress: "0x9641d764fc13c8B624c04430C7356C1C7C8102e2",

  // });
}
