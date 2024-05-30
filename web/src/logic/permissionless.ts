import { base, celo, gnosis, sepolia, baseGoerli, goerli, polygon, baseSepolia } from 'viem/chains';
import { http, createPublicClient, Chain, createWalletClient, SendTransactionParameters, extractChain, createClient, Hex } from "viem"
import { createBundlerClient, createSmartAccountClient, ENTRYPOINT_ADDRESS_V07, ENTRYPOINT_ADDRESS_V06, bundlerActions, UserOperation} from 'permissionless';
import { createPimlicoPaymasterClient, createPimlicoBundlerClient  } from "permissionless/clients/pimlico";

/**
 * Retrieves the chain object based on the given chainId.
 * @param chainId - The ID of the chain.
 * @returns The chain object.
 */
export const getChain = (chainId: string) : Chain => {
  return [base, celo, gnosis, sepolia, baseGoerli, goerli, polygon, baseSepolia].find((chain: any) => chain.id == chainId) as Chain;
}

/**
 * Prepares the user operation for gas sponsorship and execution.
 * @param unsignedUserOp - The unsigned user operation.
 * @returns The sponsored user operation.
 */
export const sendUserOperation = async (chainId: string, unsignedUserOp: UserOperation<"v0.7">, userOpSigner: any ) => {

  const chain = getChain(chainId);

  const pimlicoEndpoint = `https://api.pimlico.io/v2/${chain.name.toLowerCase().replace(/\s+/g, '-')}/rpc?apikey=${import.meta.env.VITE_PIMLICO_API_KEY}`;


  const pimlicoBundlerClient = createPimlicoBundlerClient({ 
      transport: http(pimlicoEndpoint),
      entryPoint: ENTRYPOINT_ADDRESS_V07
    });

  const paymasterClient = createPimlicoPaymasterClient({
    transport: http(pimlicoEndpoint),
    entryPoint: ENTRYPOINT_ADDRESS_V07,
  });


  const gasPrice = await pimlicoBundlerClient.getUserOperationGasPrice();

  unsignedUserOp.maxFeePerGas = gasPrice.fast.maxFeePerGas;
  unsignedUserOp.maxPriorityFeePerGas = gasPrice.fast.maxPriorityFeePerGas;


  const sponsorUserOperationResult = await paymasterClient.sponsorUserOperation({
    userOperation: unsignedUserOp
  });

  const sponsoredUserOperation: UserOperation<"v0.7"> = {
    ...unsignedUserOp,
    ...sponsorUserOperationResult,
  };


  sponsoredUserOperation.signature  = await userOpSigner(sponsoredUserOperation)

  const userOperationHash = await pimlicoBundlerClient.sendUserOperation({
      userOperation: sponsoredUserOperation,

  })

  return userOperationHash;
}

export const waitForExecution = async (chainId: string, userOperationHash: string) => {

  const chain = getChain(chainId);

  const pimlicoEndpoint = `https://api.pimlico.io/v2/${chain.name.toLowerCase().replace(/\s+/g, '-')}/rpc?apikey=${import.meta.env.VITE_PIMLICO_API_KEY}`;


  const pimlicoBundlerClient = createPimlicoBundlerClient({ 
    transport: http(pimlicoEndpoint),
    entryPoint: ENTRYPOINT_ADDRESS_V07
  });


  const receipt = await pimlicoBundlerClient.waitForUserOperationReceipt({ hash: userOperationHash as Hex })

  return receipt;

}






  