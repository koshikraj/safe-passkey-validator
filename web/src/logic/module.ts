import { Contract, ZeroAddress, parseEther, parseUnits, getBytes, JsonRpcProvider, toBeHex, Interface } from "ethers";
import { ethers, utils } from 'ethersv5';
import { BaseTransaction } from '@safe-global/safe-apps-sdk';
import { getSafeInfo, isConnectedToSafe, submitTxs } from "./safeapp";
import { isModuleEnabled, buildEnableModule, isGuardEnabled, buildEnableGuard, buildUpdateFallbackHandler } from "./safe";
import { getJsonRpcProvider, getProvider } from "./web3";
import Safe7579 from "./Safe7579.json"
import SpendLimitSession from "./SpendLimitSession.json"
import WebAuthnValidator from "./WebAuthnValidator.json"
import EntryPoint from "./EntryPoint.json"
import { getTokenDecimals, publicClient } from "./utils";
import {  buildUnsignedUserOpTransaction } from "@/utils/userOp";
import { createClient, http, Chain, Hex, pad, custom, createWalletClient, createPublicClient } from "viem";
import { sepolia } from 'viem/chains'
import { bundlerActions, ENTRYPOINT_ADDRESS_V07, getPackedUserOperation, UserOperation, getAccountNonce } from 'permissionless'
import {  createPimlicoPaymasterClient } from "permissionless/clients/pimlico";
import { pimlicoBundlerActions, pimlicoPaymasterActions } from 'permissionless/actions/pimlico'
import { privateKeyToAccount } from "viem/accounts";
import { EIP1193Provider } from "@privy-io/react-auth";
import { getPasskeyValidator } from "@zerodev/passkey-validator";

const safe7579Module = "0xbaCA6f74a5549368568f387FD989C279f940f1A5"
const spendLimitModule = "0xD990393C670dCcE8b4d8F858FB98c9912dBFAa06"



export const getWebAuthn = async (chainId: string, account: string): Promise<any> => {


    const bProvider = await getJsonRpcProvider(chainId)

    const webAuthnValidator = new Contract(
        spendLimitModule,
        WebAuthnValidator.abi,
        bProvider
    )


    const webAuthnData = await webAuthnValidator.webAuthnValidatorStorage(account);

    return webAuthnData;

}





export const sendTransaction = async (chainId: string, recipient: string, amount: bigint, walletProvider: any, safeAccount: string): Promise<any> => {

    const provider = await getProvider()
    // Updating the provider RPC if it's from the Safe App.
    // const chainId = (await provider.getNetwork()).chainId.toString()
    const bProvider = await getJsonRpcProvider(chainId)




    const call = {target: recipient as Hex, value: amount, callData: '0x' as Hex}

    console.log(call)


    const key = BigInt(pad(spendLimitModule as Hex, {
        dir: "right",
        size: 24,
      }) || 0
    )
    
    const nonce = await getAccountNonce(publicClient(parseInt(chainId)), {
        sender: safeAccount as Hex,
        entryPoint: ENTRYPOINT_ADDRESS_V07,
        key: key
    })


    let sessionOp = buildUnsignedUserOpTransaction(
        safeAccount as Hex,
        call,
        nonce,
      )


      console.log(sessionOp)

    const entryPoint = new Contract(
        ENTRYPOINT_ADDRESS_V07,
        EntryPoint.abi,
        bProvider
    )


    const chain = "sepolia" 


    const pimlicoEndpoint = `https://api.pimlico.io/v2/${chain}/rpc?apikey=${import.meta.env.VITE_PIMLICO_API_KEY}`


    const bundlerClient = createClient({
        transport: http(pimlicoEndpoint),
        chain: sepolia as Chain,
    })
        .extend(bundlerActions(ENTRYPOINT_ADDRESS_V07))
        .extend(pimlicoBundlerActions(ENTRYPOINT_ADDRESS_V07))

     const paymasterClient = createPimlicoPaymasterClient({
        transport: http(pimlicoEndpoint),
        entryPoint: ENTRYPOINT_ADDRESS_V07,
    })
    
     


    const gasPrice = await bundlerClient.getUserOperationGasPrice()


    sessionOp.maxFeePerGas = gasPrice.fast.maxFeePerGas;
    sessionOp.maxPriorityFeePerGas = gasPrice.fast.maxPriorityFeePerGas;

    sessionOp.signature = await walletProvider.getDummySignature(sessionOp);



    const sponsorUserOperationResult = await paymasterClient.sponsorUserOperation({
        userOperation: sessionOp
    })



   
    const sponsoredUserOperation: UserOperation<"v0.7"> = {
        ...sessionOp,
        ...sponsorUserOperationResult,
    }


    // let typedDataHash = getBytes(await entryPoint.getUserOpHash(getPackedUserOperation(sponsoredUserOperation)))

 
    // sponsoredUserOperation.signature = await walletClient.signMessage({account: walletProvider.address , message:  { raw: typedDataHash}}) as `0x${string}`


    sponsoredUserOperation.signature  = await walletProvider.signUserOperation(sponsoredUserOperation)

    const userOperationHash = await bundlerClient.sendUserOperation({
        userOperation: sponsoredUserOperation,

    })

    return userOperationHash;

}


