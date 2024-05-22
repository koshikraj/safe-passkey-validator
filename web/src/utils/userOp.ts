import { BigNumberish, BytesLike,  AddressLike } from 'ethers'
import {  UserOperation } from 'permissionless'
import { Address, Hex, encodeAbiParameters, encodeFunctionData, encodePacked } from 'viem'
import AccountInterface from "../logic/Account.json";



  export type Call = {
    target: string
    value: BigNumberish
    data: string

  }


  export type Action = {
    target: Hex
    value: BigNumberish
    callData: Hex

  }

  export const CALL_TYPE = {
    SINGLE: "0x0000000000000000000000000000000000000000000000000000000000000000",
    BATCH: "0x0100000000000000000000000000000000000000000000000000000000000000",
  };



  export type PackedUserOperation = {
    sender: AddressLike;
    nonce: BigNumberish;
    initCode: BytesLike;
    callData: BytesLike;
    accountGasLimits: BytesLike;
    preVerificationGas: BigNumberish;
    gasFees: BytesLike;
    paymasterAndData: BytesLike;
    signature: BytesLike;
  };


export const EIP712_SAFE_OPERATION_TYPE = {
  SafeOp: [
    { type: 'address', name: 'safe' },
    { type: 'uint256', name: 'nonce' },
    { type: 'bytes', name: 'initCode' },
    { type: 'bytes', name: 'callData' },
    { type: 'uint128', name: 'verificationGasLimit' },
    { type: 'uint128', name: 'callGasLimit' },
    { type: 'uint256', name: 'preVerificationGas' },
    { type: 'uint128', name: 'maxPriorityFeePerGas' },
    { type: 'uint128', name: 'maxFeePerGas' },
    { type: 'bytes', name: 'paymasterAndData' },
    { type: 'uint48', name: 'validAfter' },
    { type: 'uint48', name: 'validUntil' },
    { type: 'address', name: 'entryPoint' },
  ],
}




export function encodeUserOpCallData({
  actions,
}: {
  actions: { target: Address; value: BigNumberish; callData: Hex }[];
}): Hex {
  if (actions.length === 0) {
    throw new Error("No actions");
  } else if (actions.length === 1) {
    const { target, value, callData } = actions[0];
    return encodeFunctionData({
      functionName: "execute",
      abi: AccountInterface.abi,
      args: [
        CALL_TYPE.SINGLE,
        encodePacked(
          ["address", "uint256", "bytes"],
          [target, BigInt(Number(value)), callData]
        ),
      ],
    });
  } else {
    return encodeFunctionData({
      functionName: "execute",
      abi: AccountInterface.abi,
      args: [
        CALL_TYPE.BATCH,
        encodeAbiParameters(
          [
            {
              components: [
                {
                  name: "target",
                  type: "address",
                },
                {
                  name: "value",
                  type: "uint256",
                },
                {
                  name: "callData",
                  type: "bytes",
                },
              ],
              name: "Execution",
              type: "tuple[]",
            },
          ],
          // @ts-ignore
          [actions]
        ),
      ],
    });
  }
}


export const buildUnsignedUserOpTransaction = (
  from: string,
  action: Action,
  nonce: bigint,
): UserOperation<"v0.7"> => {

  const callData =  encodeUserOpCallData({actions: [action]})

  return {
    sender: from as Hex,
    nonce: nonce,
    callData: callData,
    preVerificationGas: BigInt(0),
    verificationGasLimit: BigInt(0),
    callGasLimit: BigInt(0),
    maxPriorityFeePerGas: BigInt(0),
    maxFeePerGas: BigInt(0),
    signature: "0x000000000000000000000000ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff" as Hex,
  }
}
