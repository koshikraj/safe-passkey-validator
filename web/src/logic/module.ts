import { Contract, ZeroAddress, parseEther} from "ethers";
import { BaseTransaction } from '@safe-global/safe-apps-sdk';
import { getSafeInfo, isConnectedToSafe, submitTxs } from "./safeapp";
import { isModuleEnabled, buildEnableModule, buildUpdateFallbackHandler } from "./safe";
import { getJsonRpcProvider, getProvider } from "./web3";
import Safe7579 from "./Safe7579.json"
import SpendLimitSession from "./SpendLimitSession.json"
import WebAuthnValidator from "./WebAuthnValidator.json"
import EntryPoint from "./EntryPoint.json"
import {  publicClient } from "./utils";
import {  buildUnsignedUserOpTransaction } from "@/utils/userOp";
import { createClient, http, Chain, Hex, pad} from "viem";
import { bundlerActions, ENTRYPOINT_ADDRESS_V07, UserOperation, getAccountNonce } from 'permissionless'
import {  createPimlicoPaymasterClient } from "permissionless/clients/pimlico";
import { pimlicoBundlerActions } from 'permissionless/actions/pimlico'
import {  sendUserOperation } from "./permissionless";

// const safe7579Module = "0xbaCA6f74a5549368568f387FD989C279f940f1A5"
const safe7579Module = "0x94952C0Ea317E9b8Bca613490AF25f6185623284"
const webAuthnModule = "0x121A179013f0E6A87A22EFa23dDBbAE2c57a219c"


export const getWebAuthn = async (chainId: string, account: string): Promise<any> => {

    const bProvider = await getJsonRpcProvider(chainId)

    const webAuthnValidator = new Contract(
        webAuthnModule,
        WebAuthnValidator.abi,
        bProvider
    )


    const webAuthnData = await webAuthnValidator.webAuthnValidatorStorage(account);

    return webAuthnData;

}


export const sendTransaction = async (chainId: string, recipient: string, amount: bigint, walletProvider: any, safeAccount: string): Promise<any> => {


    const call = {target: recipient as Hex, value: amount, callData: '0x' as Hex}


    const key = BigInt(pad(webAuthnModule as Hex, {
        dir: "right",
        size: 24,
      }) || 0
    )
    
    const nonce = await getAccountNonce(publicClient(parseInt(chainId)), {
        sender: safeAccount as Hex,
        entryPoint: ENTRYPOINT_ADDRESS_V07,
        key: key
    })


    let unsignedUserOp = buildUnsignedUserOpTransaction(
        safeAccount as Hex,
        call,
        nonce,
      )

      unsignedUserOp.signature = await walletProvider.getDummySignature(unsignedUserOp);

    const userOperationHash = await sendUserOperation(chainId, unsignedUserOp, walletProvider.signUserOperation )

    // const entryPoint = new Contract(
    //     ENTRYPOINT_ADDRESS_V07,
    //     EntryPoint.abi,
    //     bProvider
    // )
    // let typedDataHash = getBytes(await entryPoint.getUserOpHash(getPackedUserOperation(sponsoredUserOperation)))
    // sponsoredUserOperation.signature = await walletClient.signMessage({account: walletProvider.address , message:  { raw: typedDataHash}}) as `0x${string}`

    return userOperationHash;

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
        data: (await safeValidator.installModule.populateTransaction(1, webAuthnModule, enableData as Hex)).data
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
        data: (await safeValidator.installModule.populateTransaction(2, webAuthnModule, '0x')).data
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
        webAuthnModule,
        SpendLimitSession.abi,
        bProvider
    )

    return {
        to: webAuthnModule,
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