export const waitForExecution = async (userOperationHash: string) => {


    const chain = "sepolia" 


    const pimlicoEndpoint = `https://api.pimlico.io/v2/${chain}/rpc?apikey=${import.meta.env.VITE_PIMLICO_API_KEY}`


    const bundlerClient = createClient({
        transport: http(pimlicoEndpoint),
        chain: sepolia as Chain,
    })
        .extend(bundlerActions(ENTRYPOINT_ADDRESS_V07))
        .extend(pimlicoBundlerActions(ENTRYPOINT_ADDRESS_V07))

     const paymasterClient = createPimlicoPaymasterClient({
        transport: http(pimlicoEndpoint),
        entryPoint: ENTRYPOINT_ADDRESS_V07,
    })
    

    const receipt = await bundlerClient.waitForUserOperationReceipt({ hash: userOperationHash as Hex })

    return receipt;

}




const buildInitSafe7579 = async ( ): Promise<BaseTransaction> => {

    
    const info = await getSafeInfo()

    const provider = await getProvider()
    // Updating the provider RPC if it's from the Safe App.
    const chainId = (await provider.getNetwork()).chainId.toString()
    const bProvider = await getJsonRpcProvider(chainId)

    const safeValidator = new Contract(
        safe7579Module,
        Safe7579.abi,
        bProvider
    )

    return {
        to: safe7579Module,
        value: "0",
        data: (await safeValidator.initializeAccount.populateTransaction([], [], [], [], {registry: ZeroAddress, attesters: [], threshold: 0})).data
    }
}




const buildInstallValidator = async (enableData: string): Promise<BaseTransaction> => {

    
    const info = await getSafeInfo()

    const provider = await getProvider()
    // Updating the provider RPC if it's from the Safe App.
    const chainId = (await provider.getNetwork()).chainId.toString()
    const bProvider = await getJsonRpcProvider(chainId)

    const safeValidator = new Contract(
        safe7579Module,
        Safe7579.abi,
        bProvider
    )

    return {
        to: info.safeAddress,
        value: "0",
        data: (await safeValidator.installModule.populateTransaction(1, spendLimitModule, enableData as Hex)).data
    }
}


const buildInstallExecutor = async ( ): Promise<BaseTransaction> => {

    
    const info = await getSafeInfo()

    const provider = await getProvider()
    // Updating the provider RPC if it's from the Safe App.
    const chainId = (await provider.getNetwork()).chainId.toString()
    const bProvider = await getJsonRpcProvider(chainId)

    const safeValidator = new Contract(
        safe7579Module,
        Safe7579.abi,
        bProvider
    )

    return {
        to: info.safeAddress,
        value: "0",
        data: (await safeValidator.installModule.populateTransaction(2, spendLimitModule, '0x')).data
    }
}






const buildAddSessionKey = async (sessionKey: string, token: string, amount: string, refreshInterval: number, validAfter: number, validUntil: number ): Promise<BaseTransaction> => {

    
    const info = await getSafeInfo()

    const sessionData = {account: info.safeAddress, validAfter: validAfter, validUntil: validUntil, limitAmount: parseEther(amount), limitUsed: 0, lastUsed: 0, refreshInterval: refreshInterval }

    const provider = await getProvider()
    // Updating the provider RPC if it's from the Safe App.
    const chainId = (await provider.getNetwork()).chainId.toString()
    const bProvider = await getJsonRpcProvider(chainId)

    const spendLimit = new Contract(
        spendLimitModule,
        SpendLimitSession.abi,
        bProvider
    )

    return {
        to: spendLimitModule,
        value: "0",
        data: (await spendLimit.addSessionKey.populateTransaction(sessionKey, token, sessionData)).data
    }
}



export const createSessionKey = async (enableData: string ): Promise<{address: string, privateKey: string}> => {

    
    if (!await isConnectedToSafe()) throw Error("Not connected to a Safe")

    const info = await getSafeInfo()

    const txs: BaseTransaction[] = []



    if (!await isModuleEnabled(info.safeAddress, safe7579Module)) {
        txs.push(await buildEnableModule(info.safeAddress, safe7579Module))
        txs.push(await buildUpdateFallbackHandler(info.safeAddress, safe7579Module))
        txs.push(await buildInitSafe7579())

        txs.push(await buildInstallValidator(enableData))
    }


    // txs.push(await buildAddSessionKey(address, token, amount, refreshInterval, validAfter, validUntil))

    const provider = await getProvider()
    // Updating the provider RPC if it's from the Safe App.
    const chainId = (await provider.getNetwork()).chainId.toString()

    if (txs.length == 0) return {address: '', privateKey: ''}
    await submitTxs(txs)

    return {address: '', privateKey: ''}
}
