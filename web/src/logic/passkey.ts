import { createPasskeyValidator, getPasskeyValidator } from "@zerodev/passkey-validator";
import { ENTRYPOINT_ADDRESS_V07 } from "permissionless";
import { createPublicClient, http } from "viem";


const BUNDLER_URL =
"https://rpc.zerodev.app/api/v2/bundler/ec9a8985-9972-42d4-9879-15e21e4fe3b6"

const SUPABASE_URL = 'https://tpklnjqgdqeneuffftoc.supabase.co';

const publicClient = createPublicClient({
  transport: http(BUNDLER_URL)
})



export async function login() {

  
  return await getPasskeyValidator(publicClient, {
        passkeyServerUrl: import.meta.env.VITE_PASSKEY_SERVER_URL,
        entryPoint: ENTRYPOINT_ADDRESS_V07
    })

}

export async function create(username: string) {
    // Logic for passkey registration
   
        return await createPasskeyValidator(publicClient, {
        passkeyName: username,
        passkeyServerUrl: import.meta.env.VITE_PASSKEY_SERVER_URL,
        entryPoint: ENTRYPOINT_ADDRESS_V07
    })

}


export async function getWebAuthnData() {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/safe-webauthn`, {
      headers: {
        'Content-Type': 'application/json',
        'apikey': import.meta.env.VITE_SUPABASE_KEY,
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_KEY}`,
      },
    });
    const data = await response.json();
    return data;
  }


  export async function getWebAuthnDataByAccount(account: string) {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/safe-webauthn?account=eq.${account}`, {
      headers: {
        'Content-Type': 'application/json',
        'apikey': import.meta.env.VITE_SUPABASE_KEY,
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_KEY}`,
      },
    });
    const data = await response.json();
    return data;
  }


  export async function addWebAuthnData(account: string, enableData: string) {
     await fetch(`${SUPABASE_URL}/rest/v1/safe-webauthn`, {
     method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': import.meta.env.VITE_SUPABASE_KEY,
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_KEY}`,
      },
      body: JSON.stringify({ account: account, enable_data: enableData}),
    });
  }